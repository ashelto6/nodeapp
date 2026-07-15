// ESLint flat config (ESLint 9) for the server package.
//
// Scope: this is a pure Node.js ESM service (Express + Mongoose). There is no
// browser or JSX here, so the config is deliberately small: the recommended
// JS rules plus Node globals. Test files import Vitest primitives explicitly
// (`import { describe, it, expect } from 'vitest'`), so no test-runner globals
// need to be declared.
//
// Prettier owns formatting; `eslint-config-prettier` (last in the array) turns
// off every stylistic ESLint rule that could fight the formatter, so ESLint
// only reports real code-quality problems.
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
    // Generated/analysis output. node_modules is ignored by ESLint by default.
    { ignores: ['coverage/**'] },

    // Recommended correctness rules (no-undef, no-unused-vars, etc.).
    js.configs.recommended,

    // Everything in this package runs under Node as an ES module.
    {
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: { ...globals.node },
        },
        rules: {
            // Allow deliberately-unused identifiers when prefixed with `_`.
            // The canonical case is Express's error-handler signature
            // `(err, req, res, next)`: the 4th arg is how Express detects
            // error middleware, so it must be present even when unused.
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    },

    // Must stay last: disables stylistic rules that Prettier handles.
    prettier,
];
