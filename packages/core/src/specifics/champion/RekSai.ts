import type { IChampionSpecific } from '../champion.ts';

export default {
	w: {
		// TODO not in reksai.json but checked to be affected by mandate, make sure to handle
		1: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
	},
} satisfies IChampionSpecific<'RekSai'>;
