import type { TRunes } from '@lolcalc/data';
import type { IChampionRunes, IRuneShardSlotValue, IRuneSlotName } from '@lolcalc/data/types';
import type { ICalculatedDynamicVariable, ICalculatedDynamicVariables, ISpecificVariables } from '.';
import type { DamageSource, ICalculateChampionStatsHookSource } from '../DamageSource';
import { RUNES } from '@lolcalc/data';
import { defineVariables } from './index.ts';

export function runesEmpty(runes: IChampionRunes): boolean {
	const { paths: { primarySlots, secondary, secondarySlots }, shards } = runes;
	return !(primarySlots.length || secondary || secondarySlots.length || shards.offensive || shards.flex || shards.defensive);
};

export function runesInvalid(runes: IChampionRunes, areEmpty: boolean = runesEmpty(runes)): boolean {
	const { paths: { primarySlots, secondary, secondarySlots }, shards } = runes;
	return !areEmpty && !(secondary && primarySlots.length === 4 && secondarySlots.length === 2 && shards.offensive && shards.flex && shards.defensive);
};

/** specific runes' helpers, utils and calculations */
export const RUNE_SPECIFICS = {
	shards: {
		adaptive: {
			variables: defineVariables({
				known: { f1: [0, 1], f2: [] },
				calculate(self) {
					const { adaptiveForceStatVariable } = self.stats.value.meta;
					return {
						/** which `perk_tooltip_dynamic_statmodadaptive_@f1@` to use. 0 for ad; 1 for ap */
						f1: {
							value: adaptiveForceStatVariable,
						},
						/** how much of the `@f1` stat is gained */
						f2: {
							value: (RUNES as TRunes).shards.offensive.adaptive.effectAmount[`StatGain${(adaptiveForceStatVariable + 1) as 1 | 2}`],
						},
					};
				},
			}),
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
						runeShardStats.hp += (RUNES as TRunes).shards.defensive.health.effectAmount.StatGain;
					},
					priority: -1,
				},
			},
		},
		healthscaling: {
			/** [wiki formula](https://wiki.leagueoflegends.com/en-us/Rune#Shards) */
			calculateValue: (self: DamageSource): number => 10 + (180 - 10) / 17 * (self.level.value - 1),
			variables: defineVariables({
				known: { f1: [] },
				calculate(self): ICalculatedDynamicVariables<'f1'> {
					return {
						/** the hp gained on current level */
						f1: {
							value: RUNE_SPECIFICS.shards.healthscaling.calculateValue(self),
						} satisfies ReturnType<NonNullable<ISpecificVariables['calculate']>>[string] as ICalculatedDynamicVariable,
					};
				},
			}),
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

export interface IRuneSpecific {
	variables?: ISpecificVariables<any>;
	calculateHooks?: ICalculateChampionStatsHookSource;
	[key: string]: any;
}
