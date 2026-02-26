export const RUNE_SPECIFICS = {
	shards: {
		adaptive: {
			POSSIBLE_DYNAMIC_VALUES: { f1: [0, 1] },
			calculateDynamicVariables(damageSource: DamageSource) {
				return {
					f1: damageSource.stats.value.adaptiveForceStatVariable,
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
