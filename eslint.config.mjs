import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  ...neostandard({
    ignores: [
      ...resolveIgnoresFromGitignore(),
      '_site',
    ],
    ts: true,
  }),
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['warn', {
        allowNumber: true,
        allowBoolean: true,
        allowRegExp: true,
        allowAny: true,
      }],
    },
  },
]
