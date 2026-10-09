export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	experimental: {
		// chatgpt look into it, will/do i still need it with typescript 7?
		typescriptPlugin: true,
		early404: true,
	},
	features: {
		inlineStyles: false,
	},
	future: {
		compatibilityVersion: 5,
	},
	vite: {
		build: {
			target: 'esnext',
		},
		css: {
			transformer: 'lightningcss',
			lightningcss: {
				/* most advanced used feature [field-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing#specifications) */
				targets: {
					chrome: 125,
					edge: 125,
					firefox: 152,
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
		vapor: true,
		compilerOptions: {
			isCustomElement: tag => tag.toLowerCase() === 'unknown',
		},
	},
	typescript: {
		tsConfig: {
			compilerOptions: {
				erasableSyntaxOnly: true,
				allowImportingTsExtensions: true,
				/* these should probably be handled as a workspace dependency from `package.json` but for, from my understanding, they'd have to have valid `package.json` "types" field and others bells and whistles so this will do for now */
				paths: {
					'@lolcalc/core/*': ['../../core/src/*'],
					'@lolcalc/data/*': ['../../data/src/*'],
					'@lolcalc/shared/*': ['../../shared/src/*'],
				},
			},
		},
	},
	// TODO tmp workaround for nuxt 4.6.0 https://github.com/nuxt/nuxt/issues/36467
	nitro: {
		externals: {
			inline: [/[\\/]node_modules[\\/]nuxt[\\/]dist[\\/]/],
		},
	} as any,
	modules: ['@unocss/nuxt'],
	css: ['~/assets/index.css'],
});
