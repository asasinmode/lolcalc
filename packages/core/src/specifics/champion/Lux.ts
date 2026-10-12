import type ILux from '@lolcalc/data/files/champion/Lux.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Lux', typeof ILux, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['DebuffDuration'],
		}),
	},
} satisfies IChampionSpecific<'Lux'>;
