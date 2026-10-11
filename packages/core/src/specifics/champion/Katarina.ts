import type IKatarina from '@lolcalc/data/files/champion/Katarina.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Katarina', typeof IKatarina, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['ResetWindow', 'ResetCDR'],
		}),
	},
} satisfies IChampionSpecific<'Katarina'>;
