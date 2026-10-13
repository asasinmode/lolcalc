import type IQiyana from '@lolcalc/data/files/champion/Qiyana.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Qiyana', typeof IQiyana, 'passive'>()({
			meta: {
				FinalDamage: {
					type: VariableType.physical,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Qiyana'>;
