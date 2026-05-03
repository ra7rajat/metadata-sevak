import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Fix: ESLint 9 Flat Config requires explicitly ignoring node_modules if globalIgnores is used to override defaults
    "node_modules/**",
    ".git/**",
    "tests/**",
  ]),
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
