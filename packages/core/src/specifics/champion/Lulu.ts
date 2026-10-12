import type ILulu from '@lolcalc/data/files/champion/Lulu.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Lulu', typeof ILulu, 'passive'>()({
			meta: {
				CombinedDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Lulu'>;
