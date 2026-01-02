import {
	defineConfig,
	presetWind4,
	transformerDirectives,
	transformerVariantGroup,
} from 'unocss';

export default defineConfig({
	presets: [presetWind4({ preflights: { property: { parent: false } } })],
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
		[/^hoverable[:-](.+)$/, ([, c]) => `hover:${c} focus-visible:${c}`],
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
