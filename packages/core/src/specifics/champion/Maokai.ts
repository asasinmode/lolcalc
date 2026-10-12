import type IMaokai from '@lolcalc/data/files/champion/Maokai.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Maokai', typeof IMaokai, 'passive'>()({
			meta: {
				PassiveHealingTotal: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['PassiveCooldownReduction', 'JungPassCooldownReduction'],
		}),
	},
} satisfies IChampionSpecific<'Maokai'>;
