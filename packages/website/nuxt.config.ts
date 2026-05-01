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
	vite: {
		build: {
			target: 'esnext',
		},
		css: {
			transformer: 'lightningcss',
			lightningcss: {
				/* most advanced used feature [anchor-name](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/anchor-name#browser_compatibility) */
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
				/* nesting, logical properties https://github.com/parcel-bundler/lightningcss/blob/master/node/flags.js */
				exclude: 1 + 2 ** 19,
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
			compilerOptions: {
				erasableSyntaxOnly: true,
			},
		},
	},
	modules: ['@unocss/nuxt'],
	css: ['~/assets/index.css'],
});
