import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISenna from '@lolcalc/data/files/champion/Senna.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			passiveStealTargetMS: clamp(0, self.internalData.value.passiveStealTargetMS ?? 0, 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Senna', typeof ISenna, 'passive'>()({
			known: {
				'{e88568f8}': [0],
				SiphonCurrentHealthDamage: [],
				MoveSpeedFromTarget: [],
				SoulsAD: [],
				SoulsRange: [],
				SoulsLifesteal: [],
			},
			calculate(self, target) {
				const passiveVarParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

				const siphonHpPercent = championAbilityVariableValue('BonusCurentHealthDamage', passiveVarParams);
				let SiphonCurrentHealthDamage = Number.NaN;
				if (typeof siphonHpPercent.value === 'number') {
					SiphonCurrentHealthDamage = (siphonHpPercent.value / 100) * (target?.stats.value.total.hp ?? 0);
				}

				return {
					'{e88568f8}': {
						value: self.internalData.value.passiveStacks,
					},
					SiphonCurrentHealthDamage: {
						value: SiphonCurrentHealthDamage,
					},
					MoveSpeedFromTarget: {
						value: self.stats.value.championPassive.moveSpeed ?? 0,
					},
					SoulsAD: {
						value: self.stats.value.championPassive.attackDamage ?? 0,
					},
					SoulsRange: {
						value: self.stats.value.championPassive.attackRange ?? 0,
					},
					SoulsLifesteal: {
						value: self.stats.value.championPassive.lifeSteal ?? 0,
					},
				};
			},
			meta: {
				SiphonCurrentHealthDamage: {
					type: VariableType.physical,
					isCustom: true,
				},
				MoveSpeedFromTarget: {
					isCustom: true,
				},
				SoulsAD: {
					isCustom: true,
				},
				SoulsRange: {
					isCustom: true,
				},
				SoulsLifesteal: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				BonusOnHitDamage: {
					type: VariableType.physical,
				},
				'{e88568f8}': {
					isCustom: true,
					displayedName: 'Stacks',
				},
			},
			uninteresting: ['ADPerStack', 'StacksForBonus', 'BonusRange', 'BonusCritChance', 'CritToLifestealConversionPercent'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				const params: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

				const critDamageMod = championAbilityVariableValue('CritDamageMod', params);
				if (typeof critDamageMod.value === 'number') {
					// TODO on patch 16.17 seems to actually be 0.75, revisit when calculating aa dmg
					calculatedVariables.critMultiplierMod = critDamageMod.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS senna] failed to calculate crit damage multiplier', critDamageMod);
				}

				const stacksStep = championAbilityVariableValue('StacksForBonus', params);
				if (typeof stacksStep.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive stacks step', stacksStep);
					return;
				}

				const sennaPassiveStacksStep = Math.floor(self.internalData.value.passiveStacks / stacksStep.value);

				const rangePerStep = championAbilityVariableValue('BonusRange', params);
				if (typeof rangePerStep.value === 'number') {
					championPassiveStats.attackRange = rangePerStep.value * sennaPassiveStacksStep;
				} else {
					console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive range per step', rangePerStep);
				}

				const critPerStep = championAbilityVariableValue('BonusCritChance', params);
				if (typeof critPerStep.value === 'number') {
					championPassiveStats.critChance = (critPerStep.value * sennaPassiveStacksStep) / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive crit per step', critPerStep);
				}

				const adPerStack = championAbilityVariableValue('ADPerStack', params);
				if (typeof adPerStack.value === 'number') {
					championPassiveStats.attackDamage = adPerStack.value * self.internalData.value.passiveStacks;
				} else {
					console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive ad per stack', adPerStack);
				}

				if (self.internalData.value.passiveStealTargetMS && self.calculationDamageTarget.value) {
					const msSteal = championAbilityVariableValue('MSSteal', params);
					if (typeof msSteal.value === 'number') {
						championPassiveStats.moveSpeed = msSteal.value * self.calculationDamageTarget.value.stats.value.total.moveSpeed;
					} else {
						console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive ms steal', msSteal);
					}
				}
			},
		},
		onTotalPreMultipliers: {
			handler(self, { bonusStats, totalPreMultipliersStats, championPassiveStats }) {
				const params: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

				const excessCritToLifesteal = championAbilityVariableValue('CritToLifestealConversionPercent', params);
				if (typeof excessCritToLifesteal.value === 'number') {
					championPassiveStats.lifeSteal = excessCritToLifesteal.value * Math.max(0, bonusStats.critChance - 1);
					bonusStats.lifeSteal += championPassiveStats.lifeSteal;
					totalPreMultipliersStats.lifeSteal += championPassiveStats.lifeSteal;
				} else {
					console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive ad per stack', excessCritToLifesteal);
				}
			},
		},
		postTotal: {
			handler(_self, { championPassiveStats }, { calculatedVariables }) {
				if (calculatedVariables.midQuestMultiplier) {
					const passiveMidQuestAd = championPassiveStats.attackDamage! * calculatedVariables.midQuestMultiplier;
					calculatedVariables.bloodmailRetributionExcludedAd += passiveMidQuestAd;
				}
			},
		},
	},
} satisfies IChampionSpecific<'Senna'>;
