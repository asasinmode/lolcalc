import type IGragas from '@lolcalc/data/files/champion/Gragas.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Gragas', typeof IGragas, 'passive'>()({
			meta: {
				HealAmount: {
					type: VariableType.heal,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Gragas'>;
