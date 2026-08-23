import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';

import firefox from 'selenium-webdriver/firefox.js';

export function firefoxService() {
  const binary = process.env.FIREFOX_BIN || 'firefox';
  const versionOutput = execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim();
  const match = versionOutput.match(/Firefox\s+(\d+)(?:\.|\b)/u);
  if (!match) {
    throw new Error(`Unable to determine Firefox major version from: ${versionOutput}`);
  }

  const major = Number(match[1]);
  const geckodriver = process.env.GECKODRIVER_BIN || undefined;
  const service = new firefox.ServiceBuilder(geckodriver);
  const systemAccess = major >= 153;
  if (systemAccess) service.addArguments('--allow-system-access');
  console.log(
    JSON.stringify({
      firefoxVersion: versionOutput,
      geckodriver: geckodriver ? basename(geckodriver) : 'PATH',
      geckodriverSystemAccess: systemAccess,
    }),
  );
  return service;
}
