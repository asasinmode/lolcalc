import type IShaco from '@lolcalc/data/files/champion/Shaco.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Shaco', typeof IShaco, 'passive'>()({
			meta: {
				BasicAttackDamage: {
					type: VariableType.physical,
				},
				ShivDamage: {
					type: VariableType.magic,
				},
				ShivDamageExecute: {
					type: VariableType.magic,
				},
			},
			uninteresting: [],
		}),
	},
} satisfies IChampionSpecific<'Shaco'>;
