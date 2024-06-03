module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['formatjs', 'react-refresh'],
  rules: {
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
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
    'react/prop-types': 'off',
    'react/jsx-key': 'warn',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-constant-condition': 'warn',
    'require-await': 'warn',
    'no-undef': 'off', // handled by TypeScript
  },
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
    },
  ],
};
