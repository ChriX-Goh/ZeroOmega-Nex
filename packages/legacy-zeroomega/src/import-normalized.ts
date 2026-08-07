import {
  DEFAULT_LEGACY_DECODE_LIMITS,
  decodeZeroOmegaBackup,
  type LegacyDecodeLimits,
} from './decode.js';
import { importZeroOmegaBackup as importZeroOmegaBackupCore } from './import.js';
import type {
  LegacyImportContext,
  LegacyImportItem,
  LegacyImportResult,
} from './contracts.js';

interface DuplicateQuickSwitchReference {
  readonly index: number;
  readonly name: string;
}

function duplicateQuickSwitchReferences(
  input: string | unknown,
  limits: LegacyDecodeLimits,
): readonly DuplicateQuickSwitchReference[] {
  const decoded = decodeZeroOmegaBackup(input, limits);
  if (!decoded.ok) return [];
  const rawQuick = decoded.value.options['-quickSwitchProfiles'];
  if (!Array.isArray(rawQuick)) return [];

  const seen = new Set<string>();
  const duplicates: DuplicateQuickSwitchReference[] = [];
  rawQuick.forEach((value, index) => {
    if (typeof value !== 'string' || value.length === 0) return;
    if (seen.has(value)) {
      duplicates.push({ index, name: value });
      return;
    }
    seen.add(value);
  });
  return duplicates;
}

/**
 * Import through the public legacy boundary and apply original-runtime normalization that happens
 * during ZeroOmega Options initialization before a stable configuration is exported.
 */
export function importZeroOmegaBackup(
  input: string | unknown,
  context: LegacyImportContext,
  limits: LegacyDecodeLimits = DEFAULT_LEGACY_DECODE_LIMITS,
): LegacyImportResult {
  const result = importZeroOmegaBackupCore(input, context, limits);
  if (!result.ok) return result;

  const duplicates = duplicateQuickSwitchReferences(input, limits);
  if (duplicates.length === 0) return result;

  const duplicateIndexes = new Set(duplicates.map((entry) => entry.index));
  const routes = result.candidate.settings.quickSwitch.routes;
  const decoded = decodeZeroOmegaBackup(input, limits);
  const rawQuick = decoded.ok ? decoded.value.options['-quickSwitchProfiles'] : undefined;
  if (!Array.isArray(rawQuick) || routes.length !== rawQuick.length) {
    return result;
  }

  const normalizationItems: LegacyImportItem[] = duplicates.map(({ index, name }) => ({
    status: 'exact',
    code: 'settings.quick-switch-duplicate-normalized',
    sourcePath: `/-quickSwitchProfiles/${index}`,
    message: `Repeated Quick Switch profile "${name}" was omitted after its first occurrence, matching the original runtime.`,
  }));

  return {
    ...result,
    candidate: {
      ...result.candidate,
      settings: {
        ...result.candidate.settings,
        quickSwitch: {
          ...result.candidate.settings.quickSwitch,
          routes: routes.filter((_, index) => !duplicateIndexes.has(index)),
        },
      },
    },
    report: {
      ...result.report,
      items: [...result.report.items, ...normalizationItems],
      summary: {
        ...result.report.summary,
        exact: result.report.summary.exact + normalizationItems.length,
      },
    },
  };
}
