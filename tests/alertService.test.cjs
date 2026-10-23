const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const exportsObject = {};
const compiled = ts.transpileModule(
  readFileSync(resolve(__dirname, '../src/services/alertService.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
runInNewContext(compiled, { exports: exportsObject, RangeError });
const { createAlertService } = exportsObject;

test('an informational alert gets an OK action and closes without a callback', () => {
  const service = createAlertService();
  service.alert('Saved', 'Your changes are ready.');
  const alert = service.getSnapshot();
  assert.equal(alert.title, 'Saved');
  assert.equal(alert.message, 'Your changes are ready.');
  assert.equal(alert.buttons.length, 1);
  assert.equal(alert.buttons[0].text, 'OK');
  assert.equal(alert.visible, true);
  service.press(alert.id, 0);
  assert.equal(service.getSnapshot().visible, false);
  service.finishDismissal(alert.id);
  assert.equal(service.getSnapshot(), null);
});

test('two actions preserve order and custom colors without retaining mutable caller objects', () => {
  const service = createAlertService();
  const buttons = [
    { text: 'Delete', style: 'destructive', color: '#B42318', backgroundColor: '#FFF1F0' },
    { text: 'Cancel', style: 'cancel' },
  ];
  const options = { cancelable: true };
  service.alert('Delete match?', 'This cannot be undone.', buttons, options);
  buttons[0].text = 'Changed';
  options.cancelable = false;
  const alert = service.getSnapshot();
  assert.equal(alert.buttons[0].text, 'Delete');
  assert.equal(alert.buttons[0].style, 'destructive');
  assert.equal(alert.buttons[0].color, '#B42318');
  assert.equal(alert.buttons[0].backgroundColor, '#FFF1F0');
  assert.equal(alert.buttons[1].style, 'cancel');
  assert.equal(alert.options.cancelable, true);
  assert.throws(() => service.alert('Too many', '', [{}, {}, {}]), RangeError);
});

test('actions run once after dismissal and stale events cannot close the next alert', () => {
  const service = createAlertService();
  let deleted = 0;
  service.alert('Delete?', '', [
    { text: 'Delete', style: 'destructive', onPress: () => deleted++ },
    { text: 'Cancel', style: 'cancel' },
  ]);
  const first = service.getSnapshot();
  service.alert('Next');
  service.finishDismissal(first.id);
  assert.equal(service.getSnapshot(), first);
  service.press(first.id, 0);
  service.press(first.id, 0);
  service.press(first.id, 1);
  assert.equal(deleted, 0);
  service.finishDismissal(first.id);
  assert.equal(deleted, 1);
  const next = service.getSnapshot();
  assert.equal(next.title, 'Next');
  service.press(first.id, 0);
  service.dismiss(first.id);
  service.finishDismissal(first.id);
  assert.equal(service.getSnapshot(), next);
  assert.equal(deleted, 1);
});

test('passive dismissal respects cancelable and never invokes an action', () => {
  const service = createAlertService();
  let actions = 0;
  let dismissals = 0;
  const buttons = [{ text: 'Delete', style: 'destructive', onPress: () => actions++ }];
  service.alert('Protected', '', buttons);
  const protectedAlert = service.getSnapshot();
  service.dismiss(protectedAlert.id);
  service.escape(protectedAlert.id);
  assert.equal(service.getSnapshot(), protectedAlert);
  service.press(protectedAlert.id, 0);
  service.finishDismissal(protectedAlert.id);
  assert.equal(actions, 1);

  service.alert('Dismissible', '', buttons, {
    cancelable: true,
    onDismiss: () => dismissals++,
  });
  const dismissible = service.getSnapshot();
  service.dismiss(dismissible.id);
  assert.equal(dismissals, 0);
  service.finishDismissal(dismissible.id);
  assert.equal(dismissals, 1);
  assert.equal(actions, 1);
});

test('Escape selects only the cancel action and allows a callback to open a follow-up alert', () => {
  const service = createAlertService();
  let deleted = false;
  service.alert('Delete?', '', [
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        deleted = true;
      },
    },
    { text: 'Cancel', style: 'cancel', onPress: () => service.alert('Kept your match') },
  ]);
  const first = service.getSnapshot();
  service.escape(first.id);
  service.finishDismissal(first.id);
  assert.equal(deleted, false);
  assert.equal(service.getSnapshot().title, 'Kept your match');
});

test('subscribers see stable snapshots and can unsubscribe', () => {
  const service = createAlertService();
  let notifications = 0;
  const unsubscribe = service.subscribe(() => notifications++);
  service.alert('First');
  const first = service.getSnapshot();
  service.alert('Second');
  assert.equal(notifications, 1);
  assert.equal(service.getSnapshot(), first);
  service.press(first.id, 0);
  service.finishDismissal(first.id);
  assert.equal(notifications, 3);
  unsubscribe();
  service.press(service.getSnapshot().id, 0);
  assert.equal(notifications, 3);
});
