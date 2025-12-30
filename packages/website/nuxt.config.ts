export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: false },
	experimental: {
		typedPages: true,
		typescriptPlugin: true,
	},
	features: {
		inlineStyles: false,
	},
	eslint: {
		config: {
			standalone: false,
		},
	},
	typescript: {
		tsConfig: {
			include: [
				'../test/**/*',
			],
			compilerOptions: {
				types: ['@types/bun'],
			},
		},
	},
	modules: ['@nuxt/eslint', '@nuxt/hints', '@nuxt/icon', '@unocss/nuxt'],
	css: ['~/assets/index.css'],
	icon: { cssLayer: 'base'	},
});
