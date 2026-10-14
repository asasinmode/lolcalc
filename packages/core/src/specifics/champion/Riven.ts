import type IRiven from '@lolcalc/data/files/champion/Riven.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Riven', typeof IRiven, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				MonsterBonusDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['Charges'],
		}),
	},
	q: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
} satisfies IChampionSpecific<'Riven'>;
