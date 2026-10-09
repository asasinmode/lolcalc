import type ICorki from '@lolcalc/data/files/champion/Corki.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Corki', typeof ICorki, 'passive'>()({
			meta: {
				BasicAttackTOOLTIP: {
					type: VariableType.true,
				},
				CriticalStrikeTOOLTIP: {
					type: VariableType.true,
				},
			},
			uninteresting: ['AttackConversion'],
		}),
	},
} satisfies IChampionSpecific<'Corki'>;
