import {
	defineConfig,
	presetIcons,
	presetWind3,
	transformerDirectives,
	transformerVariantGroup,
} from 'unocss';

export default defineConfig({
	presets: [
		presetWind3(),
		presetIcons(),
	],
	transformers: [
		transformerDirectives(),
		transformerVariantGroup(),
	],
	shortcuts: [
		{
			'flex-center': 'flex justify-center items-center',
			'translate-center': 'translate-x--1/2 translate-y--1/2',
		},
		[/^hoverable[:-](.+)$/, ([, c]) => `hover:${c} focus-visible:${c}`],
		// [/^neon[:-](.+)$/, ([, c]) => `border-2 border-${c} border-op-50 rounded-full bg-${c} bg-op-20 hoverable:(bg-op-30 border-op-100) dark:border-op-80 disabled:(border-op-30 bg-op-20 op-90 text-neutral-5) dark:disabled:(border-op-30 bg-op-20 text-neutral-4)`],
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
