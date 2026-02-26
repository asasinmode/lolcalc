import { data } from '../assets/rune.json';

export const RUNE_SPECIFICS = {
	shards: {
		adaptive: {
			POSSIBLE_DYNAMIC_VALUES: { f1: [0, 1] },
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
			POSSIBLE_DYNAMIC_VALUES: { f1: [10, 200] },
			calculateDynamicVariables(damageSource: DamageSource) {
				return {
					f1: 10 + (180 - 10) / 17 * (damageSource.level.value - 1),
				};
			},
		},
	},
};
