const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const compiled = ts.transpileModule(
  readFileSync(resolve(__dirname, '../src/services/matchService/matchService.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function setup(records = [], serverError) {
  const requests = [];
  const exports = {};
  const parsedError = new Error('Couldn’t load your matches.');
  const firestore = {
    collection: (_, path) => path,
    where: (field, operator, value) => ({ field, operator, value }),
    or: (...conditions) => ({ conditions }),
    query: (path, filter) => ({ path, filter }),
    getDocsFromServer: async (request) => {
      requests.push(request);
      if (serverError) throw serverError;
      assert.equal(request.path, 'Matches');
      return {
        docs: records
          .filter(({ data }) =>
            request.filter.conditions.some(({ field, operator, value }) =>
              operator === 'array-contains' ? data[field]?.includes(value) : data[field] === value,
            ),
          )
          .map(({ id, data }) => ({ id, data: () => data })),
      };
    },
  };
  runInNewContext(compiled, {
    exports,
    console: { error() {} },
    require: (name) => {
      if (name === 'firebase/firestore') return firestore;
      if (name === '../firebase') return { Database: {} };
      if (name === '../authService') return { authService: {} };
      assert.equal(name, '../errorService');
      return {
        SwingBadRequestError: Error,
        SwingError: { parse: (error) => (serverError === error ? parsedError : error) },
      };
    },
  });
  return { service: exports.matchService, requests, parsedError };
}

function record(id, userId, members, startsAt) {
  return {
    id,
    data: { id: 'outdated-stored-id', userId, members, startsAt: { toMillis: () => startsAt } },
  };
}

test('user matches include all hosted and joined matches, sorted by time with real document IDs', async () => {
  const { service, requests } = setup([
    record('hosted-without-members', 'viewer', [], 300),
    record('unrelated', 'other', ['someone-else'], 200),
    record('joined', 'other', ['viewer'], 250),
    record('past-hosted-and-member', 'viewer', ['viewer'], 100),
    record('past-joined', 'other', ['viewer'], 150),
  ]);
  const matches = await service.getMatchesForUser('viewer');
  assert.deepEqual(
    Array.from(matches, (match) => match.id),
    ['past-hosted-and-member', 'past-joined', 'joined', 'hosted-without-members'],
  );
  assert.equal(requests.length, 1);
});

test('a user with no matches receives an empty list', async () => {
  const { service } = setup([record('other-match', 'other', [], 100)]);
  assert.equal((await service.getMatchesForUser('viewer')).length, 0);
});

test('an empty user ID cannot fetch matches', async () => {
  const { service, requests } = setup();
  await assert.rejects(service.getMatchesForUser(''), /sign in/);
  assert.equal(requests.length, 0);
});

test('server errors are propagated as readable errors for the retry state', async () => {
  const { service, parsedError } = setup([], new Error('permission-denied'));
  await assert.rejects(service.getMatchesForUser('viewer'), (error) => error === parsedError);
});
