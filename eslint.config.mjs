import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import prettier from 'eslint-plugin-prettier';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/.next',
      '**/.cache',
      '**/package-lock.json',
      '**/public',
      '**/node_modules',
      '**/next-env.d.ts',
      '**/next.config.ts',
      '**/yarn.lock',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'next',
      'eslint:recommended',
      'prettier',
      'next/core-web-vitals',
      'next/typescript',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:prettier/recommended',
      'plugin:react-hooks/recommended',
    ),
  ),
  {
    plugins: {
      prettier: fixupPluginRules(prettier),
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      react: fixupPluginRules(react),
      'react-hooks': fixupPluginRules(reactHooks),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-unused-vars': 'off',
      'object-shorthand': 'warn',
      'quote-props': ['warn', 'as-needed'],

      '@typescript-eslint/array-type': [
        'warn',
        {
          default: 'array',
        },
      ],

      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never',
        },
      ],

      'react/jsx-fragments': ['warn', 'syntax'],

      'react/jsx-filename-extension': [
        'warn',
        {
          extensions: ['ts', 'tsx'],
        },
      ],

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'prettier/prettier': 'warn',
    },
  },
];