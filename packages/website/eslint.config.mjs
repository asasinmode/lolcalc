// @ts-check
import antfu from '@antfu/eslint-config';
import unocss from '@unocss/eslint-config/flat';
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
			// stopped working after updating dependencies with
			// Error while loading rule 'vue/component-name-in-template-casing': Cannot read properties of undefined (reading 'getTemplateBodyTokenStore')
			// Occurred while linting D:\projects\lolcalc\packages\website\README.md
			// 'vue/component-name-in-template-casing': ['warn', 'PascalCase', { registeredComponentsOnly: false }],
			'style/lines-between-class-members': 'off',
			'ts/no-non-null-asserted-optional-chain': 'off',
			'test/no-import-node-test': 'off',
		},
		formatters: true,
		ignores: ['app/assets/*.json', 'public/data/**/*.json'],
		// @ts-expect-error not sure what the issue is
	}, unocss),
);
