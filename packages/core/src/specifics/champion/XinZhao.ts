import type IXinZhao from '@lolcalc/data/files/champion/XinZhao.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'XinZhao', typeof IXinZhao, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				TotalHealing: {
					type: VariableType.heal,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'XinZhao'>;
