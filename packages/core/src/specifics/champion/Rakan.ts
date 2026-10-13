import type IRakan from '@lolcalc/data/files/champion/Rakan.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Rakan', typeof IRakan, 'passive'>()({
			meta: {
				TotalShield: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['HitCooldown'],
		}),
	},
} satisfies IChampionSpecific<'Rakan'>;
