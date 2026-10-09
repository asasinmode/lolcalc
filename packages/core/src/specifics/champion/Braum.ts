import type IBraum from '@lolcalc/data/files/champion/Braum.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Braum', typeof IBraum, 'passive'>()({
			meta: {
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
				TotalDamage: {
					type: VariableType.magic,
				},
				OnHitDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['StackDuration', 'StackCap'],
		}),
	},
} satisfies IChampionSpecific<'Braum'>;
