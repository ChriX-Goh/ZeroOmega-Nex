import { readFile, writeFile } from 'node:fs/promises';

export const MIGRATION_SECRET_SENTINELS = [
  'mig017b-password-sentinel-48d7c321',
  'mig017b-rule-header-sentinel-a930e65f',
  'mig017b-pac-header-sentinel-7b12fd84',
];

export function assertNoMigrationSecretSentinels(value, label) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (serialized === undefined) throw new Error(`${label} was not serializable`);
  MIGRATION_SECRET_SENTINELS.forEach((sentinel, index) => {
    if (serialized.includes(sentinel)) {
      throw new Error(`${label} leaked controlled migration secret sentinel #${index + 1}`);
    }
  });
}

export async function materializeSensitiveOriginalBackup(sourcePath, outputPath) {
  const fixture = JSON.parse(await readFile(sourcePath, 'utf8'));
  const [passwordSentinel, ruleHeaderSentinel, pacHeaderSentinel] = MIGRATION_SECRET_SENTINELS;

  for (const auth of Object.values(fixture['+authenticated-proxy']?.auth ?? {})) {
    auth.password = passwordSentinel;
  }

  const ruleHeader = fixture['+header-rule-list']?.headers?.find(
    (header) => header.name === 'X-Fixture-Token',
  );
  if (!ruleHeader) throw new Error('Sensitive migration fixture is missing X-Fixture-Token');
  ruleHeader.value = ruleHeaderSentinel;

  const pacHeader = fixture['+header-pac']?.headers?.find(
    (header) => header.name === 'Authorization',
  );
  if (!pacHeader) throw new Error('Sensitive migration fixture is missing Authorization');
  pacHeader.value = pacHeaderSentinel;

  await writeFile(outputPath, JSON.stringify(fixture), 'utf8');
  return fixture;
}
