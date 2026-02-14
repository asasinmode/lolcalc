export function cooldownReductionPercentageFromHaste(haste: number) {
	return haste / (haste + 100) * 100;
}

const aph1to5 = [1, 2, 3, 4, 5];

export const CHAMPION_SPECIFICS = {
	Aphelios: {
		WEAPON_ORDER: ['calibrum', 'severum', 'gravitum', 'infernum', 'crescendum'],
		// TODO maybe should be renamed to smth like POSSIBLE_STRINGTABLE_DYNAMIC_VARIABLE_VALUES
		POSSIBLE_DYNAMIC_VALUES: {
			/* f2-f5 variants are covered by f1, they seem to be intended for different guns but resolve to the same values */
			f1: aph1to5,
			f2: [],
			f3: [],
			f4: [],
			f5: [],
			f7: Array.from({ length: 5 }, (_, i) => i + 1).flatMap(i => Array.from({ length: 5 }, (_, j) => i === (j + 1) ? undefined : `${i}${j + 1}`).filter(Boolean)),
		},
	},
	Kayn: {
		POSSIBLE_DYNAMIC_VALUES: {
			f1: [0, 1, 2],
		},
	},
};

/**
 * champions can have dynamic variables, like veigar stacks or current aphelios gun rotation.
 * possible values for these can be specified in `CHAMPION_SPECIFICS` under proper key, these are then used for saving needed stringtable variables when getting game data
 * there might be a better way of doing this
 */
export type IChampionSpecificsAsAbilityDynamicValuesMap = Record<string, { POSSIBLE_DYNAMIC_VALUES?: Record<string, string> }>;
