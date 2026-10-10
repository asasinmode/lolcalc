import type IHwei from '@lolcalc/data/files/champion/Hwei.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Hwei', typeof IHwei, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['Duration'],
		}),
	},
	e: {
		dataOverrides: {
			isImmobilizing: true,
		},
	},
} satisfies IChampionSpecific<'Hwei'>;
