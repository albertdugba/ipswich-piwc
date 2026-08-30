import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import pluginRouter from '@tanstack/eslint-plugin-router'
import prettier from 'eslint-config-prettier'

// Flat config. Type-aware linting is intentionally left off for speed and
// simplicity (Rule 11: don't over-engineer); tsc --noEmit is the type gate.
export default tseslint.config(
  {
    ignores: [
      'dist',
      '.output',
      '.nitro',
      'node_modules',
      'drizzle',
      'src/routeTree.gen.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginRouter.configs['flat/recommended'],
  // Node runtime files (production runner, config) use Node/Web globals.
  {
    files: ['server.mjs', '*.config.{js,ts,mjs}', 'vitest.setup.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Disable formatting-related rules; Prettier owns formatting.
  prettier,
)
