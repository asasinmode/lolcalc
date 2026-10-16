import type IXerath from '@lolcalc/data/files/champion/Xerath.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Xerath', typeof IXerath, 'passive'>()({
			uninteresting: ['CooldownKillRefund'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Xerath', typeof IXerath, 'q'>()({
			meta: {
				TooltipTotalDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Xerath'>;
