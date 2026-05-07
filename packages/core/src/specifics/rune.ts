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
			calculateHooks: {
				onRuneShards: {
					handler(_self, { runeShardStats, adaptiveForceMeta }) {
						runeShardStats[adaptiveForceMeta[0]] ??= 0;
						runeShardStats[adaptiveForceMeta[0]]! += (RUNES as TRunes).shards.flex.adaptive.effectAmount[`StatGain${(adaptiveForceMeta[1] + 1) as 1 | 2}`];
					},
					priority: -1,
				},
			},
		},
		attackspeed: {
			calculateHooks: {
				onRuneShards: {
					handler(_self, { runeShardStats, baseStats }) {
						runeShardStats.bonusAttackSpeedPercent = (RUNES as TRunes).shards.offensive.attackspeed.effectAmount.StatGain / 100;
						runeShardStats.attackSpeed = runeShardStats.bonusAttackSpeedPercent * baseStats.attackSpeedRatio;
					},
					priority: -1,
				},
			},
		},
		cdrscaling: {
			calculateHooks: {
				onRuneShards: {
					handler(_self, { runeShardStats }) {
						runeShardStats.abilityHaste = (RUNES as TRunes).shards.offensive.cdrscaling.effectAmount.HasteGain;
					},
					priority: -1,
				},
			},
		},
		movementspeed: {
			calculateHooks: {
				onRuneShards: {
					handler(_self, { runeShardStats, baseWithFlatItemMoveSpeed }) {
						runeShardStats.moveSpeed = baseWithFlatItemMoveSpeed * (RUNES as TRunes).shards.flex.movementspeed.effectAmount.StatGain1 / 100;
					},
					priority: -1,
				},
			},
		},
		health: {
			calculateHooks: {
				onRuneShards: {
					handler(_self, { runeShardStats }) {
						runeShardStats.hp ??= 0;
						runeShardStats.hp = (RUNES as TRunes).shards.defensive.health.effectAmount.StatGain;
					},
					priority: -1,
				},
			},
		},
		healthscaling: {
			/** [wiki formula](https://wiki.leagueoflegends.com/en-us/Rune#Shards) */
			calculateValue: (self: DamageSource): number => 10 + (180 - 10) / 17 * (self.level.value - 1),
			/* in reality `f1` goes from 10-200 by 10-increments but it's not used in stringtable so just this to supress updateData script warning */
			POSSIBLE_DYNAMIC_VALUES: { f1: [10, 200] } satisfies IPossibleDynamicValues,
			calculateDynamicVariables(self) {
				return {
					f1: RUNE_SPECIFICS.shards.healthscaling.calculateValue(self),
				};
			},
			calculateHooks: {
				onRuneShards: {
					handler(self, { runeShardStats }) {
						runeShardStats.hp ??= 0;
						runeShardStats.hp += RUNE_SPECIFICS.shards.healthscaling.calculateValue(self);
					},
					priority: -1,
				},
			},
		},
		tenacity: {
			calculateHooks: {
				onRuneShards: {
					handler(_self, { runeShardStats }) {
						runeShardStats.tenacity = (RUNES as TRunes).shards.defensive.tenacity.effectAmount.StatGain / 100;
					},
					priority: -1,
				},
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
	[key: string]: any;
};

type IProviderGroupDynamicVariables = { calculateDynamicVariables?: never } | {
	calculateDynamicVariables: (self: DamageSource) => any;
};
