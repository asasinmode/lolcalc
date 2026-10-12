import type ILucian from '@lolcalc/data/files/champion/Lucian.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Lucian', typeof ILucian, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				MinionDamage: {
					type: VariableType.physical,
				},
				PassiveTotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['PassiveDuration', 'NumAuto', 'MaxAutos'],
		}),
	},
} satisfies IChampionSpecific<'Lucian'>;
