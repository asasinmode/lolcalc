// @ts-check
import antfu from '@antfu/eslint-config';
import unocss from '@unocss/eslint-config/flat';
import oxlint from 'eslint-plugin-oxlint';
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
	antfu({
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
			'vue/component-name-in-template-casing': ['warn', 'PascalCase', { registeredComponentsOnly: false }],
			'style/lines-between-class-members': 'off',
		},
		formatters: true,
		ignores: ['app/assets/*.json'],
	}, unocss, oxlint.configs['flat/recommended']),
);
