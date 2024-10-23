// @ts-check

import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  {
    ignores: [
      'dist/',
      'assets/',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: ['**/*.js'],
    ...tsEslint.configs.disableTypeChecked,
  },
  {
    rules: {
      semi: 'error',
      'comma-dangle': ['error', 'always-multiline'],
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],
      'max-len': [
        'error',
        {
          code: 100,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      'no-constant-condition': [
        'error',
        {
          checkLoops: false,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
        },
      ],
      'quote-props': ['error', 'as-needed'],
    },
  },
);
