import type {
  LegacyImportItem,
  LegacyImportReport,
  LegacyImportStatus,
  LegacyImportSummary,
  LegacyInputEncoding,
} from './contracts.js';

const SUMMARY_KEY: Record<LegacyImportStatus, keyof LegacyImportSummary> = {
  exact: 'exact',
  'target-dependent': 'targetDependent',
  downgraded: 'downgraded',
  preserved: 'preserved',
  'ignored-generated': 'ignoredGenerated',
  'ignored-runtime': 'ignoredRuntime',
  rejected: 'rejected',
};

export class LegacyImportReportBuilder {
  readonly items: LegacyImportItem[] = [];

  constructor(readonly encoding: LegacyInputEncoding) {}

  add(
    status: LegacyImportStatus,
    code: string,
    sourcePath: string,
    message: string,
    targetPath?: string,
  ): void {
    this.items.push({
      status,
      code,
      sourcePath,
      ...(targetPath === undefined ? {} : { targetPath }),
      message,
    });
  }

  hasRejections(): boolean {
    return this.items.some((item) => item.status === 'rejected');
  }

  build(
    containsSecrets: boolean,
    profileCount: number,
    endpointCount: number,
    ruleSourceCount: number,
  ): LegacyImportReport {
    const summary: LegacyImportSummary = {
      exact: 0,
      targetDependent: 0,
      downgraded: 0,
      preserved: 0,
      ignoredGenerated: 0,
      ignoredRuntime: 0,
      rejected: 0,
    };

    for (const item of this.items) {
      summary[SUMMARY_KEY[item.status]] += 1;
    }

    return {
      source: 'zeroomega-v3.5.0-schema-v2',
      encoding: this.encoding,
      containsSecrets,
      items: [...this.items],
      summary,
      profileCount,
      endpointCount,
      ruleSourceCount,
    };
  }
}
