// Lint rules that catch the mistakes that made the original tests check nothing:
// assertions that are never called or never awaited, and promises nobody waits for.
// Run with: npm run lint
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import playwright from 'eslint-plugin-playwright'

export default tseslint.config(
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // A promise (e.g. an async assertion or click) that is never awaited.
      '@typescript-eslint/no-floating-promises': 'error',
      // A line that does nothing, e.g. `expect(x).toBeVisible;` without ().
      '@typescript-eslint/no-unused-expressions': 'error',
    },
  },
  {
    files: ['__checks__/tests/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Playwright actions/assertions that must be awaited.
      'playwright/missing-playwright-await': 'error',
      // Assertions written without calling the matcher.
      'playwright/valid-expect': 'error',
    },
  },
)
