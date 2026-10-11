import type IKennen from '@lolcalc/data/files/champion/Kennen.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Kennen', typeof IKennen, 'passive'>()({
			meta: {
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
				ReducedStunDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['MarkDuration', 'EnergyRestore', 'DiminishingReturnDuration'],
		}),
	},
} satisfies IChampionSpecific<'Kennen'>;
