import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISion from '@lolcalc/data/files/champion/Sion.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionAbilitySpecific, IChampionSpecific } from '../champion.ts';
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

export default {
	setupData(self) {
		return {
			wStacks: Math.max(0, Math.round(self.internalData.value.wStacks ?? 0)),
		};
	},
	passive: {
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
			handler(self, { championPassiveStats }) {
				championPassiveStats.hp = self.internalData.value.wStacks;

				const { q, w, e } = self.abilityVariantsIndexes.value;
				if (q & w & e) {
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]! };

					const ls = championAbilityVariableValue('Lifesteal', passiveParams);
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
	},
} satisfies IChampionSpecific<'Sion'>;
