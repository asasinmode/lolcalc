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
			lightningcss: {
				// most advanced used feature [anchor-name](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/anchor-name#browser_compatibility)
				targets: {
					chrome: 125,
					edge: 125,
					firefox: 147,
					opera: 111,
					safari: 26,
					android: 125,
					samsung: 27,
					ios_saf: 26,
				},
				// nesting, might not be safe to exclude if I were to use @scope since [opera/samsung](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Nesting_selector#browser_compatibility) have partial support
				exclude: 1,
			},
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
