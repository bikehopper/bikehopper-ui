import { fixupPluginRules } from '@eslint/compat';
import formatjsPlugin from 'eslint-plugin-formatjs';
import globals from 'globals';
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      formatjs: formatjsPlugin,
      react: reactPlugin,
      // Workaround til react-hooks plugin supports ESLint 9:
      // https://github.com/facebook/react/issues/28313
      'react-hooks': fixupPluginRules(reactHooksPlugin),
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'formatjs/enforce-default-message': 'error',
      'formatjs/enforce-description': 'error',
      'formatjs/no-complex-selectors': [
        'error',
        {
          limit: 3,
        },
      ],
      'formatjs/no-id': 'error',
      'formatjs/no-literal-string-in-jsx': 'warn',
      'react-refresh/only-export-components': 'warn',
      'no-unused-vars': [
        'warn',
        { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_.*' },
      ],
      'react/prop-types': 'off',
      'react/jsx-key': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-constant-condition': 'warn',
      'no-unreachable': 'warn',
      'require-await': 'warn',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      typescript: typescriptPlugin,
    },
    // TODO: extend 'plugin:@typescript-eslint/recommended-type-checked'
    //  (will add a bunch of errors to fix)
    rules: {
      'no-undef': 'off', // handled by TypeScript
      'no-unused-vars': 'off',
      'typescript/no-unused-vars': [
        'warn',
        { args: 'none', caughtErrors: 'none' },
      ],
    },
  },
];
