import { readFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import path from 'node:path';
import { domainToASCII } from 'node:url';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(rootDir, 'fixtures', 'zeroomega-v2', 'network-edge-conditions.json');

function fail(message) {
  throw new Error(`network-edge-conditions.json: ${message}`);
}

function assertValidPort(value, location) {
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    fail(`${location} must be an integer in 1..65535`);
  }
}

const data = JSON.parse(await readFile(fixturePath, 'utf8'));
const fixed = data['+edge proxy'];
const decision = data['+edge switch'];

if (data.schemaVersion !== 2) {
  fail('schemaVersion must equal 2');
}
if (fixed?.profileType !== 'FixedProfile') {
  fail('+edge proxy must be a FixedProfile');
}
if (decision?.profileType !== 'SwitchProfile') {
  fail('+edge switch must be a SwitchProfile');
}

assertValidPort(fixed.fallbackProxy?.port, '+edge proxy.fallbackProxy.port');
assertValidPort(fixed.proxyForHttps?.port, '+edge proxy.proxyForHttps.port');
if (isIP(fixed.proxyForHttps?.host) !== 6) {
  fail('+edge proxy.proxyForHttps.host must be an IPv6 literal');
}

const bypassPatterns = fixed.bypassList?.map((condition) => condition.pattern);
const expectedBypassPatterns = [
  '<local>',
  '.example.invalid',
  'https://example.invalid:8443',
  '192.0.2.0/24',
  '2001:db8::/32',
  '[2001:db8::1]',
  '192.0.2.0/not-a-prefix',
  'https://example.invalid:not-a-port',
  '2001:db8::1:443',
];
if (JSON.stringify(bypassPatterns) !== JSON.stringify(expectedBypassPatterns)) {
  fail('bypass edge patterns changed or were reordered');
}

const rules = decision.rules ?? [];
const unicodeRule = rules[0]?.condition;
const asciiRule = rules[1]?.condition;
if (unicodeRule?.pattern !== '例子.测试') {
  fail('first rule must preserve the Unicode IDN source form');
}
if (asciiRule?.pattern !== 'xn--fsqu00a.xn--0zwm56d') {
  fail('second rule must preserve the ASCII IDN source form');
}
if (domainToASCII(unicodeRule.pattern) !== asciiRule.pattern) {
  fail('Unicode and ASCII IDN fixture forms must describe the same domain');
}

const expectedIpRules = [
  { ip: '192.0.2.0', prefixLength: 24, family: 4 },
  { ip: '2001:db8::', prefixLength: 32, family: 6 },
  { ip: '0.0.0.0', prefixLength: 0, family: 4 },
  { ip: '::', prefixLength: 0, family: 6 },
];

for (const [index, expected] of expectedIpRules.entries()) {
  const condition = rules[index + 2]?.condition;
  const location = `+edge switch.rules[${index + 2}].condition`;
  if (condition?.conditionType !== 'IpCondition') {
    fail(`${location} must be an IpCondition`);
  }
  if (condition.ip !== expected.ip || condition.prefixLength !== expected.prefixLength) {
    fail(`${location} changed from its documented subnet`);
  }
  if (isIP(condition.ip) !== expected.family) {
    fail(`${location}.ip has the wrong address family`);
  }
  const maximumPrefix = expected.family === 4 ? 32 : 128;
  if (condition.prefixLength < 0 || condition.prefixLength > maximumPrefix) {
    fail(`${location}.prefixLength is outside 0..${maximumPrefix}`);
  }
}

if (decision.defaultProfileName !== 'direct') {
  fail('+edge switch.defaultProfileName must remain direct');
}
if (data['-startupProfileName'] !== 'edge switch') {
  fail('-startupProfileName must exercise the edge switch profile');
}

console.log('Validated IDN, IP-family, port, and ambiguous Bypass fixture coverage.');
