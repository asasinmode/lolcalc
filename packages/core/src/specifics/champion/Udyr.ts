import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IUdyr from '@lolcalc/data/files/champion/Udyr.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { cooldownReductionPercentageFromHaste, defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Udyr', typeof IUdyr, 'passive'>()({
			calculate(self) {
				const UltCD = championAbilityVariableValue('UltCD', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof UltCD.value === 'number') {
					UltCD.value *= 1 - cooldownReductionPercentageFromHaste(self.stats.value.total.ultimateHaste) / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS udyr] failed to calculate passive ult cd', UltCD);
				}

				return {
					UltCD,
				};
			},
			meta: {
				UltCD: {
					additionalInfo: "The in game tooltip doesn't reflect it but the value scales with ultimate haste.",
				},
			},
			uninteresting: ['AttackSpeedDuration', 'UltCDReduction'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.hasPassiveStack) {
					const as = championAbilityVariableValue('AttackSpeed', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					});
					if (typeof as.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = as.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS udyr] failed to calculate passive as', as);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Udyr'>;
