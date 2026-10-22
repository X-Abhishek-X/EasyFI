import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import root, { boundaryRules } from '../../eslint.config.mjs';

const config = [
  ...root,
  ...nextVitals,
  ...nextTs,
  { files: ['**/*.{ts,tsx}'], rules: boundaryRules('apps/web') },
];

export default config;
