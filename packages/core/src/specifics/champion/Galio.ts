import type IGalio from '@lolcalc/data/files/champion/Galio.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Galio', typeof IGalio, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['ChargeRatePerHit'],
		}),
	},
} satisfies IChampionSpecific<'Galio'>;
