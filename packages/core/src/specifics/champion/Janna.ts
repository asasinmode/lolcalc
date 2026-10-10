import type IJanna from '@lolcalc/data/files/champion/Janna.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Janna', typeof IJanna, 'passive'>()({
			meta: {
				BonusDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MSPercentAlly'],
		}),
	},
} satisfies IChampionSpecific<'Janna'>;
