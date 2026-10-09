import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IJhin from '@lolcalc/data/files/champion/Jhin.json';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Jhin', typeof IJhin, 'passive'>()({
			known: {
				BonusAD: [],
			},
			calculate(self) {
				return {
					BonusAD: {
						value: self.stats.value.championPassive.attackDamage,
					},
				};
			},
			meta: {
				BonusAD: {
					isCustom: true,
				},
			},
			uninteresting: ['MaxAmmo', 'CritReductionPercent', 'HasteDuration'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { bonusStats, baseStats }, { calculatedVariables }) {
				const params: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const asPerLevel = championAbilityVariableValue('PercentAttackSpeedPerLevel', params);

				if (typeof asPerLevel.value === 'number') {
					const bonusASPercent = asPerLevel.value * (self.level.value - 1);
					bonusStats.attackSpeed += bonusASPercent * baseStats.attackSpeed;
				} else {
					console.warn('[CHAMPION_SPECIFICS jhin] failed to calculate passive attack speed per level', asPerLevel);
				}

				const critDamageReduction = championAbilityVariableValue('CritReductionPercent', params);
				if (typeof critDamageReduction.value === 'number') {
					calculatedVariables.critMultiplierMod = 1 - critDamageReduction.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS jhin] failed to calculate passive attack speed per level', critDamageReduction);
				}
			},
		},
		preBonus: {
			handler(_self, _stats, { debuffs }) {
				debuffs.cripple = 1;
			},
		},
		postBonus: {
			handler(self, { bonusStats }, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const msPercent = championAbilityVariableValue('CritMoveSpeedPercent', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: {
							level: { value: self.level.value },
							stats: {
								value: { bonus: { bonusAttackSpeedPercent: bonusStats.bonusAttackSpeedPercent } },
							},
						} as DamageSource,
					});

					if (typeof msPercent.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += msPercent.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS jhin] failed to calculate passive bonus ms', msPercent);
					}
				}
			},
		},
		postTotal: {
			handler(self, { adaptiveForceMeta, totalStats, championPassiveStats, dragonStats, bonusStats, totalMultipliersStats, totalPreMultipliersStats }, { calculatedVariables }) {
				const adPercent = championAbilityVariableValue('TotalADPercent', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: {
						level: { value: self.level.value },
						stats: {
							value: {
								total: { attackDamage: totalStats.attackDamage, critChance: totalStats.critChance },
								bonus: { bonusAttackSpeedPercent: bonusStats.bonusAttackSpeedPercent },
							},
						},
					} as DamageSource,
				});

				if (typeof adPercent.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS jhin] failed to calculate passive total ad percent', adPercent);
					return;
				}

				/* need to add swiftmarch adaptive since it's not in `totalPreMultipliersStats` - it's added to `totalMultipliersStats` */
				const passiveAd = (totalPreMultipliersStats.attackDamage + (calculatedVariables.swiftmarchAdaptive ?? 0) * adaptiveForceMeta[2]) * adPercent.value;

				if (calculatedVariables.midQuestMultiplier) {
					const preMultiplierBonusAd = bonusStats.attackDamage - (dragonStats.attackDamage ?? 0) - (calculatedVariables.midQuestAd ?? 0);
					const midQuestAd = preMultiplierBonusAd * calculatedVariables.midQuestMultiplier * adPercent.value;

					calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + midQuestAd;
					totalMultipliersStats.attackDamage += midQuestAd;
					totalStats.attackDamage += midQuestAd;
					bonusStats.attackDamage += midQuestAd;
					calculatedVariables.bloodmailRetributionExcludedAd += midQuestAd;
				}

				championPassiveStats.attackDamage = passiveAd;
				totalMultipliersStats.attackDamage += passiveAd;
				totalStats.attackDamage += passiveAd;
				bonusStats.attackDamage += passiveAd;

				calculatedVariables.bloodmailRetributionExcludedAd += passiveAd;
			},
			priority: HOOK_PRIORITIES.postTotal.Jhin,
		},
	},
} satisfies IChampionSpecific<'Jhin'>;
