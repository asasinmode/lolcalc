import type ILeona from '@lolcalc/data/files/champion/Leona.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Leona', typeof ILeona, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MarkDuration'],
		}),
	},
} satisfies IChampionSpecific<'Leona'>;
