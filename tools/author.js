'use strict';
const authorManager = require('ep_etherpad-lite/node/db/AuthorManager');

/**
 * Resolve the author a tool call writes as. With `authorMapper` the author is
 * the one mapped to that key, created on first use, as the HTTP API's
 * `createAuthorIfNotExistsFor` does; `authorName` sets its name when given.
 * Without it every call gets a fresh author, the original behaviour.
 */
const resolveAuthor = async ({authorMapper, authorName}) => {
  const author = authorMapper
    ? await authorManager.createAuthorIfNotExistsFor(authorMapper, authorName)
    : await authorManager.createAuthor(authorName || 'AI (MCP)');
  return author.authorID;
};

const authorSchema = (z) => ({
  authorMapper: z.string().optional().describe(
      'Stable key for the author, as in the HTTP API createAuthorIfNotExistsFor: ' +
      'calls with the same key are attributed to the same author, with the same colour. ' +
      'Omit for a fresh author per call'),
  authorName: z.string().optional().describe(
      'Author name; with authorMapper it sets the mapped author\'s name'),
});

exports.resolveAuthor = resolveAuthor;
exports.authorSchema = authorSchema;
