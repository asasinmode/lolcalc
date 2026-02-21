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
	vite: {
		build: {
			target: 'esnext',
		},
		css: {
			transformer: 'lightningcss',
		},
	},
	vue: {
		compilerOptions: {
			isCustomElement: tag => tag.toLowerCase() === 'unknown',
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
	modules: ['@nuxt/eslint', '@unocss/nuxt'],
	css: ['~/assets/index.css'],
});
