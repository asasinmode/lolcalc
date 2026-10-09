import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { simpleFormattingGameAbilityImage } from '@lolcalc/core/misc.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { PATCH_VERSION } from '@lolcalc/data';
import type IBelveth from '@lolcalc/data/files/champion/Belveth.json';
import { AbilityType, ITEM_NAME_TO_ID, VariableType } from '@lolcalc/shared';
import type { IChampionRole } from '@lolcalc/shared/types.js';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { cooldownReductionPercentageFromHaste, defineChampionVariables } from './shared.ts';

const { vMinor } = PATCH_VERSION;

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Belveth', typeof IBelveth, 'passive'>()({
			known: {
				'{7f3c01cf}': [],
			},
			calculate(self) {
				return {
					'{7f3c01cf}': {
						value: self.internalData.value.passiveStacks,
					},
				};
			},
			meta: {
				'{7f3c01cf}': {
					isCustom: true,
					displayedName: 'Stacks',
				},
				TotalAttackSpeedFromStacks: {
					/* game doesn't show any of these */
					extendedEquals: undefined,
					calculatesFrom: [],
				},
			},
			uninteresting: ['SheenSpeedPerStack', 'SheenDuration', 'MonsterStacks', 'ChampionStacks'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Belveth', typeof IBelveth, 'q'>()({
			known: {
				f1: [],
				TotalMonsterDamage: [],
			},
			calculate(self) {
				let f1 = Number.NaN;
				const qParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				};
				const perSideCD = championAbilityVariableValue('PerSideCooldown', qParams);

				if (typeof perSideCD.value === 'number') {
					f1 = perSideCD.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate q per side cd', perSideCD);
				}

				const perSideASToAHRatio = championAbilityVariableValue('PerSideCDAttackSpeedMultiplier', qParams);
				if (typeof perSideASToAHRatio.value === 'number') {
					const haste = (self.stats.value.total.bonusAttackSpeedPercent - (self.stats.value.variables.belvethPostAbilityBonusAS ?? 0)) * perSideASToAHRatio.value * 100;
					const cdr = cooldownReductionPercentageFromHaste(haste);
					f1 *= 1 - cdr / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate q as to ah ratio', perSideASToAHRatio);
				}

				return {
					f1: {
						value: f1,
						roundReplaced: 1,
					},
					TotalMonsterDamage: {
						value: (championAbilityVariableValue('BaseDamage', qParams).value as number) + (championAbilityVariableValue('MonsterMod', qParams).value as number),
					},
				};
			},
			meta: {
				f1: {
					displayedName: 'PerSideCD',
				},
				BaseDamage: {
					type: VariableType.physical,
				},
				TotalMonsterDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['PerSideCDAttackSpeedMultiplier', 'MonsterMod'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Belveth', typeof IBelveth, 'w'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				SlowPercent: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['Duration'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Belveth', typeof IBelveth, 'e'>()({
			known: {
				'f2.0': [],
			},
			calculate(self) {
				return {
					'f2.0': {
						value: championAbilityVariableValue('TotalStrikes', {
							abilityKey: 'e',
							abilityVariant: self.champion.value!.abilities.e.variants[0]!,
							damageSource: self,
						}).value,
					},
				};
			},
			meta: {
				'f2.0': {
					displayedName: 'TotalStrikes',
				},
				DamagePerStrike: {
					type: VariableType.physical,
				},
				MaxDamagePerStrikeTooltip: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['TotalDuration', 'OnHitRatio', 'MonsterMod'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Belveth', typeof IBelveth, 'r'>()({
			known: {
				TotalComputedExplosionDamage: [],
				ComputedMaxHealthDevour: [],
			},
			calculate(self, target) {
				let TotalComputedExplosionDamage = Number.NaN;

				const ultParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'r',
					abilityVariant: self.champion.value!.abilities.r.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('TotalExplosionDamage', ultParams);
				const missingHealthPercent = championAbilityVariableValue('MissingHealthDamage', ultParams);
				if (typeof baseDamage.value === 'number' && typeof missingHealthPercent.value === 'number') {
					TotalComputedExplosionDamage = baseDamage.value + Math.max(0, (target?.stats.value.total.hp ?? 0) - (target?.currentHealth.value ?? 0)) * missingHealthPercent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate ult total computed damage', baseDamage, missingHealthPercent);
				}

				return {
					TotalComputedExplosionDamage: {
						value: TotalComputedExplosionDamage,
					},
					ComputedMaxHealthDevour: {
						value: self.stats.value.variables.belvethDevourBonusHP ?? 0,
					},
				};
			},
			meta: {
				FinalOnHitDamage: {
					type: VariableType.true,
				},
				TotalExplosionDamage: {
					type: VariableType.true,
					displayedName: 'ExplosionDamage',
				},
				TotalComputedExplosionDamage: {
					isCustom: true,
					type: VariableType.true,
					displayedName: 'TotalDamage',
				},
				MaxMonsterOnHitTooltip: {
					type: VariableType.true,
				},
				BaseMaxHealth: {
					type: VariableType.heal,
				},
				MaxHealthOnDevour: {
					displayedName: 'TooltipMaxHealthOnDevour',
				},
				ComputedMaxHealthDevour: {
					isCustom: true,
					displayedName: 'MaxHealthOnDevour',
					additionalInfo: `The in game tooltip <var>TooltipMaxHealthOnDevour</var> shows an incorrect value. <scalehealth>HP</scalehealth> from Belveth's true form doesn't actually scale with <scalead>attack damage</scalead> and <scaleap>ability power</scaleap> from [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.riftmaker))} Riftmaker's](https://wiki.leagueoflegends.com/en-us/Overlord's_Bloodmail) [Void Infusion](https://wiki.leagueoflegends.com/en-us/Named_item_effect#Void_Infusion), [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.dragon, 'Infernal', 'stack'))} Infernal Might](https://wiki.leagueoflegends.com/en-us/Dragon_Slayer) and [<img src="https://raw.communitydragon.org/${vMinor}/game/assets/ux/lol/rolequest_icon${'mid' satisfies IChampionRole}_complete.png" width="64" height="64" alt="mid quest completed icon"> mid quest's](https://wiki.leagueoflegends.com/en-us/Role_Quests#Quests) multipliers<br> <unknown>TODO bloodmail retribution scaling, currently unimplemented</unknown>`,
				},
			},
			uninteresting: ['PassiveStacksOnDevour', 'MissingHealthDamage', 'SteroidDuration', 'SteroidDurationUpgrade', 'StackThresholdForUpgrade', 'StackThresholdForPermanent', 'TotalASMod', 'VoidlingHPScale', 'VoidlingADScale'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { baseStats, championPassiveStats }, { calculatedVariables }) {
				calculatedVariables.attackSpeedCap = Number.POSITIVE_INFINITY;

				const rParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'r',
					abilityVariant: self.champion.value!.abilities.r.variants[0]!,
					damageSource: self,
				};
				const firstDurationIncreaseThreshold = championAbilityVariableValue('StackThresholdForUpgrade', rParams);
				const firstDurationIncrease = championAbilityVariableValue('SteroidDurationUpgrade', rParams);
				const secondDurationIncreaseThreshold = championAbilityVariableValue('StackThresholdForPermanent', rParams);
				if (typeof firstDurationIncreaseThreshold.value === 'number' && typeof secondDurationIncreaseThreshold.value === 'number' && typeof firstDurationIncrease.value === 'number') {
					if (self.internalData.value.passiveStacks >= secondDurationIncreaseThreshold.value) {
						baseStats.mana = 1;
					} else if (self.internalData.value.passiveStacks >= firstDurationIncreaseThreshold.value) {
						baseStats.mana = firstDurationIncrease.value;
					}
				} else {
					console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate true form duration modifiers', firstDurationIncrease, firstDurationIncrease, secondDurationIncreaseThreshold);
				}

				if (!self.currentAbilityResource.value) {
					return;
				}

				const trueFormRange = championAbilityVariableValue('BonusAARange', rParams);
				if (typeof trueFormRange.value === 'number') {
					championPassiveStats.attackRange = trueFormRange.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate true form range', trueFormRange);
				}
			},
		},
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				const { passiveStacks, hasPassiveStack } = self.internalData.value;
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

				championPassiveStats.bonusAttackSpeedPercent = 0;

				if (hasPassiveStack) {
					const sheenBonusAS = championAbilityVariableValue('SheenSpeedPerStack', passiveParams);
					if (typeof sheenBonusAS.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent += sheenBonusAS.value;
						calculatedVariables.belvethPostAbilityBonusAS = sheenBonusAS.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate passive post ability as', sheenBonusAS);
					}
				}

				const asPerStack = championAbilityVariableValue('AttackSpeedPerStack', passiveParams);
				if (typeof asPerStack.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent += (passiveStacks * asPerStack.value) / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate passive stack as', asPerStack);
				}

				if (self.currentAbilityResource.value) {
					const totalASMult = championAbilityVariableValue('TotalASMod', {
						abilityKey: 'r',
						abilityVariant: self.champion.value!.abilities.r.variants[0]!,
						damageSource: self,
					});
					if (typeof totalASMult.value === 'number') {
						calculatedVariables.totalAttackSpeedMult = totalASMult.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate true form total as', totalASMult);
					}
				}
			},
		},
		postTotal: {
			handler(self, { itemPassivesStats, itemTotalStats, dragonStats, totalStats, totalPreMultipliersStats, totalMultipliersStats, dragonStatMultipliers, bonusStats, championPassiveStats }, { calculatedVariables }) {
				/* the actual values used in belveth's true form hp scaling - stats from some sources are ignored */
				const ultUsedBonusAD = bonusStats.attackDamage - totalMultipliersStats.attackDamage; /* infernal & mid quest */
				const ultUsedTotalAP = totalStats.abilityPower - totalMultipliersStats.abilityPower /* infernal & mid quest */ - (calculatedVariables.riftmakerVoidInfusion ?? 0) * calculatedVariables.totalItemApMultipliers; /* all of riftmaker */

				const maxHP = championAbilityVariableValue('MaxHealthOnDevour', {
					abilityKey: 'r',
					abilityVariant: self.champion.value!.abilities.r.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					abilityLevel: self.abilityLevels.value.r,
					damageSource: {
						stats: {
							value: {
								total: { abilityPower: ultUsedTotalAP },
								bonus: { attackDamage: ultUsedBonusAD },
							},
						},
					} as DamageSource,
				});

				if (typeof maxHP.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate true form max hp', maxHP);
					return;
				}

				calculatedVariables.belvethDevourBonusHP = maxHP.value;

				if (!self.currentAbilityResource.value) {
					return;
				}

				// TODO maybe will be useful for bloodmail retribution calc
				// const baseHPValue = maxHP.calculatesFrom?.[0]?.value as number ?? 0;
				// const hpADScaling = maxHP.calculatesFrom?.[1]?.value as number ?? 0;
				// const hpAPScaling = maxHP.calculatesFrom?.[2]?.value as number ?? 0;

				championPassiveStats.hp = maxHP.value;
				totalStats.hp += maxHP.value;
				bonusStats.hp += maxHP.value;

				if (calculatedVariables.riftmakerBonusHPToAP) {
					let infusion = championPassiveStats.hp * calculatedVariables.riftmakerBonusHPToAP;

					totalPreMultipliersStats.abilityPower += infusion;
					calculatedVariables.riftmakerVoidInfusion! += infusion;
					if (calculatedVariables.apMultipliersBase) {
						calculatedVariables.apMultipliersBase += infusion;
					}

					let multValue = 0;
					if (calculatedVariables.rabadonApMultiplier) {
						const value = infusion * calculatedVariables.rabadonApMultiplier;
						calculatedVariables.rabadonMagicalOpus! += value;
						multValue += value;
					}
					if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
						const value = infusion * calculatedVariables.blackfireTorchBBlazeMultiplier;
						calculatedVariables.blackfireTorchBBlazeAP! += value;
						multValue += value;
					}
					if (dragonStatMultipliers.abilityPower) {
						const value = infusion * dragonStatMultipliers.abilityPower;
						dragonStats.abilityPower! += value;
						multValue += value;
					}
					if (calculatedVariables.midQuestMultiplier) {
						const value = infusion * calculatedVariables.midQuestMultiplier;
						calculatedVariables.midQuestAp! += value;
						multValue += value;
					}
					infusion += multValue;

					itemPassivesStats.abilityPower += infusion;
					itemTotalStats.abilityPower += infusion;
					totalStats.abilityPower += infusion;
					bonusStats.abilityPower += infusion;
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Belveth,
		},
	},
} satisfies IChampionSpecific<'Belveth'>;
