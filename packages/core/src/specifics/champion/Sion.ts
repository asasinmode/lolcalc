import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISion from '@lolcalc/data/files/champion/Sion.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionAbilitySpecific, IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn, IExtraInactiveFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const deathPassiveCommonAttrs: IChampionAbilitySpecific<'Sion'> = {
	additionalVariantsObjectNames: ['SionPassiveSpeed'],
	modifyVariantData(abilityVariant) {
		if (abilityVariant.objectName === 'SionPassiveSpeed') {
			abilityVariant.effectAmount = undefined;
			abilityVariant.cooldownTime = null;
			abilityVariant.mana = null;
		}
	},
};

const passiveBonusMS: IDeriveProgressFn = (progress) => {
	/* doesn't seem to be in a variable */
	return 0.67 * progress;
};

export default {
	setupData(self) {
		return {
			passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 0), 100),
			wStacks: Math.max(0, Math.round(self.internalData.value.wStacks ?? 0)),
		};
	},
	passive: {
		deathSurgeComponentInactive: ((self) => {
			const { q, w, e } = self.abilityVariantsIndexes.value;
			return !(q & w & e);
		}) satisfies IExtraInactiveFn,
		bonusMS: passiveBonusMS,
		variables: defineChampionVariables<'Sion', typeof ISion, 'passive'>()({
			known: {
				MaxHPDamage: [],
			},
			calculate(self, target) {
				let MaxHPDamage = Number.NaN;

				const damagePercent = championAbilityVariableValue('PercentMaxHP', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof damagePercent.value === 'number') {
					MaxHPDamage = damagePercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS sion] failed to calculate passive percent dmg', damagePercent);
				}

				return {
					MaxHPDamage: {
						value: MaxHPDamage,
					},
				};
			},
			meta: {
				MaxHPDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['Lifesteal', 'PercentMaxHP', 'NonChampCap', 'StructureMod'],
		}),
	},
	q: {
		...deathPassiveCommonAttrs,
	},
	w: {
		...deathPassiveCommonAttrs,
		variables: defineChampionVariables<'Sion', typeof ISion, 'w'>()({
			known: {
				f1: [],
				TotalDamageWithPercent: [],
			},
			calculate(self, target) {
				let TotalDamageWithPercent = Number.NaN;

				const wParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'w',
					abilityVariant: self.champion.value!.abilities.w.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('TotalDamage', wParams);
				const damagePercent = championAbilityVariableValue('MaxHPDamageRatio', wParams);
				if (typeof baseDamage.value === 'number' && typeof damagePercent.value === 'number') {
					TotalDamageWithPercent = baseDamage.value + damagePercent.value * 0.01 * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS sion] failed to calculate w damage vars', baseDamage, damagePercent);
				}

				return {
					f1: {
						value: self.internalData.value.wStacks,
					},
					TotalDamageWithPercent: {
						value: TotalDamageWithPercent,
					},
				};
			},
			meta: {
				f1: {
					displayedName: 'Stacks',
				},
				TotalShield: {
					type: VariableType.shield,
				},
				TotalDamage: {
					type: VariableType.magic,
					displayedName: 'BaseDamage',
				},
				TotalDamageWithPercent: {
					type: VariableType.magic,
					displayedName: 'TotalDamage',
					isCustom: true,
				},
			},
			uninteresting: ['HPPerKill', 'HPPerChampKill', 'DetonateRecastCooldown', 'MaxHPDamageRatio'],
		}),
	},
	e: {
		...deathPassiveCommonAttrs,
	},
	r: {
		...deathPassiveCommonAttrs,
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				championPassiveStats.hp = self.internalData.value.wStacks;

				const { q, w, e } = self.abilityVariantsIndexes.value;
				if (q & w & e) {
					const bonusMS = passiveBonusMS(self.internalData.value.passiveMSProgress, {} as DamageSource);
					calculatedVariables.sionPassiveBonusMS = bonusMS;
					calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.sionPassiveBonusMS / 100;

					const ls = championAbilityVariableValue('Lifesteal', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]! });
					if (typeof ls.value === 'number') {
						championPassiveStats.lifeSteal = ls.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS sion] failed to calculate passive lifesteal');
					}
				}
			},
		},
		onTotalPreMultipliers: {
			handler(self, { totalPreMultipliersStats, bonusStats }, { debuffs, calculatedVariables }) {
				const { q, w, e } = self.abilityVariantsIndexes.value;
				if (q & w & e) {
					/* doesn't seem to be in a variable */
					totalPreMultipliersStats.attackSpeed = 1.75;
					/* set a bonus so that it's styled as having some, the game shows it being changed */
					calculatedVariables.preCrippleBonusAS = 0.00001;
					bonusStats.bonusAttackSpeedPercent = 0.00001;
					/* 26.21 as tested to not change */
					debuffs.totalCrippledAttackSpeed = 0;
				}
			},
		},
		postHealMults: {
			handler(self, { totalStats, totalMultipliersStats, baseOnLevelStats, bonusStats }) {
				const { q, w, e } = self.abilityVariantsIndexes.value;
				if (q & w & e) {
					const originalBase = baseOnLevelStats.hpRegen;
					const originalBonus = bonusStats.hpRegen;
					totalStats.hpRegen = totalMultipliersStats.hpRegen;

					/** as of 26.21 the values in game seem to fill up with the new health regen up to their original values */
					let remainingNewRegen = totalStats.hpRegen;
					baseOnLevelStats.hpRegen = Math.min(originalBase, remainingNewRegen);
					remainingNewRegen -= baseOnLevelStats.hpRegen;
					bonusStats.hpRegen = Math.min(originalBonus, remainingNewRegen);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Sion'>;
