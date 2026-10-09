import type IZilean from '@lolcalc/data/files/champion/Zilean.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	variables: defineChampionVariables<'Zilean', typeof IZilean>()({
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
} satisfies IChampionSpecific<'Zilean'>;
