import type IShen from '@lolcalc/data/files/champion/Shen.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Shen', typeof IShen, 'passive'>()({
			known: {
				'{7dfdcd99}': [],
			},
			calculate() {
				return {
					/* originally a buff indicating shen has won his nemesis quest vs zed */
					'{7dfdcd99}': {
						value: 0,
					},
				};
			},
			meta: {
				ShieldValue: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['ShieldDuration', 'ShieldCooldown'],
		}),
	},
} satisfies IChampionSpecific<'Shen'>;
