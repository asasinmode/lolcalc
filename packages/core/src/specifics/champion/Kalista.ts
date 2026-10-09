import type IKalista from '@lolcalc/data/files/champion/Kalista.json';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	variables: defineChampionVariables<'Kalista', typeof IKalista>()({
		known: {
			GameModeInteger: [1],
		},
		calculate() {
			return {
				GameModeInteger: {
					value: 1,
				},
			};
		},
	}),
} satisfies IChampionSpecific<'Kalista'>;
