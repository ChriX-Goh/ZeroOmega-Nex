from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:180]!r}')
    path.write_text(text.replace(old, new, 1))


downloader = ROOT / 'apps/extension/src/lib/rule-source-downloader.ts'
downloader.write_text("""import {
  ProfileWorkflowSourceUpdateError,
  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceDownloadRequest,
  type ProfileWorkflowRuleSourceDownloadResult,
} from '@zeroomega-nex/profile-workflow';

function byteLength(content: string): number {
  return new TextEncoder().encode(content).byteLength;
}

function tooLarge(maxBytes: number): ProfileWorkflowSourceUpdateError {
  return new ProfileWorkflowSourceUpdateError(
    'response-too-large',
    'The downloaded response exceeded the configured size limit.',
    { limitBytes: maxBytes },
  );
}

async function readBoundedBody(
  response: Response,
  maxBytes: number,
): Promise<ProfileWorkflowRuleSourceDownloadResult> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw tooLarge(maxBytes);
  if (!response.body) {
    const content = await response.text();
    const bytes = byteLength(content);
    if (bytes > maxBytes) throw tooLarge(maxBytes);
    return { content, bytes };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = '';
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel('Source response exceeded the configured limit');
        throw tooLarge(maxBytes);
      }
      content += decoder.decode(chunk.value, { stream: true });
    }
    content += decoder.decode();
    return { content, bytes };
  } finally {
    reader.releaseLock();
  }
}

export class BrowserRuleSourceDownloader implements ProfileWorkflowRuleSourceDownloader {
  async download(
    request: ProfileWorkflowRuleSourceDownloadRequest,
  ): Promise<ProfileWorkflowRuleSourceDownloadResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);
    try {
      const response = await fetch(request.url, {
        method: 'GET',
        headers: request.headers,
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ProfileWorkflowSourceUpdateError(
          'response-http-error',
          'The source server returned an HTTP error.',
          { httpStatus: response.status },
        );
      }
      return await readBoundedBody(response, request.maxBytes);
    } catch (error) {
      if (error instanceof ProfileWorkflowSourceUpdateError) throw error;
      if (controller.signal.aborted) {
        throw new ProfileWorkflowSourceUpdateError(
          'request-timeout',
          'The source request timed out.',
          { cause: error },
        );
      }
      throw new ProfileWorkflowSourceUpdateError(
        'request-network-failed',
        'The source request failed before a response was received.',
        { cause: error },
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
""")

rule = ROOT / 'packages/profile-workflow/src/rule-source-update.ts'
replace_once(
    rule,
    "import type { ProfileWorkflowSecretStore } from './import-acceptance.js';",
    "import type { ProfileWorkflowSecretStore } from './import-acceptance.js';\n"
    "import {\n"
    "  ProfileWorkflowSourceUpdateError,\n"
    "  normalizeProfileWorkflowSourceUpdateFailure,\n"
    "  type ProfileWorkflowSourceUpdateFailure,\n"
    "} from './source-update-error.js';",
)
replace_once(
    rule,
    """function validateUrl(source: RuleSource): string {
  if (source.location.kind !== 'url') {
    throw new TypeError('Rule Source is inline and cannot be downloaded');
  }
  let parsed: URL;
  try {
    parsed = new URL(source.location.url);
  } catch {
    throw new TypeError('Rule Source URL must be an absolute URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError('Rule Source download supports only HTTP and HTTPS URLs');
  }
  if (parsed.username || parsed.password) {
    throw new TypeError('Rule Source URL must not contain embedded credentials');
  }
  return parsed.href;
}
""",
    """function validateUrl(source: RuleSource): string {
  if (source.location.kind !== 'url') {
    throw new ProfileWorkflowSourceUpdateError(
      'url-invalid',
      'The Rule Source is not configured with a downloadable URL.',
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(source.location.url);
  } catch {
    throw new ProfileWorkflowSourceUpdateError(
      'url-invalid',
      'The Rule Source URL is not a valid absolute URL.',
    );
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ProfileWorkflowSourceUpdateError(
      'url-scheme-unsupported',
      'Rule Source download supports only HTTP and HTTPS URLs.',
    );
  }
  if (parsed.username || parsed.password) {
    throw new ProfileWorkflowSourceUpdateError(
      'url-credentials-forbidden',
      'The Rule Source URL must not contain embedded credentials.',
    );
  }
  return parsed.href;
}
""",
)
replace_once(
    rule,
    """  if (secret === undefined) {
    throw new Error(`Rule Source header secret ${header.value.secretRef} is unavailable`);
  }
""",
    """  if (secret === undefined) {
    throw new ProfileWorkflowSourceUpdateError(
      'header-secret-unavailable',
      'A Rule Source request-header secret is unavailable.',
    );
  }
""",
)
for old, new in [
    ("if (!name) throw new TypeError('Rule Source request header name is required');", "if (!name) {\n      throw new ProfileWorkflowSourceUpdateError(\n        'header-name-required',\n        'A Rule Source request-header name is required.',\n      );\n    }"),
    ("throw new TypeError(`Rule Source request header \"${name}\" is invalid`);", "throw new ProfileWorkflowSourceUpdateError(\n        'header-name-invalid',\n        'A Rule Source request-header name is invalid.',\n      );"),
    ("throw new TypeError(`Rule Source request header \"${name}\" is controlled by the browser`);", "throw new ProfileWorkflowSourceUpdateError(\n        'header-browser-controlled',\n        'A Rule Source request header is controlled by the browser.',\n      );"),
    ("throw new TypeError(`Rule Source request header \"${name}\" is duplicated`);", "throw new ProfileWorkflowSourceUpdateError(\n        'header-duplicate',\n        'A Rule Source request-header name is duplicated.',\n      );"),
]:
    replace_once(rule, old, new)
replace_once(
    rule,
    """  message: string,
): ProfileWorkflowRuleSourceUpdateRecord {
""",
    """  failure: ProfileWorkflowSourceUpdateFailure,
): ProfileWorkflowRuleSourceUpdateRecord {
""",
)
replace_once(
    rule,
    "lastError: { occurredAt: attemptedAt, message },",
    "lastError: { occurredAt: attemptedAt, ...failure },",
)
replace_once(
    rule,
    """  message: string,
  status: 'failed' | 'invalid',
): Promise<ProfileWorkflowRuleSourceUpdateResult> {
""",
    """  failure: ProfileWorkflowSourceUpdateFailure,
  status: 'failed' | 'invalid',
): Promise<ProfileWorkflowRuleSourceUpdateResult> {
""",
)
replace_once(
    rule,
    "recordForFailure(current, sourceId, url, attemptedAt, message)",
    "recordForFailure(current, sourceId, url, attemptedAt, failure)",
)
replace_once(rule, "    message,\n    state: next,", "    message: failure.message,\n    state: next,")
replace_once(
    rule,
    """  } catch (error) {
    const message = normalizedMessage(error);
    return persistFailure(
      repository,
      initial,
      sourceId,
      configuredUrl,
      attemptedAt,
      message,
      'invalid',
    );
  }
""",
    """  } catch (error) {
    return persistFailure(
      repository,
      initial,
      sourceId,
      configuredUrl,
      attemptedAt,
      normalizeProfileWorkflowSourceUpdateFailure(error, 'Rule List source validation failed.'),
      'invalid',
    );
  }
""",
)
for old, new in [
    ("throw new Error('Rule Source download returned empty content');", "throw new ProfileWorkflowSourceUpdateError(\n        'response-empty',\n        'The Rule Source response was empty.',\n      );"),
    ("throw new Error('Rule Source downloader returned an invalid byte count');", "throw new ProfileWorkflowSourceUpdateError(\n        'response-byte-count-invalid',\n        'The Rule Source downloader returned an invalid byte count.',\n      );"),
    ("throw new Error('Rule Source download exceeded the configured size limit');", "throw new ProfileWorkflowSourceUpdateError(\n        'response-too-large',\n        'The Rule Source response exceeded the configured size limit.',\n        { limitBytes: service.maxBytes ?? RULE_SOURCE_UPDATE_MAX_BYTES },\n      );"),
]:
    replace_once(rule, old, new)
replace_once(
    rule,
    """      normalizedMessage(error),
      'failed',
""",
    """      normalizeProfileWorkflowSourceUpdateFailure(error, 'Rule List download failed.'),
      'failed',
""",
)

pac = ROOT / 'packages/profile-workflow/src/pac-source-update.ts'
replace_once(
    pac,
    "import type { ProfileWorkflowSecretStore } from './import-acceptance.js';",
    "import type { ProfileWorkflowSecretStore } from './import-acceptance.js';\n"
    "import {\n"
    "  ProfileWorkflowSourceUpdateError,\n"
    "  normalizeProfileWorkflowSourceUpdateFailure,\n"
    "  type ProfileWorkflowSourceUpdateFailure,\n"
    "} from './source-update-error.js';",
)
replace_once(
    pac,
    """function validateUrl(profile: PacProfile): string {
  if (profile.source.kind !== 'url')
    throw new TypeError('PAC source is inline and cannot be downloaded');
  let parsed: URL;
  try {
    parsed = new URL(profile.source.url);
  } catch {
    throw new TypeError('PAC URL must be an absolute URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError('PAC download supports only HTTP and HTTPS URLs');
  }
  if (parsed.username || parsed.password) {
    throw new TypeError('PAC URL must not contain embedded credentials');
  }
  return parsed.href;
}
""",
    """function validateUrl(profile: PacProfile): string {
  if (profile.source.kind !== 'url') {
    throw new ProfileWorkflowSourceUpdateError(
      'url-invalid',
      'The PAC profile is not configured with a downloadable URL.',
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(profile.source.url);
  } catch {
    throw new ProfileWorkflowSourceUpdateError('url-invalid', 'The PAC URL is not valid.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ProfileWorkflowSourceUpdateError(
      'url-scheme-unsupported',
      'PAC download supports only HTTP and HTTPS URLs.',
    );
  }
  if (parsed.username || parsed.password) {
    throw new ProfileWorkflowSourceUpdateError(
      'url-credentials-forbidden',
      'The PAC URL must not contain embedded credentials.',
    );
  }
  return parsed.href;
}
""",
)
replace_once(
    pac,
    """  if (secret === undefined)
    throw new Error(`PAC header secret ${header.value.secretRef} is unavailable`);
""",
    """  if (secret === undefined) {
    throw new ProfileWorkflowSourceUpdateError(
      'header-secret-unavailable',
      'A PAC request-header secret is unavailable.',
    );
  }
""",
)
for old, new in [
    ("if (!name) throw new TypeError('PAC request header name is required');", "if (!name) {\n      throw new ProfileWorkflowSourceUpdateError(\n        'header-name-required',\n        'A PAC request-header name is required.',\n      );\n    }"),
    ("if (!HEADER_NAME.test(name)) throw new TypeError(`PAC request header \"${name}\" is invalid`);", "if (!HEADER_NAME.test(name)) {\n      throw new ProfileWorkflowSourceUpdateError(\n        'header-name-invalid',\n        'A PAC request-header name is invalid.',\n      );\n    }"),
    ("throw new TypeError(`PAC request header \"${name}\" is controlled by the browser`);", "throw new ProfileWorkflowSourceUpdateError(\n        'header-browser-controlled',\n        'A PAC request header is controlled by the browser.',\n      );"),
    ("if (names.has(normalized)) throw new TypeError(`PAC request header \"${name}\" is duplicated`);", "if (names.has(normalized)) {\n      throw new ProfileWorkflowSourceUpdateError(\n        'header-duplicate',\n        'A PAC request-header name is duplicated.',\n      );\n    }"),
]:
    replace_once(pac, old, new)
replace_once(pac, "  message: string,\n): ProfileWorkflowRuleSourceUpdateRecord {", "  failure: ProfileWorkflowSourceUpdateFailure,\n): ProfileWorkflowRuleSourceUpdateRecord {")
replace_once(pac, "lastError: { occurredAt: attemptedAt, message },", "lastError: { occurredAt: attemptedAt, ...failure },")
replace_once(pac, "  message: string,\n  status: 'failed' | 'invalid',", "  failure: ProfileWorkflowSourceUpdateFailure,\n  status: 'failed' | 'invalid',")
replace_once(pac, "recordForFailure(current, profileId, url, attemptedAt, message)", "recordForFailure(current, profileId, url, attemptedAt, failure)")
replace_once(pac, "return { status, message, state: next,", "return { status, message: failure.message, state: next,")
replace_once(
    pac,
    """      normalizedMessage(error),
      'invalid',
""",
    """      normalizeProfileWorkflowSourceUpdateFailure(error, 'PAC source validation failed.'),
      'invalid',
""",
)
for old, new in [
    ("if (!downloaded.content.trim()) throw new Error('PAC download returned empty content');", "if (!downloaded.content.trim()) {\n      throw new ProfileWorkflowSourceUpdateError('response-empty', 'The PAC response was empty.');\n    }"),
    ("throw new Error('PAC downloader returned an invalid byte count');", "throw new ProfileWorkflowSourceUpdateError(\n        'response-byte-count-invalid',\n        'The PAC downloader returned an invalid byte count.',\n      );"),
    ("throw new Error('PAC download exceeded the configured size limit');", "throw new ProfileWorkflowSourceUpdateError(\n        'response-too-large',\n        'The PAC response exceeded the configured size limit.',\n        { limitBytes: service.maxBytes ?? RULE_SOURCE_UPDATE_MAX_BYTES },\n      );"),
]:
    replace_once(pac, old, new)
replace_once(
    pac,
    """      normalizedMessage(error),
      'failed',
""",
    """      normalizeProfileWorkflowSourceUpdateFailure(error, 'PAC download failed.'),
      'failed',
""",
)

print('Applied stable source-update codes to Rule Source, PAC, and browser downloader runtimes.')
