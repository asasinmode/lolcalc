import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { calculatesFromPartExtendedEquals, championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IKaisa from '@lolcalc/data/files/champion/Kaisa.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMaxStacks(self: DamageSource<'Kaisa'>): number {
	return (self.champion.value! as typeof IKaisa).abilities.passive.variants[0]!.dataValues.PMaxStacks[1]!;
}

const eBuffOptions = {
	none: 0,
	attackSpeed: 1,
	moveSpeed: 2,
	both: 3,
};

export default {
	setupData(self) {
		return {
			passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), passiveMaxStacks(self)),
			eBuff: clamp(0, Math.round(self.internalData.value.eBuff ?? 0), eBuffOptions.both),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Kaisa', typeof IKaisa, 'passive'>()({
			known: {
				'f1.1': [0],
				'f2.1': [0],
				'f3.1': [0],
				TotalStackDamage: [],
				MaxStacksConsumeDamage: [],
			},
			calculate(self, _target) {
				let TotalStackDamage = Number.NaN;
				// let MaxStacksConsumeDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const stackBaseDmg = championAbilityVariableValue('PBaseDamage', passiveParams);
				const perStackDmg = championAbilityVariableValue('PCurrentPerStackDamage', passiveParams);
				if (typeof stackBaseDmg.value === 'number' && typeof perStackDmg.value === 'number') {
					TotalStackDamage = stackBaseDmg.value + perStackDmg.value * self.internalData.value.passiveStacksOnTarget;
				} else {
					console.warn('[CHAMPION_SPECIFICS kaisa] failed to calculate passive stack damage vars', stackBaseDmg, perStackDmg);
				}

				// const consumeHPPercent = championAbilityVariableValue('PExecutePercentage', passiveParams);
				// if (typeof consumeHPPercent.value === 'number') {
				// 	const targetMissingHP = target
				// 		? Math.max(target.stats.value.total.hp - target.currentHealth.value, 0)
				// 		: 0;
				// 	MaxStacksConsumeDamage = targetMissingHP * consumeHPPercent.value;
				// } else {
				// 	console.warn('[CHAMPION_SPECIFICS kaisa] failed to calculate passive consume var', consumeHPPercent);
				// }

				return {
					'f1.1': {
						value: self.stats.value.bonus.attackDamage,
					},
					'f2.1': {
						value: self.stats.value.total.abilityPower,
					},
					'f3.1': {
						value: self.stats.value.bonus.bonusAttackSpeedPercent,
					},
					TotalStackDamage: {
						value: TotalStackDamage,
					},
					MaxStacksConsumeDamage: {
						value: 'TODO',
					},
				};
			},
			meta: {
				'f1.1': {
					displayedName: 'EvolveAttackDamage',
				},
				'f2.1': {
					displayedName: 'EvolveAbilityPower',
				},
				'f3.1': {
					displayedName: 'EvolveAttackSpeed',
					multiplier: 100,
					roundReplaced: 1,
				},
				PBaseDamage: {
					type: VariableType.magic,
				},
				PCurrentPerStackDamage: {
					type: VariableType.magic,
				},
				TotalStackDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				MaxStacksConsumeDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			/* effect 2 and 6 amounts come from other spells */
			uninteresting: ['PDuration', 'PDamageCap', 'PMaxStacks', 'PAllyStacks', 'Effect2Amount' as any, 'Effect6Amount' as any],
		}),
	},
	q: {
		variables: defineChampionVariables<'Kaisa', typeof IKaisa, 'q'>()({
			known: {
				'f11.1': [0],
			},
			calculate(self) {
				return {
					'f11.1': {
						value: self.stats.value.bonus.attackDamage,
					},
				};
			},
			meta: {
				'f11.1': {
					displayedName: 'EvolveAttackDamage',
				},
				TotalIndividualMissileDamage: {
					type: VariableType.physical,
				},
				MaxDamageDisplay: {
					type: VariableType.physical,
					calculatesFrom: [],
				},
			},
			uninteresting: ['Effect2Amount', 'Effect4Amount', 'Effect5Amount', 'Effect6Amount', 'Effect7Amount', 'ExtraHitReduction'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Kaisa', typeof IKaisa, 'w'>()({
			known: {
				'f2.1': [0],
			},
			calculate(self) {
				return {
					'f2.1': {
						value: self.stats.value.total.abilityPower,
					},
				};
			},
			meta: {
				'f2.1': {
					displayedName: 'EvolveAbilityPower',
				},
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			/* `PDuration` comes from passive */
			uninteresting: ['Effect2Amount', 'Effect4Amount', 'Effect3Amount', 'Effect5Amount', 'PDuration' as any],
		}),
	},
	e: {
		buffOptions: eBuffOptions,
		variables: defineChampionVariables<'Kaisa', typeof IKaisa, 'e'>()({
			known: {
				'f10.1': [0],
			},
			calculate(self) {
				return {
					TotalCastTime: championAbilityVariableValue('TotalCastTime', {
						abilityKey: 'e',
						abilityVariant: self.champion.value!.abilities.e.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						abilityLevel: self.abilityLevels.value.e,
						damageSource: {
							stats: {
								value: { total: { bonusAttackSpeedPercent: self.stats.value.total.attackSpeed } },
							},
						} as DamageSource,
					}),
					'f10.1': {
						value: self.stats.value.bonus.bonusAttackSpeedPercent - (self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0),
					},
				};
			},
			meta: {
				TotalMoveSpeed: {
					extendedEquals(variableValueParams) {
						const mult = championAbilityVariableValue('Effect1Amount', variableValueParams);
						if (typeof mult.value === 'number') {
							const asPart = calculatesFromPartExtendedEquals(
								{
									value: mult.value,
									stat: 'bonusAttackSpeedPercent',
									type: 'bonus',
									isPercentage: true,
								},
								true,
							);
							const constPart = calculatesFromPartExtendedEquals(
								{
									value: mult.value,
									stat: 'const',
									isPercentage: true,
								},
								true,
							);
							return `${asPart} + ${constPart}`;
						}
						return '';
					},
				},
				'f10.1': {
					displayedName: 'EvolveAttackSpeed',
					multiplier: 100,
					roundReplaced: 1,
				},
				TotalCastTime: {
					scalesWithStatIcon: undefined,
					extendedEquals: undefined,
				},
				Effect5Amount: {
					displayedName: 'ChargedAttackSpeed',
				},
			},
			uninteresting: ['Effect2Amount', 'Effect4Amount', 'Effect6Amount', 'Effect7Amount'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Kaisa', typeof IKaisa, 'r'>()({
			meta: {
				RCalculatedShieldValue: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['RShieldDuration'],
		}),
	},
	calculateHooks: {
		postBonus: {
			handler(self, { baseOnLevelStats, championPassiveStats, totalPreMultipliersStats, bonusStats }, { calculatedVariables }) {
				const eParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'e',
					abilityVariant: self.champion.value!.abilities.e.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					abilityLevel: self.abilityLevels.value.e,
					damageSource: {
						level: { value: self.level.value },
						stats: {
							value: { bonus: { bonusAttackSpeedPercent: bonusStats.bonusAttackSpeedPercent } },
						},
					} as DamageSource,
				};

				if (self.internalData.value.eBuff & eBuffOptions.moveSpeed) {
					const msPercent = championAbilityVariableValue('TotalMoveSpeed', eParams);
					if (typeof msPercent.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += msPercent.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS kaisa] failed to calculate E bonus ms', msPercent);
					}
				}

				if (self.internalData.value.eBuff & eBuffOptions.attackSpeed) {
					const asPercent = championAbilityVariableValue('Effect5Amount', eParams);
					if (typeof asPercent.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = asPercent.value;
						bonusStats.bonusAttackSpeedPercent += asPercent.value;
						totalPreMultipliersStats.bonusAttackSpeedPercent += asPercent.value;

						championPassiveStats.attackSpeed = championPassiveStats.bonusAttackSpeedPercent * baseOnLevelStats.attackSpeedRatio;
						bonusStats.attackSpeed += championPassiveStats.attackSpeed;
						totalPreMultipliersStats.attackSpeed += championPassiveStats.attackSpeed;
					} else {
						console.warn('[CHAMPION_SPECIFICS kaisa] failed to calculate E bonus as', asPercent);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Kaisa'>;
