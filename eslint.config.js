import antfu from '@antfu/eslint-config';
// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import unocss from '@unocss/eslint-config/flat';

const nuxtConfig = createConfigForNuxt({
	features: {
		import: false,
		standalone: false,
	},
	dirs: {
		root: ['packages/website'],
	},
}, {
	rules: {
		'vue/component-name-in-template-casing': ['warn', 'PascalCase', { registeredComponentsOnly: false }],
	},
	ignores: ['**/*.md'],
}, unocss);

export default antfu({
	stylistic: {
		semi: true,
		indent: 'tab',
	},
	rules: {
		'style/brace-style': ['error', '1tbs'],
		'antfu/no-top-level-await': 'off',
		'curly': ['error', 'all'],
		'no-labels': 'off',
		'no-undef': 'off',
		'ts/no-non-null-asserted-optional-chain': 'off',
		'test/no-import-node-test': 'off',
		'style/lines-between-class-members': 'off',
	},
	formatters: true,
	ignores: ['packages/data/files/**/*.json'],
}, { files: ['**/*.d.ts'] }, nuxtConfig);
