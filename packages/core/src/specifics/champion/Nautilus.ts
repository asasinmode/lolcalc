import type INautilus from '@lolcalc/data/files/champion/Nautilus.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Nautilus', typeof INautilus, 'passive'>()({
			meta: {
				TotalDamageTooltip: {
					type: VariableType.physical,
				},
				RootDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['PerTargetCD'],
		}),
	},
} satisfies IChampionSpecific<'Nautilus'>;
