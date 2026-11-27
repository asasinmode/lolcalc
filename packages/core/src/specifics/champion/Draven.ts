import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IDraven from '@lolcalc/data/files/champion/Draven.json';
import type { IChampion } from '@lolcalc/data/types.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

function wCalculateMS(progress: number, champion: IChampion, abilityLevel: number): number {
	const bonusMS = championAbilityVariableValue('Temp_MSMod', {
		abilityKey: 'w',
		abilityVariant: champion.abilities.w.variants[0]!,
		abilityLevel,
	});

	if (typeof bonusMS.value === 'number') {
		return bonusMS.value * progress * 0.01;
	}

	console.warn('[CHAMPION_SPECIFICS draven] failed to calculate W bonus MS', bonusMS);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			wMSProgress: clamp(0, Math.round(self.internalData.value.wMSProgress ?? 0), 100),
			applyWAS: clamp(0, Math.round(self.internalData.value.applyWAS ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Draven', typeof IDraven, 'passive'>()({
			known: {
				DravenPassiveGoldEarned: [],
				DravenPassiveHighestBounty: [],
				Stacks: [],
			},
			calculate(self) {
				return {
					DravenPassiveGoldEarned: { value: 0 },
					DravenPassiveHighestBounty: { value: 0 },
					Stacks: {
						value: self.internalData.value.passiveStacks,
					},
				};
			},
			meta: {
				Stacks: {
					isCustom: true,
				},
			},
			uninteresting: ['StackGain', 'PassiveGoldBase', 'PassiveGoldPerStack', 'PercentOfStacksLost', 'DravenPassiveGoldEarned', 'DravenPassiveHighestBounty'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Draven', typeof IDraven, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['DurationTOOLTIP'],
		}),
	},
	w: {
		derivedMS: ((progress, self) => self?.stats.value.variables.dravenWBonusMS ?? wCalculateMS(progress, self.champion.value!, self.abilityLevels.value.w)) satisfies IDeriveProgressFn,
		variables: defineChampionVariables<'Draven', typeof IDraven, 'w'>()({
			known: {
				BonusMS: [],
			},
			calculate(self) {
				return {
					BonusMS: {
						value: self.stats.value.variables.dravenWBonusMS ?? 0,
					},
				};
			},
			meta: {
				BonusMS: {
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['Temp_MSDuration', 'Temp_ASDuration'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Draven', typeof IDraven, 'e'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				Slow: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Draven', typeof IDraven, 'r'>()({
			known: {
				f1: [],
				'{577427b5}': [],
			},
			calculate(self) {
				return {
					f1: { value: 0 },
					'{577427b5}': { value: self.internalData.value.passiveStacks },
				};
			},
			meta: {
				RCalculatedDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['f1', 'RDamageReductionPerHit', 'RMinDamagePercent', 'RPassiveStacksCoefficient'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				const bonusMS = wCalculateMS(self.internalData.value.wMSProgress, self.champion.value!, self.abilityLevels.value.w);
				if (!Number.isNaN(bonusMS)) {
					calculatedVariables.dravenWBonusMS = bonusMS;
					calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.dravenWBonusMS * 0.01;
				}

				if (self.internalData.value.applyWAS) {
					const bonusAS = championAbilityVariableValue('Temp_AS', { abilityKey: 'w', abilityVariant: self.champion.value?.abilities.w.variants[0]!, abilityLevel: self.abilityLevels.value.w });
					if (typeof bonusAS.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = bonusAS.value * 0.01;
					} else {
						console.warn('[CHAMPION_SPECIFICS draven] failed to calculate W bonus AS', bonusMS);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Draven'>;
