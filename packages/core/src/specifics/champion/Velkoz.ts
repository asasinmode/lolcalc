import type IVelkoz from '@lolcalc/data/files/champion/Velkoz.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Velkoz', typeof IVelkoz, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.true,
				},
			},
			uninteresting: ['Duration'],
		}),
	},
} satisfies IChampionSpecific<'Velkoz'>;
