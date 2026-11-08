import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ISinged from '@lolcalc/data/files/champion/Singed.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

const passiveMaxStacks = 9;

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks),
			isRActive: clamp(0, Math.round(self.internalData.value.isRActive ?? 0), 1),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Singed', typeof ISinged, 'passive'>()({
			known: {
				BonusMS: [],
			},
			calculate(self) {
				return {
					BonusMS: {
						value: self.stats.value.variables.singedPassiveBonusMS ?? 0,
					},
				};
			},
			meta: {
				BonusMS: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['MSPercent', 'MSDuration', 'PerTargetCD'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Singed', typeof ISinged, 'q'>()({
			meta: {
				DamagePerSecond: {
					type: VariableType.magic,
				},
				ApproximateTotalDamageTooltip: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['CloudDuration', 'PoisonDuration'],
		}),
	},
	w: {
		dataOverrides: {
			isImmobilizing: true,
		},
		variables: defineChampionVariables<'Singed', typeof ISinged, 'w'>()({
			meta: {
				Slow: {
					type: VariableType.affectedBySlowResist,
				},
			},
			uninteresting: ['WDuration'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Singed', typeof ISinged, 'e'>()({
			known: {
				TotalDamage: [],
			},
			calculate(self, target) {
				let TotalDamage = Number.NaN;

				const wParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'e',
					abilityVariant: self.champion.value!.abilities.e.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('BaseDamage', wParams);
				const damagePercent = championAbilityVariableValue('MaxHPDamage', wParams);
				if (typeof baseDamage.value === 'number' && typeof damagePercent.value === 'number') {
					TotalDamage = baseDamage.value + damagePercent.value * 0.01 * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS singed] failed to calculate e damage vars', baseDamage, damagePercent);
				}

				return {
					TotalDamage: {
						value: TotalDamage,
					},
				};
			},
			meta: {
				BaseDamage: {
					type: VariableType.magic,
				},
				Duration: {
					type: VariableType.affectedByTenacity,
				},
				TotalDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Singed', typeof ISinged, 'r'>()({
			uninteresting: ['Duration', 'GrievousAmount', 'GrievousDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				if (self.internalData.value.passiveStacks) {
					const ms = championAbilityVariableValue('MSPercent', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					});
					if (typeof ms.value === 'number') {
						calculatedVariables.singedPassiveBonusMS = ms.value * self.internalData.value.passiveStacks;
						calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.singedPassiveBonusMS;
					} else {
						console.warn('[CHAMPION_SPECIFICS singed] failed to calculate passive ms', ms);
					}
				}

				if (self.internalData.value.isRActive) {
					const statAmount = championAbilityVariableValue('StatAmount', {
						abilityKey: 'r',
						abilityVariant: self.champion.value!.abilities.r.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					});
					if (typeof statAmount.value === 'number') {
						championPassiveStats.abilityPower = statAmount.value;
						calculatedVariables.apMultipliersBase += statAmount.value;
						championPassiveStats.armor = statAmount.value;
						championPassiveStats.magicResist = statAmount.value;
						championPassiveStats.moveSpeed = statAmount.value;
						championPassiveStats.hpRegen = statAmount.value;
						championPassiveStats.manaRegen = statAmount.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS singed] failed to calculate R stats', statAmount);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Singed'>;
