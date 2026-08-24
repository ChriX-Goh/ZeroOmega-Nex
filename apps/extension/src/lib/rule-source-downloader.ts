import {
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
