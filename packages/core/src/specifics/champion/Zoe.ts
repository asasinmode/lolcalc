import type IZoe from '@lolcalc/data/files/champion/Zoe.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Zoe', typeof IZoe, 'passive'>()({
			meta: {
				PassiveDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Zoe'>;
