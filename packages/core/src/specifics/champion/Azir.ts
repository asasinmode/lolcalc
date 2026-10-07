import type IAzir from '@lolcalc/data/files/champion/Azir.json';
import type { IChampionSpecific } from '../champion.ts';
import { VariableType } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Azir', typeof IAzir, 'passive'>()({
			meta: {
				TowerDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['TowerDisintegrationTime'],
		}),
	},
} satisfies IChampionSpecific<'Azir'>;
