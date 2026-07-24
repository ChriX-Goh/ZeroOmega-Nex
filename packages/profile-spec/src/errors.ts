import type { ValidationIssue } from './validation.js';

export class InvalidProfileSpecError extends Error {
  readonly issues: readonly ValidationIssue[];

  constructor(message: string, issues: readonly ValidationIssue[]) {
    super(message);
    this.name = 'InvalidProfileSpecError';
    this.issues = issues;
  }
}
