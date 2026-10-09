import type IAlistar from '@lolcalc/data/files/champion/Alistar.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Alistar', typeof IAlistar, 'passive'>()({
			meta: {
				BaseHeal: {
					type: VariableType.heal,
				},
				AllyHeal: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['PassiveMaxStacks'],
		}),
	},
} satisfies IChampionSpecific<'Alistar'>;
