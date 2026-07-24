export const productIdentity = {
  name: 'ZeroOmega Nex',
  milestone: 'Milestone 1',
  architecture: 'compile-first',
} as const;

export type ProductIdentity = typeof productIdentity;

export const foundationGuards = {
  proxyPermissionEnabled: false,
  globalRequestListenerEnabled: false,
  productionPolicyEngineEnabled: false,
} as const;
