module.exports = {
  env: {
    es2021: true,
    node: true,
    'jest/globals': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-typescript/base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    project: `${__dirname}/tsconfig.eslint.json`,
  },
  plugins: [
    '@typescript-eslint',
    'jest',
  ],
  rules: {
    'no-console': 'off',
    'no-continue': 'off',
    'no-plusplus': 'off',
    'max-len': 'off',
    'arrow-body-style': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-syntax': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  overrides: [
    {
      files: ['src/web/**/*.ts'],
      env: {
        browser: true,
        node: true,
      },
    },
  ],
};
