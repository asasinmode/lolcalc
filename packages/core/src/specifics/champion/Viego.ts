import type { IChampionSpecific } from '../champion.ts';

export default {
	calculateHooks: {
		postTotal: {
			handler(_self, { totalStats }) {
				totalStats.mana = 0;
			},
		},
	},
} satisfies IChampionSpecific<'Viego'>;
