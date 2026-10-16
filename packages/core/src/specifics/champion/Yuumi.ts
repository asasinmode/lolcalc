import type IYuumi from '@lolcalc/data/files/champion/Yuumi.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Yuumi', typeof IYuumi, 'passive'>()({
			meta: {
				HealAmount: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['HealDelayTime'],
		}),
	},
} satisfies IChampionSpecific<'Yuumi'>;
