import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ISyndra from '@lolcalc/data/files/champion/Syndra.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMaxStacks(self: DamageSource<'Syndra'>): number {
	return (self.champion.value! as typeof ISyndra).abilities.passive.variants[0]!.dataValues.MaxStackAmount[1]!;
}

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks(self)),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Syndra', typeof ISyndra, 'passive'>()({
			known: {
				AbilityPower: [],
			},
			calculate(self) {
				return {
					AbilityPower: {
						value: self.stats.value.championPassive.abilityPower ?? 0,
					},
				};
			},
			meta: {
				AbilityPower: {
					isCustom: true,
				},
			},
			uninteresting: ['MaxStackAmount', 'MarkDuration', 'PassiveMarkCooldown', 'PassiveStacksPerLevel', 'StackPerSiege', 'CapstoneAPPerc'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Syndra', typeof ISyndra, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			/* `Q1UpgradeThreshold` is from passive */
			uninteresting: ['SphereDuration', 'Q1UpgradeThreshold' as any, 'Upgrade1MaxAmmo'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Syndra', typeof ISyndra, 'w'>()({
			known: {
				f2: [],
				f3: [0, 1],
				EvolvedBonusTrueDamage: [],
			},
			calculate(self) {
				let f3 = Number.NaN;
				let EvolvedBonusTrueDamage = Number.NaN;

				const wUpgradeThreshold = championAbilityVariableValue('WUpgradeThreshold', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});

				if (typeof wUpgradeThreshold.value === 'number') {
					f3 = self.internalData.value.passiveStacks >= wUpgradeThreshold.value ? 1 : 0;
				} else {
					console.warn('[CHAMPION_SPECIFICS syndra] failed to calculate w upgrade threshold', wUpgradeThreshold);
				}

				const wParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'w', abilityVariant: self.champion.value!.abilities.w.variants[0]!, damageSource: self };
				const baseDmg = championAbilityVariableValue('ThrowDamage', wParams);
				const bonusTruePercent = championAbilityVariableValue('TOOLTIPONLYPassiveBonusPercent', wParams);
				if (typeof baseDmg.value === 'number' && typeof bonusTruePercent.value === 'number') {
					EvolvedBonusTrueDamage = baseDmg.value * bonusTruePercent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS syndra] failed to calculate w true damage vars', { baseDmg, bonusTruePercent });
				}

				return {
					f2: championAbilityVariableValue('SlowDuration', {
						abilityKey: 'w',
						abilityVariant: self.champion.value!.abilities.w.variants[0]!,
						damageSource: self,
					}),
					f3: {
						value: f3,
					},
					EvolvedBonusTrueDamage: {
						value: EvolvedBonusTrueDamage,
					},
				};
			},
			meta: {
				f2: {
					displayedName: 'SlowDuration',
					type: VariableType.affectedByTenacity,
					roundReplaced: 2,
				},
				ThrowDamage: {
					type: VariableType.magic,
				},
				TotalSlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				EvolvedBonusTrueDamage: {
					type: VariableType.true,
					isCustom: true,
				},
				TOOLTIPONLYPassiveBonusPercent: {
					displayedName: 'BonusTruePercent',
				},
			},
			/* `WUpgradeThreshold` is from passive */
			uninteresting: ['WUpgradeThreshold' as any],
		}),
	},
	e: {
		variables: defineChampionVariables<'Syndra', typeof ISyndra, 'e'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
				UpgradedSlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				UpgradedSlowDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
			/* `EUpgradeThreshold` is from passive */
			uninteresting: ['EUpgradeThreshold' as any],
		}),
	},
	r: {
		variables: defineChampionVariables<'Syndra', typeof ISyndra, 'r'>()({
			known: {
				ExecutesBelowHP: [],
			},
			calculate(self, target) {
				let ExecutesBelowHP = Number.NaN;

				const thresholdPercent = championAbilityVariableValue('UpgradeExecuteThreshold', {
					abilityKey: 'r',
					abilityVariant: self.champion.value!.abilities.r.variants[0]!,
					damageSource: self,
				});
				if (typeof thresholdPercent.value === 'number') {
					ExecutesBelowHP = thresholdPercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS syndra] failed to calculate passive execute percent', thresholdPercent);
				}

				return {
					ExecutesBelowHP: {
						value: ExecutesBelowHP,
					},
				};
			},
			meta: {
				DamageCalc: {
					type: VariableType.magic,
				},
				MaxDamageCalc: {
					type: VariableType.magic,
				},
				ExecutesBelowHP: {
					isCustom: true,
				},
			},
			/* RUpgradeThreshold is from passive */
			uninteresting: ['QHastePerRank', 'RUpgradeThreshold' as any, 'UpgradeExecuteThreshold'],
		}),
	},
	calculateHooks: {
		onTotalPreMultipliers: {
			handler(self, { championPassiveStats, totalMultipliersStats }, { calculatedVariables }) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				};
				const maxStacks = championAbilityVariableValue('MaxStackAmount', passiveParams);

				if (self.internalData.value.passiveStacks === maxStacks.value) {
					const apIncrease = championAbilityVariableValue('CapstoneAPPerc', passiveParams);
					if (typeof apIncrease.value === 'number') {
						championPassiveStats.abilityPower = calculatedVariables.apMultipliersBase * apIncrease.value;
						totalMultipliersStats.abilityPower += championPassiveStats.abilityPower;
					} else {
						console.warn('[CHAMPION_SPECIFICS syndra] failed to calculate passive ap increase', apIncrease);
					}
				} else if (typeof maxStacks.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS syndra] failed to calculate passive max stacks', maxStacks);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Syndra'>;
