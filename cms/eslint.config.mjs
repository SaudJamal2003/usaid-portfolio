import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import next from '@next/eslint-plugin-next'

/* Matches the portfolio's setup so both codebases are held to the same rules:
   type-aware correctness plus the React hooks rules, which is where the two
   real defects found during QA lived. */
export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'prisma/migrations/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, '@next/next': next },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...next.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      /* Off deliberately. This React 19 advisory fires on load-then-fetch, where
         raising a skeleton before the request is the whole intent -- the extra
         render is deliberate, not an accidental cascade. It stays ON in the
         portfolio, where it caught two genuine defects; here it only flags the
         three data-fetching components, and contorting them to satisfy it would
         be a rewrite in search of a bug. */
      'react-hooks/set-state-in-effect': 'off',
    },
  },
)
