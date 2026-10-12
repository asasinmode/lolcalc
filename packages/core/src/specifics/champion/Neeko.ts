import type INeeko from '@lolcalc/data/files/champion/Neeko.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	e: {
		variables: defineChampionVariables<'Neeko', typeof INeeko, 'e'>()({
			meta: {
				BaseDamage: {
					type: VariableType.magic,
				},
				MinRootDuration: {
					type: VariableType.affectedByTenacity,
				},
				MaxRootDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Neeko'>;
