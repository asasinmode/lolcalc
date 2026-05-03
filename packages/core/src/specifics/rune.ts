import type { TRunes } from '@lolcalc/data';
import type { IChampionRunes, IRuneShardSlotValue } from '@lolcalc/data/types';
import type { DamageSource } from '../DamageSource';
import type { IPossibleDynamicValues } from '../types';
import { RUNES } from '@lolcalc/data';

export function runePathsEmpty(runes: IChampionRunes) {
	const { primarySlots, secondary, secondarySlots } = runes.paths;
	return !(primarySlots.length || secondary || secondarySlots.length);
};

export function runesInvalid(runes: IChampionRunes, areEmpty = runePathsEmpty(runes)) {
	const { primarySlots, secondary, secondarySlots } = runes.paths;
	return !areEmpty && !(secondary && primarySlots.length === 4 && secondarySlots.length === 2);
};

export const RUNE_SPECIFICS = {
	shards: {
		adaptive: {
			POSSIBLE_DYNAMIC_VALUES: { f1: [0, 1] } satisfies IPossibleDynamicValues,
			calculateDynamicVariables(self) {
				const { adaptiveForceStatVariable } = self.stats.value.meta;

				return {
					f1: adaptiveForceStatVariable,
					f2: (RUNES as TRunes).shards.offensive.adaptive.effectAmount[`StatGain${(adaptiveForceStatVariable + 1) as 1 | 2}`],
				};
			},
		},
		healthscaling: {
			/* in reality `f1` goes from 10-200 by 10-increments but it's not used in stringtable so just this */
			POSSIBLE_DYNAMIC_VALUES: { f1: [10, 200] } satisfies IPossibleDynamicValues,
			calculateDynamicVariables(self) {
				return {
					/** [wiki formula](https://wiki.leagueoflegends.com/en-us/Rune#Shards) */
					f1: 10 + (180 - 10) / 17 * (self.level.value - 1),
				};
			},
		},
	},
} satisfies {
	shards: Partial<Record<IRuneShardSlotValue, IRuneSpecific>>;
};

export type TRuneSpecifics = typeof RUNE_SPECIFICS;

export type IRuneSpecific = IProviderGroupDynamicVariables & {
	POSSIBLE_DYNAMIC_VALUES?: IPossibleDynamicValues;
};

type IProviderGroupDynamicVariables = { calculateDynamicVariables?: never } | {
	calculateDynamicVariables: (self: DamageSource) => any;
};
