import { execFileSync } from 'node:child_process';

import firefox from 'selenium-webdriver/firefox.js';

export function firefoxService() {
  const binary = process.env.FIREFOX_BIN || 'firefox';
  const versionOutput = execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim();
  const match = versionOutput.match(/Firefox\s+(\d+)(?:\.|\b)/u);
  if (!match) {
    throw new Error(`Unable to determine Firefox major version from: ${versionOutput}`);
  }

  const major = Number(match[1]);
  const service = new firefox.ServiceBuilder();
  const systemAccess = major >= 153;
  if (systemAccess) service.addArguments('--allow-system-access');
  console.log(
    JSON.stringify({
      firefoxVersion: versionOutput,
      geckodriverSystemAccess: systemAccess,
    }),
  );
  return service;
}
