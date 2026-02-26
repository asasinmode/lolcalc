export const RUNE_SPECIFICS = {
	shards: {
		adaptive: {
			POSSIBLE_DYNAMIC_VALUES: { f1: [0, 1] },
		},
		healthscaling: {
			/* in reality `f1` goes from 10-200 by 10-increments but it's not used in stringtable so just this */
			POSSIBLE_DYNAMIC_VALUES: { f1: [10, 200] },
		},
	},
};
