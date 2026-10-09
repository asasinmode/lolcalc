import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IZeri from '@lolcalc/data/files/champion/Zeri.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			rActive: clamp(0, self.internalData.value.rActive ?? 0, 1),
			rStacks: Math.max(0, self.internalData.value.rStacks ?? 0),
		};
	},
	passive: {
		variables: defineChampionVariables<'Zeri', typeof IZeri, 'passive'>()({
			known: {
				TotalFullChargeDamage: [],
			},
			calculate(self, target) {
				let TotalFullChargeDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('PassiveMaxDamage', passiveParams);
				const percentHPDmg = championAbilityVariableValue('PassiveMaxChargePercentHealth', passiveParams);

				if (typeof baseDamage.value === 'number' && typeof percentHPDmg.value === 'number') {
					TotalFullChargeDamage = baseDamage.value + (target?.stats.value.total.hp ?? 0) * percentHPDmg.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS zeri] failed to calculate passive total full charge damage variables', baseDamage, percentHPDmg);
				}

				return {
					TotalFullChargeDamage: {
						value: TotalFullChargeDamage,
					},
				};
			},
			meta: {
				TotalFullChargeDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				MinDamage: {
					type: VariableType.magic,
				},
				PassiveMaxDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	q: {
		variables: defineChampionVariables<'Zeri', typeof IZeri, 'q'>()({
			known: {
				BonusAD: [],
			},
			calculate(self) {
				return {
					BonusAD: {
						value: self.stats.value.championPassive.attackDamage ?? 0,
					},
				};
			},
			meta: {
				ActiveDamageThatCanCrit: {
					type: VariableType.physical,
				},
				BonusAD: {
					isCustom: true,
				},
			},
			uninteresting: ['NumberOfMissiles', 'ExcessAttackSpeedToADMult', 'AttackSpeedCap'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Zeri', typeof IZeri, 'w'>()({
			known: {
				WallCritDamage: [],
			},
			calculate() {
				return {
					WallCritDamage: {
						value: 'TODO',
					},
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				SlowPercent: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				WallDamage: {
					type: VariableType.physical,
				},
				WallCritDamage: {
					type: VariableType.physical,
					isCustom: true,
				},
			},
			uninteresting: ['CriticalEffectiveness'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Zeri', typeof IZeri, 'e'>()({
			meta: {
				BonusDamageTotal: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['BuffDuration', 'CDReductionPerHit', 'CritCDReductionPerHit', 'CritScalingMod'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Zeri', typeof IZeri, 'r'>()({
			meta: {
				TotalActiveDamage: {
					type: VariableType.magic,
				},
				ChainPhysicalDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['BaseASPercent', 'BaseBonusMS', 'RDuration', 'MaxHyperchargeDuration', 'MSPercent'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (!self.internalData.value.rActive) {
					return;
				}

				const rParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'r',
					abilityVariant: self.champion.value?.abilities.r.variants[0]!,
					damageSource: self,
				};

				const ultBonusMS = championAbilityVariableValue('BaseBonusMS', rParams);
				if (typeof ultBonusMS.value === 'number') {
					calculatedVariables.totalBonusPercentMoveSpeed += ultBonusMS.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate r bonus ms', ultBonusMS);
				}

				if (self.internalData.value.rStacks) {
					const stackMS = championAbilityVariableValue('MSPercent', rParams);
					if (typeof stackMS.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += self.internalData.value.rStacks * stackMS.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate r stacks bonus ms', stackMS);
					}
				}
			},
		},
		onTotalPreMultipliers: {
			handler(self, { totalPreMultipliersStats, baseStats, championPassiveStats, bonusStats }, { calculatedVariables, miscDebug }) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				};

				miscDebug.zeriExcessAS = 0;

				const passiveASCap = championAbilityVariableValue('AttackSpeedCap', passiveParams);
				if (typeof passiveASCap.value === 'number') {
					calculatedVariables.attackSpeedCap = passiveASCap.value;
					miscDebug.zeriExcessAS = Math.max(0, totalPreMultipliersStats.attackSpeed - passiveASCap.value);
				} else {
					console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate passive attack speed cap', passiveASCap);
				}

				const asToAD = championAbilityVariableValue('ExcessAttackSpeedToADMult', passiveParams);
				if (typeof asToAD.value === 'number') {
					miscDebug.zeriExcessASPercent = miscDebug.zeriExcessAS / baseStats.attackSpeedRatio;
					/* passive calculates off of excess bonus % attack speed, so convert raw excess as to it */
					championPassiveStats.attackDamage = miscDebug.zeriExcessASPercent * asToAD.value * 100;
					bonusStats.attackDamage += championPassiveStats.attackDamage;
					totalPreMultipliersStats.attackDamage += championPassiveStats.attackDamage;

					calculatedVariables.bloodmailRetributionExcludedAd += championPassiveStats.attackDamage * calculatedVariables.midQuestMultiplier;
				} else {
					console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate attack speed cap', asToAD);
				}

				if (!self.internalData.value.rActive) {
					return;
				}

				const ultASPercent = championAbilityVariableValue('BaseASPercent', {
					abilityKey: 'r',
					abilityVariant: self.champion.value?.abilities.r.variants[0]!,
					damageSource: self,
				});
				if (typeof ultASPercent.value === 'number') {
					calculatedVariables.attackSpeedCap += ultASPercent.value * baseStats.attackSpeedRatio;
					championPassiveStats.bonusAttackSpeedPercent = ultASPercent.value;
					championPassiveStats.attackSpeed = baseStats.attackSpeedRatio * ultASPercent.value;
					totalPreMultipliersStats.attackSpeed += championPassiveStats.attackSpeed;
					totalPreMultipliersStats.bonusAttackSpeedPercent += ultASPercent.value;
					bonusStats.bonusAttackSpeedPercent = ultASPercent.value;
					bonusStats.attackSpeed += championPassiveStats.attackSpeed;
				} else {
					console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate r attack speed', ultASPercent);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Zeri'>;
