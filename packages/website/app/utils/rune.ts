import type { IPossibleDynamicValues } from './types';
// TODO figure out type assertion if champion.ts also imports champion.json and there are errors
import runeData from '../assets/rune.json' with { type: 'json' };

const { data } = runeData;

export const RUNE_SPECIFICS = {
	shards: {
		adaptive: {
			POSSIBLE_DYNAMIC_VALUES: { all: { f1: [0, 1] } } satisfies IPossibleDynamicValues,
			calculateDynamicVariables(damageSource: DamageSource) {
				const { adaptiveForceStatVariable } = damageSource.stats.value;

				return {
					f1: adaptiveForceStatVariable,
					f2: data.shards.offensive.adaptive.effectAmount[`StatGain${(adaptiveForceStatVariable + 1) as 1 | 2}`],
				};
			},
		},
		healthscaling: {
			/* in reality `f1` goes from 10-200 by 10-increments but it's not used in stringtable so just this */
			POSSIBLE_DYNAMIC_VALUES: { all: { f1: [10, 200] } } satisfies IPossibleDynamicValues,
			calculateDynamicVariables(damageSource: DamageSource) {
				return {
					/** [wiki formula](https://wiki.leagueoflegends.com/en-us/Rune#Shards) */
					f1: 10 + (180 - 10) / 17 * (damageSource.level.value - 1),
				};
			},
		},
	},
};
