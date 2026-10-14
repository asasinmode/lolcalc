import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IMalphite from '@lolcalc/data/files/champion/Malphite.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Malphite', typeof IMalphite, 'passive'>()({
			meta: {
				TotalShield: {
					type: VariableType.shield,
				},
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Malphite', typeof IMalphite, 'w'>()({
			known: {
				f1: [],
				f2: [],
			},
			calculate(self) {
				return {
					f1: {
						value: self.stats.value.variables.malphiteWBaseArmor ?? 0,
					},
					f2: {
						value: self.stats.value.variables.malphiteWWithPassiveArmor ?? 0,
					},
				};
			},
			meta: {
				TotalBonusDamage: {
					type: VariableType.physical,
				},
				ThunderclapSplash: {
					type: VariableType.physical,
				},
				f1: {
					displayedName: 'BonusArmor',
				},
				f2: {
					displayedName: 'BonusArmorPassive',
				},
			},
			uninteresting: ['ThunderclapBuffDuration', 'BonusArmorPassive', 'MonsterDamageMod'],
		}),
	},
	calculateHooks: {
		preShred: {
			handler(self, { totalStats, championPassiveStats, totalPreMultipliersStats, bonusStats }, { calculatedVariables }) {
				if (!self.abilityLevels.value.w) {
					return;
				}

				const wParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'w', abilityVariant: self.champion.value!.abilities.w.variants[0]!, abilityLevel: self.abilityLevels.value.w };

				const baseArmorPercent = championAbilityVariableValue('BonusArmorPassive', wParams);
				if (typeof baseArmorPercent.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS malphite] failed to calculate w base armor', baseArmorPercent);
					return;
				}
				calculatedVariables.malphiteWBaseArmor = totalStats.armor * baseArmorPercent.value;

				const withPassiveMult = championAbilityVariableValue('BonusArmorPassiveMultiplier', wParams);
				if (typeof withPassiveMult.value === 'number') {
					calculatedVariables.malphiteWWithPassiveArmor = calculatedVariables.malphiteWBaseArmor * withPassiveMult.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS malphite] failed to calculate w passive armor mult', withPassiveMult);
				}

				const wBonusArmor = self.internalData.value.isPassiveActive ? calculatedVariables.malphiteWWithPassiveArmor : calculatedVariables.malphiteWBaseArmor;
				if (wBonusArmor !== undefined) {
					championPassiveStats.armor = wBonusArmor;
					totalPreMultipliersStats.armor += wBonusArmor;
					bonusStats.armor += wBonusArmor;
					totalStats.armor += wBonusArmor;
				}
			},
		},
	},
} satisfies IChampionSpecific<'Malphite'>;
