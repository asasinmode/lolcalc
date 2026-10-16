import type IZiggs from '@lolcalc/data/files/champion/Ziggs.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Ziggs', typeof IZiggs, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				StructureDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['Cooldown'],
		}),
	},
} satisfies IChampionSpecific<'Ziggs'>;
