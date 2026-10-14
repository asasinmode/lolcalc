import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISinged from '@lolcalc/data/files/champion/Singed.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

const passiveMaxStacks = 9;

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks),
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
	w: {
		dataOverrides: {
			isImmobilizing: true,
		},
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
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
			},
		},
	},
} satisfies IChampionSpecific<'Singed'>;
