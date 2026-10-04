import type { IChampionSpecific } from '../champion.ts';

export default {
	q: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
} satisfies IChampionSpecific<'Riven'>;
