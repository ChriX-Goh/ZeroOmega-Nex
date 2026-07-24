import { productIdentity } from '@zeroomega-nex/core-contracts';

export default defineBackground(() => {
  console.info(
    `[${productIdentity.name}] background initialized for ${productIdentity.milestone}.`,
  );
});
