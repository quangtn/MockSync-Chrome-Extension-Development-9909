import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['background.js', 'content.js', 'popup.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        chrome: 'readonly',
        browser: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        document: 'readonly',
        window: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      },
      parserOptions: {
        sourceType: 'script'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'no-case-declarations': 'off',
    }
  }
];