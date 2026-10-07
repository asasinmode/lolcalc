import type IBlitzcrank from '@lolcalc/data/files/champion/Blitzcrank.json';
import type { IChampionSpecific } from '../champion.ts';
import { VariableType } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Blitzcrank', typeof IBlitzcrank, 'passive'>()({
			meta: {
				ShieldAmount: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['HealthThreshold', 'ShieldDuration'],
		}),
	},
} satisfies IChampionSpecific<'Blitzcrank'>;
