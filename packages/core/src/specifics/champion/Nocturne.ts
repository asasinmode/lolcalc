import type INocturne from '@lolcalc/data/files/champion/Nocturne.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Nocturne', typeof INocturne, 'passive'>()({
			meta: {
				TotalDamageNoCrit: {
					type: VariableType.physical,
				},
				TotalHealing: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['Cooldown', 'AACDR', 'AAChampMonsterCDR', 'DamageMinionMod', 'HealMinionMod'],
		}),
	},
} satisfies IChampionSpecific<'Nocturne'>;
