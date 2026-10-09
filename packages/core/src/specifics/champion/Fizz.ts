import type IFizz from '@lolcalc/data/files/champion/Fizz.json';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Fizz', typeof IFizz, 'passive'>()({
			uninteresting: ['DamageReductionMax'],
		}),
	},
} satisfies IChampionSpecific<'Fizz'>;
