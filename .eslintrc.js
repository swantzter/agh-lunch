/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  extends: 'love',
  parserOptions: {
    project: 'tsconfig.json'
  },
  parser: '@typescript-eslint/parser',

  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/restrict-template-expressions': ['warn', {
      allowNumber: true,
      allowBoolean: true,
      allowRegExp: true,
      allowAny: true
    }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    'no-void': 'off'
  }
}
