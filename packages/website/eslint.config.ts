// @ts-check
import antfu from '@antfu/eslint-config';
import unocss from '@unocss/eslint-config/flat';
import oxlint from 'eslint-plugin-oxlint';

export default antfu({
	stylistic: {
		semi: true,
		indent: 'tab',
	},
	rules: {
		'style/brace-style': ['error', '1tbs'],
		'antfu/no-top-level-await': 'off',
		'curly': ['error', 'all'],
	},
	formatters: true,
}, unocss, oxlint.configs['flat/recommended']);
