import type IGangplank from '@lolcalc/data/files/champion/Gangplank.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	q: {
		variables: defineChampionVariables<'Gangplank', typeof IGangplank, 'q'>()({
			known: {
				/* it's present in the ability variables but needs to be here to be used in extracting a stringtable variable */
				GameModeInteger: [1],
				f1: [],
				f3: [],
			},
			calculate() {
				return {
					GameModeInteger: { value: 1 },
					f1: { value: 0 },
					f3: { value: 0 },
				};
			},
		}),
	},
} satisfies IChampionSpecific<'Gangplank'>;
