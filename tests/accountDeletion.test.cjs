const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(
  readFileSync(resolve(__dirname, '../src/services/authService.ts'), 'utf8'),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText;

function setup({ verificationError, changeSession = false } = {}) {
  const calls = [];
  const user = { uid: 'user-1', email: 'player@example.com' };
  const Auth = { currentUser: user };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === './firebase') return { Auth };
      if (name === './errorService') return { SwingBadRequestError: Error };
      if (name === './userService')
        return { userService: { deleteUserById: async (id) => calls.push(['profile', id]) } };
      assert.equal(name, 'firebase/auth');
      return {
        EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
        reauthenticateWithCredential: async (account, credential) => {
          calls.push(['verify', account.uid, credential.email, credential.password]);
          if (verificationError) throw verificationError;
          if (changeSession) Auth.currentUser = { uid: 'other-user' };
        },
        deleteUser: async (account) => calls.push(['auth', account.uid]),
      };
    },
  });
  return { service: exports.authService, Auth, calls };
}

test('deletion verifies the current account password before deleting any data', async () => {
  const { service, calls } = setup();
  await service.deleteAccount(' password with spaces ');
  assert.deepEqual(calls, [
    ['verify', 'user-1', 'player@example.com', ' password with spaces '],
    ['profile', 'user-1'],
    ['auth', 'user-1'],
  ]);
});

test('incorrect passwords and network failures cannot delete any data', async () => {
  for (const code of [
    'auth/invalid-credential',
    'auth/wrong-password',
    'auth/network-request-failed',
  ]) {
    const error = Object.assign(new Error('Verification failed'), { code });
    const { service, calls } = setup({ verificationError: error });
    await assert.rejects(service.deleteAccount('incorrect'), (cause) => cause === error);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'verify');
  }
});

test('missing password, missing session, or missing email cannot delete data', async () => {
  for (const condition of ['password', 'session', 'email']) {
    const { service, Auth, calls } = setup();
    if (condition === 'session') Auth.currentUser = null;
    if (condition === 'email') Auth.currentUser.email = null;
    await assert.rejects(service.deleteAccount(condition === 'password' ? '' : 'password'));
    assert.equal(calls.length, 0);
  }
});

test('a session change during verification blocks deletion', async () => {
  const { service, calls } = setup({ changeSession: true });
  await assert.rejects(service.deleteAccount('password'), /session changed/);
  assert.equal(calls.length, 1);
});
