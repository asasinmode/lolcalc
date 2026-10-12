import type IMasterYi from '@lolcalc/data/files/champion/MasterYi.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'MasterYi', typeof IMasterYi, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['AttackCount'],
		}),
	},
} satisfies IChampionSpecific<'MasterYi'>;
