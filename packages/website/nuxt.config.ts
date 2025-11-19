export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	experimental: {
		typedPages: true,
	},
	features: {
		inlineStyles: false,
	},
	eslint: {
		config: {
			standalone: false,
		},
	},
	modules: ['@nuxt/eslint', '@nuxt/hints', '@nuxt/icon', '@unocss/nuxt'],
	css: ['~/assets/reset.css', '~/assets/index.css'],
	icon: { cssLayer: 'base'	},
});
