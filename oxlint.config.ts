import { defineConfig } from 'oxlint';

export default defineConfig({
	plugins: ['vue', 'import', 'node', 'unicorn'],
	ignorePatterns: ['packages/data/files/**/*.json', 'packages/core/test/fixtures/*.json'],
	options: {
		typeAware: true,
		typeCheck: true,
	},
	rules: {
		'prefer-const': 'warn',
		'no-unused-expressions': 'off',
		'no-unsafe-optional-chaining': 'off',
	},
});
