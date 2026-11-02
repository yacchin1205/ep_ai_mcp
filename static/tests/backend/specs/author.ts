'use strict';

import {strict as assert} from 'assert';

const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
const authorManager = require('ep_etherpad-lite/node/db/AuthorManager');
const padManager = require('ep_etherpad-lite/node/db/PadManager');

const SYSTEM_AUTHOR_ID = 'a.etherpad-system';

// The tool handlers are registered on an MCP server object; capture them
// with a stub server so they can be exercised without an MCP session.
const loadTools = () => {
  const tools: {[name: string]: (args: any) => Promise<any>} = {};
  require('../../../../tools/editing')({
    tool: (name: string, desc: string, schema: any, handler: any) => {
      tools[name] = handler;
    },
  });
  return tools;
};

const padAuthors = (pad: any) =>
  pad.getAllAuthors().filter((id: string) => id !== SYSTEM_AUTHOR_ID);

describe('ep_ai_mcp - authorMapper', function () {
  it('edit_pad writes as one author per mapper', async function () {
    const padId = `test-mcp-${randomString(10)}`;
    await padManager.getPad(padId, 'Hello\n');
    const mapper = `test-mapper-${randomString(10)}`;
    const tools = loadTools();
    await tools.edit_pad({padId, action: 'append', text: '\nfirst', authorMapper: mapper, authorName: 'Agent'});
    await tools.edit_pad({padId, action: 'append', text: '\nsecond', authorMapper: mapper});

    const {authorID} = await authorManager.createAuthorIfNotExistsFor(mapper);
    const pad = await padManager.getPad(padId);
    assert.deepEqual(padAuthors(pad), [authorID]);
    assert.equal(await authorManager.getAuthorName(authorID), 'Agent');
  });

  it('edit_pad without a mapper creates an author per call', async function () {
    const padId = `test-mcp-${randomString(10)}`;
    await padManager.getPad(padId, 'Hello\n');
    const tools = loadTools();
    await tools.edit_pad({padId, action: 'append', text: '\nfirst'});
    await tools.edit_pad({padId, action: 'append', text: '\nsecond'});
    const pad = await padManager.getPad(padId);
    assert.equal(padAuthors(pad).length, 2);
  });

  it('create_pad attributes the initial text to the mapped author', async function () {
    const padId = `test-mcp-${randomString(10)}`;
    const mapper = `test-mapper-${randomString(10)}`;
    await loadTools().create_pad({padId, text: 'Hello', authorMapper: mapper});
    const {authorID} = await authorManager.createAuthorIfNotExistsFor(mapper);
    const pad = await padManager.getPad(padId);
    assert.deepEqual(pad.getAllAuthors(), [authorID]);
  });
});
