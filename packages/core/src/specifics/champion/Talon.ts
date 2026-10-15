import type ITalon from '@lolcalc/data/files/champion/Talon.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Talon', typeof ITalon, 'passive'>()({
			meta: {
				BleedDamage: {
					type: VariableType.physical,
				},
			},
			/* monstermod is lowercased in tooltip despite normal casting in data */
			uninteresting: ['StackDuration', 'BleedDuration', 'monstermod' as any],
		}),
	},
} satisfies IChampionSpecific<'Talon'>;
