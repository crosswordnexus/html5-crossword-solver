import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        $: "readonly",
        jQuery: "readonly",
        CrosswordShared: "readonly",
        define: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-var": "warn",
      "prefer-const": "warn",
      "no-undef": "error",
      "semi": ["warn", "always"],
      "eqeqeq": ["warn", "always"],
    },
  },
];
