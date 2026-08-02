export const productIdentity = {
  name: 'ZeroOmega',
  milestone: 'Milestone 8',
  architecture: 'compile-first',
} as const;

export type ProductIdentity = typeof productIdentity;

export const foundationGuards = {
  proxyPermissionEnabled: true,
  globalRequestListenerEnabled: false,
  productionPolicyEngineEnabled: true,
} as const;
