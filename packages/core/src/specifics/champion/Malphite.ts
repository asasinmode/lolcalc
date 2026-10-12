import type IMalphite from '@lolcalc/data/files/champion/Malphite.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Malphite', typeof IMalphite, 'passive'>()({
			meta: {
				TotalShield: {
					type: VariableType.shield,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Malphite'>;
