import { defineConfig } from 'oxfmt';

export default defineConfig({
	printWidth: 100,
	tabWidth: 2,
	useTabs: true,
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	ignorePatterns: ['packages/data/files/**/*.json', 'packages/core/test/fixtures/*.json'],
	sortImports: true,
});
