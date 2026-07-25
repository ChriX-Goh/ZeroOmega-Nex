export interface PacEvaluationRequest {
  readonly url: string;
  readonly host: string;
  readonly localWeekday?: number;
  readonly localHour?: number;
}

export type PacEvaluator = (url: string, host: string) => string;

function fixedDateConstructor(
  localWeekday: number | undefined,
  localHour: number | undefined,
): DateConstructor {
  if (localWeekday === undefined && localHour === undefined) return Date;
  const weekday = localWeekday ?? 0;
  const hour = localHour ?? 0;
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new RangeError('localWeekday must be an integer from 0 to 6');
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError('localHour must be an integer from 0 to 23');
  }

  const fixed = new Date(2024, 0, 7 + weekday, hour, 0, 0, 0).getTime();
  const RealDate = Date;
  const FixedDate = function (...args: unknown[]): Date {
    if (args.length === 0) return new RealDate(fixed);
    return Reflect.construct(RealDate, args) as Date;
  } as unknown as DateConstructor;
  Object.setPrototypeOf(FixedDate, RealDate);
  FixedDate.prototype = RealDate.prototype;
  Object.defineProperty(FixedDate, 'now', { value: () => fixed });
  return FixedDate;
}

export function createPacEvaluator(
  script: string,
  clock: Pick<PacEvaluationRequest, 'localWeekday' | 'localHour'> = {},
): PacEvaluator {
  const factory = new Function('Date', `${script}\nreturn FindProxyForURL;`) as (
    dateConstructor: DateConstructor,
  ) => unknown;
  const evaluator = factory(fixedDateConstructor(clock.localWeekday, clock.localHour));
  if (typeof evaluator !== 'function') {
    throw new TypeError('Generated PAC script did not define FindProxyForURL');
  }
  return evaluator as PacEvaluator;
}

export function evaluatePacScript(script: string, request: PacEvaluationRequest): string {
  return createPacEvaluator(script, request)(request.url, request.host);
}
