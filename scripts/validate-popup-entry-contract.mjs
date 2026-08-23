import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('apps/extension/src/entrypoints/popup/App.svelte', 'utf8');
const css = await readFile('apps/extension/src/entrypoints/popup/session-13-compat.css', 'utf8');
const externalIndex = app.indexOf('data-popup-external-profile');
const dividerIndex = app.indexOf('{#if index === 2}<div class="profile-divider"');
assert.ok(
  externalIndex >= 0 && externalIndex < dividerIndex,
  'external row must precede user divider',
);
assert.ok(
  app.includes("externalProfileName = proxyOwnership?.externalProfile?.suggestedName ?? ''"),
);
assert.ok(app.includes('onblur={() => void importExternalProfile()}'));
assert.ok(!app.includes('class="external-profile-actions"'));
assert.match(app, /\{#if !proxyOwnership\?\.blocked\}[\s\S]*?<footer class="popup-footer">/u);
assert.ok(
  !app.includes('{#if !loading && !proxyOwnership?.blocked}'),
  'loading state must retain the original Options footer',
);
assert.ok(css.includes('.proxy-not-controllable'));
assert.ok(css.includes('.external-profile-form input'));
console.log('Popup entry-state source contract passed.');
