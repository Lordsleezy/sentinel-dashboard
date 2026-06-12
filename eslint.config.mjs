import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    ".netlify/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "jsvectormap.d.ts",
    "src/components/calendar/**",
    "src/components/ecommerce/**",
    "src/components/example/**",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
