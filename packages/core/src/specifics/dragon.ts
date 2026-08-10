import type { TMiscData } from '@lolcalc/data';
import type { IDragonName } from '@lolcalc/data/types';
import type { IDamageVars } from '@lolcalc/shared';
import type { DamageSource, ICalculateChampionStatsHookSource, IProviderGroupInternalDragonData } from '../DamageSource';
import type { IDeriveProgressFn, IInternalDragonDataOf, ISpecificVariables } from './index.ts';
import { MISC } from '@lolcalc/data';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { addMultiplicative } from '../calculate/util.ts';
import { addCalculatesFrom, championAbilityVariableValue } from '../variables/game.ts';
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
			internalDataProperties: ['hextechTagged'],
			setupData(self) {
				self.internalDragonData.value.hextechTagged = clamp(0, self.internalDragonData.value.hextechTagged ?? 0, 100);
				return { hextechTagged: 0 };
			},
			variables: defineVariables({
				known: {
					lolcalcChampRange: [
						championAbilityVariableValue('TotalSlowAmountMelee', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul }).value as number,
						championAbilityVariableValue('TotalSlowAmountRanged', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul }).value as number,
					],
					Slow: [],
				},
				calculate(self) {
					return {
						lolcalcChampRange: [
							championAbilityVariableValue('TotalSlowAmountMelee', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul, damageSource: self }),
							championAbilityVariableValue('TotalSlowAmountRanged', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul, damageSource: self }),
						],
						Slow: {
							value: self.damageVars.value.hextechSoulSlow ?? 0,
						},
					};
				},
				meta: {
					TotalDamage: {
						type: VariableType.true,
					},
					lolcalcChampRange: {
						type: VariableType.affectedBySlowResist,
						displayedName: 'MaxSlowAmount',
						isPercentage: true,
						multiplier: 100,
						/* since I'm overriding the builtin total slows with this one, use overwritten variables' calculatesFrom */
						calculatesFrom: addCalculatesFrom([], championAbilityVariableValue('TotalSlowAmountMelee', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul }).calculatesFrom ?? [], championAbilityVariableValue('TotalSlowAmountRanged', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul }).calculatesFrom ?? []),
					},
					Slow: {
						isCustom: true,
						type: VariableType.affectedBySlowResist,
						resultsIsPercentage: true,
					},
				},
				uninteresting: ['SlowDuration', 'BaseUnitsToHit'],
			}),
			calculateSlow: (progress: number, isRanged: boolean | undefined, bonusAD?: number, totalAP?: number, bonusHP?: number): number => {
				const slowValue =	championAbilityVariableValue(isRanged ? 'TotalSlowAmountRanged' : 'TotalSlowAmountMelee', { abilityVariant: (MISC as TMiscData).dragons.Hextech.soul, damageSource: {
					stats: { value: { bonus: { attackDamage: bonusAD ?? 0, hp: bonusHP ?? 0 }, total: { abilityPower: totalAP ?? 0 } } },
				} as DamageSource });
				if (typeof slowValue.value === 'number') {
					return slowValue.value * progress;
				} else {
					console.warn('[DRAGON_SPECIFICS hextech soul] failed to calculate slow percentage', slowValue);
					return Number.NaN;
				}
			},
			extraDerivedValue: ((value, self): number => {
				if (self?.damageVars.value.hextechSoulSlow !== undefined) {
					return self.damageVars.value.hextechSoulSlow;
				}
				const { bonus, total } = self?.stats.value ?? {};
				return DRAGON_SPECIFICS.Hextech.soul.calculateSlow(value, self?.stats.value.isRanged, bonus?.attackDamage, total?.abilityPower, bonus?.hp);
			}) satisfies IDeriveProgressFn<true>,
			damageVars(self, vars) {
				const { isRanged, total, bonus } = self.stats.value;
				vars.hextechSoulSlow = DRAGON_SPECIFICS.Hextech.soul.calculateSlow((self.internalDragonData.value as IInternalDragonDataOf<'Hextech', 'soul'>).hextechTagged, isRanged, bonus.attackDamage, total.abilityPower, bonus.hp);
			},
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
		soul: {
			variables: defineVariables({
				meta: {
					TotalDamage: {
						type: VariableType.adaptive,
					},
				},
			}),
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
		soul: {
			variables: defineVariables({
				meta: {
					TotalShield: {
						type: VariableType.shield,
					},
				},
				uninteresting: ['TimeWithoutTakingDamage'],
			}),
		},
	},
	Ocean: {
		soul: {
			variables: defineVariables({
				meta: {
					TotalHeal: {
						type: VariableType.heal,
					},
				},
				uninteresting: ['HealDuration', 'MinionPenalty'],
			}),
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
	damageVars?: (self: DamageSource, vars: IDamageVars) => void;
	variables?: ISpecificVariables<DetectDragonVariables<TMiscData['dragons'][Name][Type]>, any>;
	[key: string]: any;
};
