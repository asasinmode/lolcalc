import type IAkshan from '@lolcalc/data/files/champion/Akshan.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	w: {
		variables: defineChampionVariables<'Akshan', typeof IAkshan, 'w'>()({
			known: {
				/* it's present in the ability variables but needs to be here to be used in extracting a stringtable variable */
				GameModeInteger: [1],
				f2: [],
			},
			calculate() {
				return {
					GameModeInteger: { value: 1 },
					f2: { value: 0 },
				};
			},
		}),
	},
} satisfies IChampionSpecific<'Akshan'>;
