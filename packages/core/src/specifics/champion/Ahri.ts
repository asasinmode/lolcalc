import type IAhri from '@lolcalc/data/files/champion/Ahri.json';
import type { IChampionSpecific } from '../champion.ts';
import { VariableType } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Ahri', typeof IAhri, 'passive'>()({
			meta: {
				MinionHeal: {
					type: VariableType.heal,
				},
				ChampionHeal: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['MaxStacks', 'TakedownWindow'],
		}),
	},
} satisfies IChampionSpecific<'Ahri'>;
