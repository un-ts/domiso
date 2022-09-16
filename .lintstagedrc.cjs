module.exports = {
  ...require('@1stg/lint-staged/tsc'),
  '*.{gif,jpeg,jpg,png,svg,webp}': [],
  'test/fixtures/**/*.svg': 'prettier --write',
}
