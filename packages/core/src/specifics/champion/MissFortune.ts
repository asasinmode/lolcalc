import type IMissFortune from '@lolcalc/data/files/champion/MissFortune.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'MissFortune', typeof IMissFortune, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				MinionDamage: {
					type: VariableType.physical,
				},
			},
			/* refund comes from W */
			uninteresting: ['LoveTapRefund' as any],
		}),
	},
} satisfies IChampionSpecific<'MissFortune'>;
