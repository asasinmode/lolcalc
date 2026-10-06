import type IAnnie from '@lolcalc/data/files/champion/Annie.json';
import type { IChampionSpecific } from '../champion.ts';
import { VariableType } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Annie', typeof IAnnie, 'passive'>()({
			meta: {
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Annie'>;
