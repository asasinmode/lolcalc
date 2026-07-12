import type { TMiscData } from '@lolcalc/data';
import type { IDragonName } from '@lolcalc/data/types';
import type { ICalculateChampionStatsHookSource, IProviderGroupInternalDragonData } from '../DamageSource';
import type { IInternalDragonDataOf, ISpecificVariables } from './index.ts';
import { MISC } from '@lolcalc/data';
import { clamp } from '@lolcalc/shared/utils.ts';
import { addMultiplicative } from '../calculate/util.ts';
import { championAbilityVariableValue } from '../variables/game.ts';
import { defineVariables } from './index.ts';

/**
 * dragon ability specifics
 * order of the keys matters for stringifying game ability id, if it changes it could warrant updating stringified state version
 */
export const DRAGON_SPECIFICS = {
	Chemtech: {
		stack: {
			calculateHooks: {
				preItemTotal: {
					handler(_self, { dragonStats }) {
						dragonStats.healShieldPower = (dragonStats.healShieldPower ?? 0) + (MISC as TMiscData).dragons.Chemtech.stack.dataValues.HealShieldPerStack[1]!;
						dragonStats.tenacity = addMultiplicative(dragonStats.tenacity, (MISC as TMiscData).dragons.Chemtech.stack.dataValues.TenacityPerStack[1]!);
					},
				},
			},
		},
	},
	Cloud: {
		stack: {
			internalDataProperties: ['isOOC'],
			setupData(self) {
				self.internalDragonData.value.isOOC = clamp(0, self.internalDragonData.value.isOOC ?? 0, 1);
				return { isOOC: 0 };
			},
			calculateHooks: {
				preItemTotal: {
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
			internalDataProperties: ['hasUlted'],
			setupData(self) {
				self.internalDragonData.value.isOOC = clamp(0, self.internalDragonData.value.isOOC ?? 0, 1);
				self.internalDragonData.value.hasUlted = clamp(0, self.internalDragonData.value.hasUlted ?? 0, 1);
				return { hasUlted: 0 };
			},
			calculateHooks: {
				preItemTotal: {
					handler(self, _args, { calculatedVariables }) {
						calculatedVariables.totalBonusPercentMoveSpeed += (MISC as TMiscData).dragons.Cloud.soul.dataValues.PersistentMSValue[1]!;
						if ((self.internalDragonData.value as IInternalDragonDataOf<'Cloud', 'soul'>).hasUlted) {
							calculatedVariables.totalBonusPercentMoveSpeed += (MISC as TMiscData).dragons.Cloud.soul.dataValues.MSAmount[1]!;
						}
					},
				},
			},
		},
	},
	Hextech: {
		stack: {
			calculateHooks: {
				preItemTotal: {
					handler(_self, { dragonStats }) {
						dragonStats.abilityHaste = (dragonStats.abilityHaste ?? 0) + (MISC as TMiscData).dragons.Hextech.stack.dataValues.AbilityHaste[1]!;
						dragonStats.bonusAttackSpeedPercent = (dragonStats.bonusAttackSpeedPercent ?? 0) + (MISC as TMiscData).dragons.Hextech.stack.dataValues.AttackSpeed[1]!;
					},
				},
			},
		},
		soul: {
			variables: defineVariables({
				known: {
					lolcalcChampRange: [],
				},
				calculate(self) {
					return {
						lolcalcChampRange: [
							championAbilityVariableValue('TotalSlowAmountMelee', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul, damageSource: self }),
							championAbilityVariableValue('TotalSlowAmountRanged', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul, damageSource: self }),
						],
					};
				},
				meta: {
					/* dragon variables are prefixed with something like `Spell.SRX_DragonSoulBuffHextech:TotalDamage` so overwrite the name */
					TotalDamage: { displayedName: 'TotalDamage' },
					lolcalcChampRange: {
						displayedName: 'SlowAmount',
						isPercentage: true,
						multiplier: 100,
					},
				},
				uninteresting: ['SlowDuration', 'BaseUnitsToHit'],
			}),
		},
	},
	Infernal: {
		stack: {
			calculateHooks: {
				preItemTotal: {
					handler(_self, { dragonStatMultipliers }) {
						dragonStatMultipliers.abilityPower += (MISC as TMiscData).dragons.Infernal.stack.dataValues.ADandAPPercentIncrease[1]!;
						dragonStatMultipliers.attackDamage += (MISC as TMiscData).dragons.Infernal.stack.dataValues.ADandAPPercentIncrease[1]!;
					},
				},
			},
		},
	},
	Mountain: {
		stack: {
			calculateHooks: {
				preItemTotal: {
					handler(_self, { dragonStatMultipliers }) {
						dragonStatMultipliers.armor += (MISC as TMiscData).dragons.Mountain.stack.dataValues.BonusDefenses[1]!;
						dragonStatMultipliers.magicResist += (MISC as TMiscData).dragons.Mountain.stack.dataValues.BonusDefenses[1]!;
					},
				},
			},
		},
	},
} satisfies IHypotheticalDragonSpecifics;

export type IHypotheticalDragonSpecifics = {
	[K in IDragonName]?: IDragonSpecific<K>
};

export type TDragonSpecifics = typeof DRAGON_SPECIFICS;

export interface IDragonSpecific<Name extends IDragonName = IDragonName> {
	stack?: IDragonAbilitySpecific<Name, 'stack'>;
	soul?: IDragonAbilitySpecific<Name, 'soul'>;
};

type DetectDragonVariables<T>
	= | (T extends { dataValues: any } ? keyof T['dataValues'] & string : never)
		| (T extends { spellCalculations: any } ? keyof T['spellCalculations'] & string : never);

export type IDragonAbilitySpecific<Name extends IDragonName = IDragonName, Type extends 'stack' | 'soul' = 'stack' | 'soul'> = IProviderGroupInternalDragonData & {
	calculateHooks?: ICalculateChampionStatsHookSource;
	variables?: ISpecificVariables<DetectDragonVariables<TMiscData['dragons'][Name][Type]>, 'lolcalcChampRange'>;
};
