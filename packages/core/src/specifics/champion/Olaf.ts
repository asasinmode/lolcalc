import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IOlaf from '@lolcalc/data/files/champion/Olaf.json';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Olaf', typeof IOlaf, 'passive'>()({
			known: {
				Lifesteal: [],
				AttackSpeed: [],
			},
			calculate(self) {
				return {
					Lifesteal: {
						value: self.stats.value.championPassive.lifeSteal ?? 0,
					},
					AttackSpeed: {
						value: self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0,
					},
				};
			},
			meta: {
				Lifesteal: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				AttackSpeed: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, baseOnLevelStats, championPassiveStats, totalPreMultipliersStats, bonusStats }, { debuffs }) {
				const currentHealthP = Math.min(1, self.currentHealth.value / Math.max(totalStats.hp, 1));
				/** max strength at 30% hp, doesn't seem to be in a variable */
				const passiveStrengthMult = Math.min(1, (1 - currentHealthP) / 0.7);

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					abilityKey: 'passive',
					damageSource: { level: { value: self.level.value } } as DamageSource,
				};
				const lifesteal = championAbilityVariableValue('MaxLifeSteal', passiveParams);
				if (typeof lifesteal.value === 'number') {
					championPassiveStats.lifeSteal = lifesteal.value * passiveStrengthMult;
					bonusStats.lifeSteal += championPassiveStats.lifeSteal;
					totalStats.lifeSteal += championPassiveStats.lifeSteal;
					totalPreMultipliersStats.lifeSteal += championPassiveStats.lifeSteal;
				} else {
					console.warn('[CHAMPION_SPECIFICS olaf] failed to calculate passive lifesteal', lifesteal);
				}

				const as = championAbilityVariableValue('MaxAttackSpeed', passiveParams);
				if (typeof as.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent = as.value * passiveStrengthMult;
					championPassiveStats.attackSpeed = championPassiveStats.bonusAttackSpeedPercent * baseOnLevelStats.attackSpeedRatio;
					bonusStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;
					bonusStats.attackSpeed += championPassiveStats.attackSpeed;
					totalPreMultipliersStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;

					const crippleValue = championPassiveStats.attackSpeed * debuffs.cripple;
					const crippledAS = championPassiveStats.attackSpeed - crippleValue;
					debuffs.totalCrippledAttackSpeed += crippleValue;
					totalPreMultipliersStats.attackSpeed += crippledAS;

					totalStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;
					totalStats.attackSpeed += crippledAS;
				} else {
					console.warn('[CHAMPION_SPECIFICS olaf] failed to calculate passive as', as);
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Olaf,
		},
	},
} satisfies IChampionSpecific<'Olaf'>;
