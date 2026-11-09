import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IJayce from '@lolcalc/data/files/champion/Jayce.json';
import type { IChampion } from '@lolcalc/data/types.js';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

function eCalculateMS(progress: number, champion: IChampion, abilityLevel: number): number {
	const bonusMS = championAbilityVariableValue('MovementSpeed', {
		abilityKey: 'e',
		abilityVariant: champion.abilities.e.variants[1]!,
		abilityLevel,
	});

	if (typeof bonusMS.value === 'number') {
		return bonusMS.value * progress;
	}

	console.warn('[CHAMPION_SPECIFICS jayce] failed to calculate e bonus MS', bonusMS);
	return Number.NaN;
}

export default {
	setupData(self) {
		self.abilityLevels.value.r = 1;
		return {
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			eMSProgress: clamp(0, Math.round(self.internalData.value.eMSProgress ?? 0), 100),
		};
	},
	passive: {
		variables: defineChampionVariables<'Jayce', typeof IJayce, 'passive'>()({
			uninteresting: ['FlatMovementSpeed', 'MovementSpeedDuration'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Jayce', typeof IJayce, 'q'>()({
			meta: {
				'JayceToTheSkies:Damage': {
					type: VariableType.physical,
					displayedName: 'LeapDamage',
				},
				Slow: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				'JayceShockBlast:Damage': {
					type: VariableType.physical,
					displayedName: 'ShockDamage',
				},
				'JayceShockBlast:EmpoweredDamage': {
					type: VariableType.physical,
					displayedName: 'ShockEmpoweredDamage',
				},
			},
			uninteresting: ['MonsterBonusDamage'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Jayce', typeof IJayce, 'w'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				ActualDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['Duration', 'NumAttacks'],
		}),
	},
	e: {
		derivedMS: ((progress, self) => self?.stats.value.variables.jayceEBonusMS ?? eCalculateMS(progress, self.champion.value!, self.abilityLevels.value.e)) satisfies IDeriveProgressFn,
		variables: defineChampionVariables<'Jayce', typeof IJayce, 'e'>()({
			known: {
				TotalDamage: [],
				BonusMS: [],
			},
			calculate(self, target) {
				let TotalDamage = Number.NaN;

				const eParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'e',
					abilityVariant: self.champion.value!.abilities.e.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('FlatDamage', eParams);
				const damagePercent = championAbilityVariableValue('PercHPDamage', eParams);
				if (typeof baseDamage.value === 'number' && typeof damagePercent.value === 'number') {
					TotalDamage = baseDamage.value + damagePercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS jayce] failed to calculate e damage vars', baseDamage, damagePercent);
				}

				return {
					TotalDamage: { value: TotalDamage },
					BonusMS: {
						value: self.stats.value.variables.jayceEBonusMS ?? 0,
					},
				};
			},
			meta: {
				FlatDamage: {
					type: VariableType.magic,
				},
				TotalDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				BonusMS: {
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['Duration', 'HasteDuration'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Jayce', typeof IJayce, 'r'>()({
			known: {
				BonusResists: [],
			},
			calculate(self) {
				return {
					BonusResists: {
						value: self.stats.value.championPassive.armor ?? 0,
					},
				};
			},
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				BonusResists: {
					isCustom: true,
					additionalInfo: "This is the actual resists value that Jayce's R grants. The displayed <var>Resists</var> ignores some AD when actually calculating the value",
				},
			},
			uninteresting: [],
		}),
	},
	calculateHooks: {
		/* additionally there are 2 checks for if champion is jayce in `itemBuyability` and Damage source's `this.stats.value.isRanged` watch to allow him to buy and keep ranged items */
		postInit: {
			handler(self, { championPassiveStats }) {
				const { q, w, e } = self.abilityVariantsIndexes.value;
				if (q & w & e) {
					const bonusRange = championAbilityVariableValue('RangedFormRangeIncrease', {
						abilityKey: 'r',
						abilityVariant: self.champion.value!.abilities.r.variants[0]!,
					});
					if (typeof bonusRange.value === 'number') {
						championPassiveStats.attackRange = bonusRange.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS jayce] failed to calculate cannon range', bonusRange);
					}
				}

				if (self.internalData.value.isPassiveMSActive) {
					const ms = championAbilityVariableValue('FlatMovementSpeed', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						damageSource: self,
					});

					if (typeof ms.value === 'number') {
						championPassiveStats.moveSpeed = ms.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS jayce] failed to calculate passive move speed', ms);
					}
				}
			},
		},
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				const bonusMS = eCalculateMS(self.internalData.value.eMSProgress, self.champion.value!, self.abilityLevels.value.e);
				if (!Number.isNaN(bonusMS)) {
					calculatedVariables.jayceEBonusMS = bonusMS;
					calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.jayceEBonusMS / 100;
				}
			},
		},
		postTotal: {
			handler(self, { championPassiveStats, bonusStats, adaptiveForceMeta, totalStats, totalMultipliersStats, totalPreMultipliersStats, dragonStats, dragonStatMultipliers, baseOnLevelStats }, { calculatedVariables }) {
				const { q, w, e } = self.abilityVariantsIndexes.value;
				if (!(q & w & e)) {
					/* i really dislike the whole `baseAdRatio` business going on and getting the bloodmail value for it but the jayce resists seem really weird and i can't come up with anything better, the `bonusAD` below was mostly guessed at by an llm until tests passed */
					const usedBloodmailRetribution = totalPreMultipliersStats.attackDamage * (calculatedVariables.bloodmailRetributionPercentage ?? 0);
					const usedTotalAD = totalPreMultipliersStats.attackDamage + (dragonStats.attackDamage ?? 0) + usedBloodmailRetribution;

					const excludedBloodmailADRatio = usedTotalAD ? baseOnLevelStats.attackDamage / usedTotalAD : 0;
					const bloodmailExcludedAD = usedBloodmailRetribution * excludedBloodmailADRatio * (1 - dragonStatMultipliers.attackDamage);

					const bonusAD =
						totalPreMultipliersStats.attackDamage -
						baseOnLevelStats.attackDamage +
						(dragonStats.attackDamage ?? 0) +
						usedBloodmailRetribution -
						bloodmailExcludedAD -
						(adaptiveForceMeta[1] ? 0 : calculatedVariables.totalAdaptiveForce) -
						baseOnLevelStats.attackDamage * dragonStatMultipliers.attackDamage;

					const rawResists = championAbilityVariableValue('Resists', {
						abilityKey: 'r',
						abilityVariant: self.champion.value!.abilities.r.variants[0]!,
						damageSource: {
							level: { value: self.level.value },
							stats: { value: { bonus: { attackDamage: Math.max(0, bonusAD) } } },
						} as DamageSource,
					});

					if (typeof rawResists.value === 'number') {
						const resists = rawResists.value;
						championPassiveStats.armor = resists;
						championPassiveStats.magicResist = resists;
						totalPreMultipliersStats.armor += resists;
						totalPreMultipliersStats.magicResist += resists;

						let jakShoResists = 0;
						if (calculatedVariables.jakShoBonusResistMultiplier) {
							jakShoResists = resists * calculatedVariables.jakShoBonusResistMultiplier;
							calculatedVariables.jakShoArmor! += jakShoResists;
							calculatedVariables.jakShoMagicResist! += jakShoResists;
						}

						let multArmor = jakShoResists;
						let multMR = jakShoResists;

						if (dragonStatMultipliers.armor) {
							const value = (resists + jakShoResists) * dragonStatMultipliers.armor;
							dragonStats.armor! += value;
							multArmor += value;
						}
						if (dragonStatMultipliers.magicResist) {
							const value = (resists + jakShoResists) * dragonStatMultipliers.magicResist;
							dragonStats.magicResist! += value;
							multMR += value;
						}

						totalMultipliersStats.armor += multArmor;
						totalMultipliersStats.magicResist += multMR;

						const totalAddedArmor = resists + multArmor;
						const totalAddedMR = resists + multMR;
						bonusStats.armor += totalAddedArmor;
						bonusStats.magicResist += totalAddedMR;
						totalStats.armor += totalAddedArmor;
						totalStats.magicResist += totalAddedMR;
					} else {
						console.warn('[CHAMPION_SPECIFICS jayce] failed to calculate r resists', rawResists);
					}
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Jayce,
		},
	},
} satisfies IChampionSpecific<'Jayce'>;
