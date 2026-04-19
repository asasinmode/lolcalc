import {
	defineConfig,
	presetIcons,
	presetWind4,
	transformerDirectives,
	transformerVariantGroup,
} from 'unocss';

export default defineConfig({
	presets: [presetWind4({ preflights: { property: { parent: false } } }), presetIcons()],
	transformers: [
		transformerDirectives(),
		transformerVariantGroup(),
	],
	shortcuts: [
		{
			'grid-center': 'grid place-items-center',
			'flex-center': 'flex justify-center items-center',
			'translate-center': '-translate-x-1/2 -translate-y-1/2',
		},
		[/^hoverable:(.+)$/, ([, body]) => [`hover:${body}`, `focus-visible:${body}`]],
	],
	blocklist: ['container'],
	outputToCssLayers: {
		cssLayerName(internalLayer) {
			if (internalLayer === 'shortcuts' || internalLayer === 'default') {
				return 'utilities';
			} else if (internalLayer === 'preflights') {
				return 'reset';
			}

			return 'base';
		},
	},
});
