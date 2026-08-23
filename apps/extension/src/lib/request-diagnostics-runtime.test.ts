import { describe, expect, it } from 'vitest';

import { isRequestDiagnosticsCommand } from './request-diagnostics-client';

describe('request diagnostics message contract', () => {
  it('accepts only its own bounded session commands', () => {
    for (const action of ['get', 'summary', 'clear', 'start', 'stop']) {
      expect(
        isRequestDiagnosticsCommand({
          channel: 'zeroomega-nex/request-diagnostics/v1',
          action,
          tabId: 7,
        }),
      ).toBe(true);
    }
    expect(
      isRequestDiagnosticsCommand({
        channel: 'zeroomega-nex/profile-workflow/v1',
        action: 'get',
      }),
    ).toBe(false);
    expect(
      isRequestDiagnosticsCommand({
        channel: 'zeroomega-nex/request-diagnostics/v1',
        action: 'get',
        tabId: -1,
      }),
    ).toBe(false);
  });
});
