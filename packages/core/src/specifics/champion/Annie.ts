import type IAnnie from '@lolcalc/data/files/champion/Annie.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
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
