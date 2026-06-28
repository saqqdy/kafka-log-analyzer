import eslintConfig from '@eslint-sets/eslint-config'

export default eslintConfig({
	type: 'lib',
	ignores: ['examples/**', 'internal/**'],
	markdown: false,
	rules: {},
	stylistic: false,
	typescript: true,
})