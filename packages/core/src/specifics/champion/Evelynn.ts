import type IEvelynn from '@lolcalc/data/files/champion/Evelynn.json';
import type { IChampionSpecific } from '../champion.ts';
import { VariableType } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Evelynn', typeof IEvelynn, 'passive'>()({
			meta: {
				HealPerSecondTOOLTIP: {
					type: VariableType.hpRegen,
				},
			},
			uninteresting: ['DemonShadeTimer', 'StealthDropTimer'],
		}),
	},
} satisfies IChampionSpecific<'Evelynn'>;
