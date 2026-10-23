const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

// Exercise the actual service in Node while replacing only the shared alert entry point.
const alerts = [];
const exportsObject = {};
const source = readFileSync(resolve(__dirname, '../src/services/errorService.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
runInNewContext(compiled, {
  exports: exportsObject,
  require: (name) => {
    assert.equal(name, './alertService');
    return { AppAlert: { alert: (...args) => alerts.push(args) } };
  },
});

const {
  SwingError,
  SwingBadRequestError,
  SwingInternalServerError,
  SwingNotFoundError,
  errorService,
} = exportsObject;

test('typed errors preserve display copy, type, and cause without showing an alert', () => {
  const cause = new Error('original');
  for (const [ErrorClass, type, status, title] of [
    [SwingNotFoundError, 'not-found', 404, 'Not found'],
    [SwingBadRequestError, 'bad-request', 400, 'Please check your request'],
    [SwingInternalServerError, 'internal-server', 500, 'Something went wrong'],
  ]) {
    const error = new ErrorClass('  A helpful message.  ', { cause, code: 'example' });
    assert.ok(error instanceof SwingError);
    assert.equal(error.name, ErrorClass.name);
    assert.equal(error.type, type);
    assert.equal(error.status, status);
    assert.equal(error.title, title);
    assert.equal(error.message, 'A helpful message.');
    assert.equal(error.code, 'example');
    assert.equal(error.cause, cause);
    assert.equal(SwingError.parse(error), error);
    assert.ok(new ErrorClass('   ').message.length > 0);
  }
  assert.equal(alerts.length, 0);
});

test('Firebase auth, Firestore, and Storage codes produce readable typed errors', () => {
  for (const [code, ErrorClass, message] of [
    ['auth/invalid-credential', SwingBadRequestError, /email or password is incorrect/],
    ['auth/email-already-in-use', SwingBadRequestError, /already exists/],
    ['auth/weak-password', SwingBadRequestError, /at least 6 characters/],
    ['auth/requires-recent-login', SwingBadRequestError, /log out and sign in again/],
    ['permission-denied', SwingBadRequestError, /permission/],
    ['firestore/not-found', SwingNotFoundError, /no longer available/],
    ['storage/object-not-found', SwingNotFoundError, /file is no longer available/],
    ['auth/network-request-failed', SwingInternalServerError, /internet connection/],
    ['unavailable', SwingInternalServerError, /connect right now/],
    ['deadline-exceeded', SwingInternalServerError, /took too long/],
  ]) {
    const original = { code, message: `Firebase: Error (${code}).` };
    const parsed = SwingError.parse(original);
    assert.ok(parsed instanceof ErrorClass);
    assert.match(parsed.message, message);
    assert.equal(parsed.cause, original);
    assert.equal(parsed.code, code);
    assert.doesNotMatch(parsed.message, /Firebase|auth\/|firestore\/|storage\//);
  }
  assert.match(
    SwingError.parse(new Error('Firebase: Error (auth/invalid-email).')).message,
    /valid email/,
  );
});

test('HTTP errors use status, preserve validation feedback, and hide server details', () => {
  assert.ok(SwingError.parse({ status: 404 }) instanceof SwingNotFoundError);
  assert.match(SwingError.parse({ statusCode: 401 }).message, /sign in again/);
  assert.match(SwingError.parse({ response: { status: 403 } }).message, /permission/);
  assert.match(SwingError.parse({ status: 429 }).message, /wait a moment/);
  assert.match(SwingError.parse({ status: 504 }).message, /took too long/);

  const validation = SwingError.parse({
    message: 'Request failed with status code 422',
    response: { status: 422, data: { error: { message: 'Choose a future start time.' } } },
  });
  assert.ok(validation instanceof SwingBadRequestError);
  assert.equal(validation.message, 'Choose a future start time.');

  for (const status of [400, 500, 503]) {
    const parsed = SwingError.parse({
      response: { status, data: { message: '<html>Internal database error</html>' } },
    });
    assert.doesNotMatch(parsed.message, /html|database/);
  }
  assert.doesNotMatch(
    SwingError.parse({ status: 500, message: 'SQL table Users is missing' }).message,
    /SQL|Users/,
  );
});

test('network errors, timeouts, and unknown thrown values have safe fallbacks', () => {
  for (const error of [
    new TypeError('Network request failed'),
    'Failed to fetch',
    { code: 'ERR_NETWORK' },
  ]) {
    assert.match(SwingError.parse(error).message, /internet connection/);
  }
  assert.match(SwingError.parse(new Error('Request timed out')).message, /took too long/);
  const cyclic = {};
  cyclic.error = cyclic;
  for (const error of [
    null,
    undefined,
    42,
    {},
    cyclic,
    { code: 'constructor' },
    { status: Symbol() },
    new Error('secret stack details'),
  ]) {
    const parsed = errorService.parse(error);
    assert.ok(parsed instanceof SwingInternalServerError);
    assert.equal(parsed.title, 'Something went wrong');
    assert.doesNotMatch(parsed.message, /secret|stack/);
  }
});

test('shared alerts receive the parsed header/message and preserve action callbacks', () => {
  alerts.length = 0;
  errorService.showAlert({ code: 'auth/invalid-email' });
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0][0], 'Please check your request');
  assert.equal(alerts[0][1], 'Enter a valid email address.');
  assert.equal(alerts[0][2][0].text, 'OK');

  let retried = false;
  const buttons = [
    {
      text: 'Retry',
      onPress: () => {
        retried = true;
      },
    },
  ];
  const options = { cancelable: true };
  new SwingNotFoundError('This match is no longer available.').showAlert(buttons, options);
  assert.equal(alerts.length, 2);
  assert.equal(alerts[1][0], 'Not found');
  assert.equal(alerts[1][1], 'This match is no longer available.');
  assert.equal(alerts[1][2], buttons);
  assert.equal(alerts[1][3], options);
  alerts[1][2][0].onPress();
  assert.ok(retried);
});
