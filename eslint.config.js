import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        // Standard browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        localStorage: "readonly",
        THREE: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        performance: "readonly",
        Math: "readonly",
        HTMLElement: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        navigator: "readonly",
        location: "readonly",
        Image: "readonly",
        WebGLRenderer: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "no-inner-declarations": "off"
    }
  }
];
