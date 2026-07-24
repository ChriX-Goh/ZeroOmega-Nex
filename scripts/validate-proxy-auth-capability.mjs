import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(rootDir, 'fixtures', 'capabilities', 'proxy-auth-mv3.json');
const data = JSON.parse(await readFile(fixturePath, 'utf8'));

function fail(message) {
  throw new Error(`proxy-auth-mv3.json: ${message}`);
}

function assertExactArray(actual, expected, location) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${location} must equal ${JSON.stringify(expected)}`);
  }
}

if (data.capabilitySchemaVersion !== 1) {
  fail('capabilitySchemaVersion must equal 1');
}
if (data.feature !== 'browser-proxy-authentication') {
  fail('feature must remain browser-proxy-authentication');
}
if (data.implementationStatus !== 'research-only') {
  fail('implementationStatus must remain research-only in Milestone 2');
}

if (data.sharedAsyncBlockingBaseline?.chromiumMinimumVersion !== 120) {
  fail('Chromium asyncBlocking baseline must remain 120');
}
if (data.sharedAsyncBlockingBaseline?.firefoxMinimumVersion !== 128) {
  fail('Firefox asyncBlocking baseline must remain 128');
}

const chromium = data.platforms?.chromium;
const firefox = data.platforms?.firefox;
if (chromium?.manifestVersion !== 3 || chromium.backgroundEnvironment !== 'service-worker') {
  fail('Chromium must use a Manifest V3 service worker');
}
if (firefox?.manifestVersion !== 3 || firefox.backgroundEnvironment !== 'event-page') {
  fail('Firefox must use a Manifest V3 event page');
}

assertExactArray(
  chromium.requiredPermissions,
  ['proxy', 'webRequest', 'webRequestAuthProvider'],
  'platforms.chromium.requiredPermissions',
);
assertExactArray(
  firefox.requiredPermissions,
  ['proxy', 'webRequest', 'webRequestAuthProvider', 'webRequestBlocking'],
  'platforms.firefox.requiredPermissions',
);
assertExactArray(
  chromium.optionalHostPermissions,
  ['<all_urls>'],
  'platforms.chromium.optionalHostPermissions',
);
assertExactArray(
  firefox.optionalHostPermissions,
  ['<all_urls>'],
  'platforms.firefox.optionalHostPermissions',
);
assertExactArray(
  chromium.forbiddenPermissions,
  ['webRequestBlocking'],
  'platforms.chromium.forbiddenPermissions',
);
assertExactArray(firefox.forbiddenPermissions, [], 'platforms.firefox.forbiddenPermissions');

if (chromium.responseMode !== 'asyncBlocking-callback') {
  fail('Chromium responseMode must use the callback contract');
}
if (firefox.responseMode !== 'asyncBlocking-callback') {
  fail('Firefox responseMode must use the shared callback contract');
}

const listener = data.listener;
if (listener?.event !== 'webRequest.onAuthRequired') {
  fail('the only allowed listener event must be webRequest.onAuthRequired');
}
assertExactArray(listener.filterUrls, ['<all_urls>'], 'listener.filterUrls');
assertExactArray(listener.extraInfoSpec, ['asyncBlocking'], 'listener.extraInfoSpec');
assertExactArray(listener.allowedProxySchemes, ['http', 'https'], 'listener.allowedProxySchemes');
assertExactArray(
  listener.unsupportedProxySchemes,
  ['socks4', 'socks5'],
  'listener.unsupportedProxySchemes',
);
for (const field of ['topLevelRegistration', 'proxyChallengeOnly', 'callbackAtMostOnce']) {
  if (listener[field] !== true) {
    fail(`listener.${field} must equal true`);
  }
}

assertExactArray(
  data.forbiddenEvents,
  [
    'webRequest.onBeforeRequest',
    'webRequest.onBeforeSendHeaders',
    'webRequest.onHeadersReceived',
    'webRequest.onCompleted',
    'webRequest.onErrorOccurred',
  ],
  'forbiddenEvents',
);

const permissionPolicy = data.permissionPolicy;
if (permissionPolicy?.allHostsRequiredAtInstall !== false) {
  fail('all-host access must not be required at installation');
}
for (const field of [
  'requestAllHostsWhenAuthenticatedProxyActivated',
  'offerRevocationWhenLastAuthenticatedProxyDisabled',
  'permissionDenialLeavesProfileEditable',
]) {
  if (permissionPolicy[field] !== true) {
    fail(`permissionPolicy.${field} must equal true`);
  }
}

const challengePolicy = data.challengePolicy;
for (const field of [
  'ignoreOriginAuthentication',
  'matchChallengerByHostAndPort',
  'activeSnapshotOnly',
  'exactCredentialBeforeFallback',
  'boundedRetries',
  'attemptStateSurvivesBackgroundSuspension',
]) {
  if (challengePolicy?.[field] !== true) {
    fail(`challengePolicy.${field} must equal true`);
  }
}
if (challengePolicy?.attemptStateContainsSecrets !== false) {
  fail('challenge attempt state must not contain secrets');
}
if (challengePolicy?.cleanupUsesGlobalRequestCompletionListeners !== false) {
  fail('authentication cleanup must not use global completion/error listeners');
}

const privatePolicy = data.privatePolicy;
if (privatePolicy?.checkBrowserGrant !== true || privatePolicy?.checkDetailsIncognito !== true) {
  fail('private handling must check both browser grant and event context');
}
if (privatePolicy?.credentialUseDefault !== 'disabled-until-explicit-user-enable') {
  fail('private credential use must default to disabled');
}

for (const [field, value] of Object.entries(data.secretPolicy ?? {})) {
  const expected = field === 'authenticationIndexContainsSecretReferencesOnly';
  if (value !== expected) {
    fail(`secretPolicy.${field} must equal ${expected}`);
  }
}

console.log(
  'Validated MV3 proxy-auth capability: optional all-host access, one challenge listener, ' +
    'HTTP/HTTPS only, bounded retries, background-safe state, and no secret leakage.',
);
