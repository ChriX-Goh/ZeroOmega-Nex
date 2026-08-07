import { readFile, writeFile } from 'node:fs/promises';

const paths = [
  'scripts/e2e-chromium-original-migration.mjs',
  'scripts/e2e-firefox-original-migration.mjs',
];

const functionAnchor = '}\n\nasync function exportOriginalSemantics';
const componentFunction = `}\n\nfunction complexComponentHashes(options) {\n  const projection = requiredOriginalSemantics(options);\n  return {\n    settings: semanticSha256({\n      schemaVersion: projection.schemaVersion,\n      startupProfileName: projection.startupProfileName,\n      enableQuickSwitch: projection.enableQuickSwitch,\n      quickSwitchProfiles: projection.quickSwitchProfiles,\n    }),\n    corpusProxy: semanticSha256(projection.corpusProxy),\n    innerSwitch: semanticSha256(projection.innerSwitch),\n    virtualRoute: semanticSha256(projection.virtualRoute),\n    corpusRules: semanticSha256(projection.corpusRules),\n    outerSwitch: semanticSha256(projection.outerSwitch),\n    unicodePac: semanticSha256(projection.unicodePac),\n  };\n}\n\nasync function exportOriginalSemantics`;

for (const path of paths) {
  let source = await readFile(path, 'utf8');
  if (!source.includes(functionAnchor)) throw new Error(`${path}: export anchor missing`);
  source = source.replace(functionAnchor, componentFunction);

  const returnAnchor =
    '    semanticSha256: semanticSha256(requiredOriginalSemantics(exportedOptions)),\n';
  if (!source.includes(returnAnchor)) throw new Error(`${path}: return anchor missing`);
  source = source.replace(
    returnAnchor,
    `${returnAnchor}    componentHashes: complexCorpus ? complexComponentHashes(exportedOptions) : undefined,\n`,
  );

  const evidenceAnchor = '    semanticSha256: exported.semanticSha256,\n';
  if (!source.includes(evidenceAnchor)) throw new Error(`${path}: evidence anchor missing`);
  source = source.replace(
    evidenceAnchor,
    `${evidenceAnchor}    componentHashes: exported.componentHashes,\n`,
  );

  await writeFile(path, source, 'utf8');
}
