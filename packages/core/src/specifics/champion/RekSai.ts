import type RekSai from '@lolcalc/data/files/champion/RekSai.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'RekSai', typeof RekSai, 'passive'>()({
			meta: {
				HealAmount: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['FuryFromAttacks', 'FuryFromAbilities', 'HealDuration', 'PauseDuration', 'FuryMinionMod'],
		}),
	},
	q: {
		additionalVariantsObjectNames: ['RekSaiQBurrowed'],
	},
	w: {
		additionalVariantsObjectNames: ['RekSaiWBurrowed'],
		// TODO wiki says static cooldown of 1 and it's not present in the data, make sure mandate works properly with it
		1: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
	},
	e: {
		additionalVariantsObjectNames: ['RekSaiEBurrowed'],
	},
} satisfies IChampionSpecific<'RekSai'>;
