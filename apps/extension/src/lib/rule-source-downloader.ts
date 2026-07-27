import type {
  ProfileWorkflowRuleSourceDownloader,
  ProfileWorkflowRuleSourceDownloadRequest,
  ProfileWorkflowRuleSourceDownloadResult,
} from '@zeroomega-nex/profile-workflow';

function byteLength(content: string): number {
  return new TextEncoder().encode(content).byteLength;
}

async function readBoundedBody(
  response: Response,
  maxBytes: number,
): Promise<ProfileWorkflowRuleSourceDownloadResult> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error(`Rule Source download exceeds ${maxBytes} bytes`);
  }
  if (!response.body) {
    const content = await response.text();
    const bytes = byteLength(content);
    if (bytes > maxBytes) throw new Error(`Rule Source download exceeds ${maxBytes} bytes`);
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
        await reader.cancel('Rule Source response exceeded the configured limit');
        throw new Error(`Rule Source download exceeds ${maxBytes} bytes`);
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
        const status = `${response.status} ${response.statusText}`.trim();
        throw new Error(`Rule Source download failed with HTTP ${status}`);
      }
      return await readBoundedBody(response, request.maxBytes);
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(`Rule Source download timed out after ${request.timeoutMs} ms`, {
          cause: error,
        });
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
