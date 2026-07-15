// ESLint flat config (ESLint 9) for the client package.
//
// This is a React app bundled by Vite. Compared with the server config it adds:
//   - the React plugin (component correctness rules);
//   - two React-Hooks rules (rules-of-hooks, exhaustive-deps);
//   - the "jsx-runtime" config, which turns OFF `react/react-in-jsx-scope`
//     because we use the automatic JSX runtime (no `import React` needed to
//     render JSX — see src/App.jsx);
//   - per-area globals: browser for app source, browser+node for tests (they
//     run under jsdom on Node via Vitest), and node for the Vite config file.
//
// As on the server, Prettier owns formatting and `eslint-config-prettier`
// (last) disables the stylistic rules that would otherwise conflict with it.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  // Build output and coverage. node_modules is ignored by default.
  { ignores: ['dist/**', 'coverage/**'] },

  // Recommended correctness rules for all files.
  js.configs.recommended,

  // React rules, then jsx-runtime to switch off the "React must be in scope"
  // rules that the automatic JSX runtime makes obsolete.
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],

  // React-Hooks: eslint-plugin-react-hooks@7 ships its preset with a legacy
  // string-array `plugins` field that ESLint 9's flat config rejects, and its
  // recommended set now bundles experimental React-Compiler rules. So we
  // register the plugin ourselves and enable only the two long-stable,
  // high-value rules.
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Shared language options, React version detection, unused-vars convention.
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Allow deliberately-unused identifiers when prefixed with `_`
      // (kept symmetric with the server config).
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // PropTypes are intentionally not enforced. This is a plain-JS React app
      // and PropTypes is a legacy runtime-validation pattern being phased out
      // (React 19 deprecated defaultProps for function components). If prop
      // type-safety becomes a priority, the modern path is TypeScript, tracked
      // as its own decision rather than PropTypes boilerplate on every
      // component.
      'react/prop-types': 'off',
    },
  },

  // App source runs in the browser.
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser } },
  },

  // Tests: jsdom supplies browser globals; Vitest runs on Node. Primitives are
  // imported explicitly, so no test-runner globals are declared here.
  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  // Vite/Vitest config executes under Node.
  {
    files: ['*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Must stay last: disables stylistic rules that Prettier handles.
  prettier,
];
