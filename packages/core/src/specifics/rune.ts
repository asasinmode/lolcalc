import type { TRunes } from '@lolcalc/data';
import type { IChampionRunes, IRuneShardSlotValue, IRuneSlotName } from '@lolcalc/data/types';
import type { DamageSource, ICalculateChampionStatsHookSource } from '../DamageSource';
import type { IPossibleDynamicValues } from '../types';
import { RUNES } from '@lolcalc/data';

export function runePathsEmpty(runes: IChampionRunes): boolean {
	const { primarySlots, secondary, secondarySlots } = runes.paths;
	return !(primarySlots.length || secondary || secondarySlots.length);
};

export function runesInvalid(runes: IChampionRunes, areEmpty: boolean = runePathsEmpty(runes)): boolean {
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
	slots: {},
} satisfies IHypotheticalRuneSpecifics;

export type TRuneSpecifics = typeof RUNE_SPECIFICS;
export interface IHypotheticalRuneSpecifics {
	shards: Partial<Record<IRuneShardSlotValue, IRuneSpecific>>;
	slots: {
		[K in IRuneSlotName]?: IRuneSpecific;
	};
};

export type IRuneSpecific = IProviderGroupDynamicVariables & {
	POSSIBLE_DYNAMIC_VALUES?: IPossibleDynamicValues;
	calculateHooks?: ICalculateChampionStatsHookSource;
};

type IProviderGroupDynamicVariables = { calculateDynamicVariables?: never } | {
	calculateDynamicVariables: (self: DamageSource) => any;
};
