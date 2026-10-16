import type IVi from '@lolcalc/data/files/champion/Vi.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Vi', typeof IVi, 'passive'>()({
			meta: {
				TotalShield: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['ShieldDuration', 'CDReductionOn3Hit'],
		}),
	},
} satisfies IChampionSpecific<'Vi'>;
