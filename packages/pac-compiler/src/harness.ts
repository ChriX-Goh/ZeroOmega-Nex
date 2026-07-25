export interface PacEvaluationRequest {
  readonly url: string;
  readonly host: string;
}

export type PacEvaluator = (url: string, host: string) => string;

export function createPacEvaluator(script: string): PacEvaluator {
  const factory = new Function(`${script}\nreturn FindProxyForURL;`) as () => unknown;
  const evaluator = factory();
  if (typeof evaluator !== 'function') {
    throw new TypeError('Generated PAC script did not define FindProxyForURL');
  }
  return evaluator as PacEvaluator;
}

export function evaluatePacScript(script: string, request: PacEvaluationRequest): string {
  return createPacEvaluator(script)(request.url, request.host);
}
