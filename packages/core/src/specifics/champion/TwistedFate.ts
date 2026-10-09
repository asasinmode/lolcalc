import type ITwistedFate from '@lolcalc/data/files/champion/TwistedFate.json';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	variables: defineChampionVariables<'TwistedFate', typeof ITwistedFate>()({
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
} satisfies IChampionSpecific<'TwistedFate'>;
