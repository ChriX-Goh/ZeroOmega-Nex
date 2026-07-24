import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.wxt/**',
      '**/.output/**',
      '**/coverage/**',
      '**/*.svelte',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts}'],
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
);
