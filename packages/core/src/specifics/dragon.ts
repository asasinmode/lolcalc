import type { TMiscData } from '@lolcalc/data';
import type { IDragonName } from '@lolcalc/data/types';
import type { ICalculateChampionStatsHookSource, IProviderGroupInternalDragonData } from '../DamageSource';
import type { IInternalDragonDataOf } from './index.ts';
import { MISC } from '@lolcalc/data';
import { clamp } from '@lolcalc/shared/utils.ts';
import { addMultiplicative } from '../calculate/util.ts';

/**
 * dragon ability specifics
 * order of the keys matters for stringifying game ability id, if it changes it could warrant updating stringified state version
 */
export const DRAGON_SPECIFICS = {
	Cloud: {
		stack: {
			internalDataProperties: ['isOOC'],
			setupData(self) {
				self.internalDragonData.value.isOOC = clamp(0, self.internalDragonData.value.isOOC ?? 0, 1);
				return { isOOC: 0 };
			},
			calculateHooks: {
				onDragon: {
					handler(self, { dragonStats }, { calculatedVariables }) {
						dragonStats.slowResist = addMultiplicative(dragonStats.slowResist, (MISC as TMiscData).dragons.Cloud.stack.dataValues.SRAmountPerStack[1]!);
						if ((self.internalDragonData.value as IInternalDragonDataOf<'Cloud', 'stack'>).isOOC) {
							calculatedVariables.totalBonusPercentMoveSpeed += (MISC as TMiscData).dragons.Cloud.stack.dataValues.MSAmountPerStack[1]!;
						}
					},
				},
			},
		},
		soul: {
			internalDataProperties: ['isOOC', 'hasUlted'],
			setupData(self) {
				self.internalDragonData.value.isOOC = clamp(0, self.internalDragonData.value.isOOC ?? 0, 1);
				self.internalDragonData.value.hasUlted = clamp(0, self.internalDragonData.value.hasUlted ?? 0, 1);
				return { isOOC: 0, hasUlted: 0 };
			},
		},
	},
	Hextech: {
		stack: {
			calculateHooks: {
				onDragon: {
					handler(_self, { dragonStats }) {
						dragonStats.abilityHaste = (dragonStats.abilityHaste ?? 0) + (MISC as TMiscData).dragons.Hextech.stack.dataValues.AbilityHaste[1]!;
						dragonStats.bonusAttackSpeedPercent = (dragonStats.bonusAttackSpeedPercent ?? 0) + (MISC as TMiscData).dragons.Hextech.stack.dataValues.AttackSpeed[1]!;
					},
				},
			},
		},
	},
	Infernal: {
		stack: {
			calculateHooks: {
				onDragon: {
					handler(_self, { dragonStats, totalStatMultipliers }) {
						const multiplier = (dragonStats.abilityHaste ?? 0) + (MISC as TMiscData).dragons.Infernal.stack.dataValues.ADandAPPercentIncrease[1]!;
						totalStatMultipliers.attackDamage += multiplier;
						totalStatMultipliers.abilityPower += multiplier;
					},
				},
			},
		},
	},
	Mountain: {
		stack: {
			calculateHooks: {
				onDragon: {
					handler(_self, { totalStatMultipliers }) {
						totalStatMultipliers.armor += (MISC as TMiscData).dragons.Mountain.stack.dataValues.BonusDefenses[1]!;
						totalStatMultipliers.magicResist += (MISC as TMiscData).dragons.Mountain.stack.dataValues.BonusDefenses[1]!;
					},
				},
			},
		},
	},
} satisfies IHypotheticalDragonSpecifics;

export type IHypotheticalDragonSpecifics = Partial<Record<IDragonName, IDragonSpecific>>;

export type TDragonSpecifics = typeof DRAGON_SPECIFICS;

export interface IDragonSpecific {
	stack?: IDragonAbilitySpecific;
	soul?: IDragonAbilitySpecific;
};

export type IDragonAbilitySpecific = IProviderGroupInternalDragonData & {
	calculateHooks?: ICalculateChampionStatsHookSource;
};
