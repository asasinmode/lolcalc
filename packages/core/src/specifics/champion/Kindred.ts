import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IKindred from '@lolcalc/data/files/champion/Kindred.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
	variables: defineChampionVariables<'Kindred', typeof IKindred, 'passive'>()({
		known: {
			'{64290302}': [],
		},
		calculate(self) {
			return {
				'{64290302}': {
					value: self.internalData.value.passiveStacks,
				},
			};
		},
		meta: {
			'{64290302}': {
				displayedName: 'Marks',
			},
		},
	}),
	passive: {
		variables: defineChampionVariables<'Kindred', typeof IKindred, 'passive'>()({
			known: {
				f1: [],
				Marks: [],
				FirstTierRangeIncreaseTT: [75],
			},
			calculate(self) {
				let FirstTierRangeIncreaseTT = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				};
				const rangePerStack = championAbilityVariableValue('RangeIncrease', passiveParams);
				const firstTierMult = championAbilityVariableValue('FirstTierMultiplier', passiveParams);
				if (typeof rangePerStack.value === 'number' && typeof firstTierMult.value === 'number') {
					FirstTierRangeIncreaseTT = rangePerStack.value * firstTierMult.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS kindred] failed to calculate passive range vars', rangePerStack, firstTierMult);
				}

				return {
					f1: {
						value: self.stats.value.championPassive.attackRange ?? 0,
					},
					FirstTierRangeIncreaseTT: {
						value: FirstTierRangeIncreaseTT,
					},
					Marks: {
						value: self.internalData.value.passiveStacks,
					},
				};
			},
			meta: {
				f1: {
					displayedName: 'BonusRange',
				},
				Marks: {
					isCustom: true,
				},
			},
			uninteresting: ['InitialMarkThreshold', 'AdditionalMarkThreshold', 'RangeIncrease', 'FirstTierRangeIncreaseTT'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const { passiveStacks } = self.internalData.value;
				if (!passiveStacks) return;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				};

				const firstMarksThreshold = championAbilityVariableValue('InitialMarkThreshold', passiveParams);
				const subsequentThresholds = championAbilityVariableValue('AdditionalMarkThreshold', passiveParams);
				const rangePerStep = championAbilityVariableValue('RangeIncrease', passiveParams);
				const firstTierMult = championAbilityVariableValue('FirstTierMultiplier', passiveParams);
				if (typeof rangePerStep.value === 'number' && typeof firstTierMult.value === 'number' && typeof firstMarksThreshold.value === 'number' && typeof subsequentThresholds.value === 'number') {
					let stacksRemaining = passiveStacks - firstMarksThreshold.value;
					let totalRange = 0;
					while (stacksRemaining >= 0) {
						if (!totalRange) {
							totalRange += rangePerStep.value * firstTierMult.value;
						} else {
							totalRange += rangePerStep.value;
						}
						stacksRemaining -= subsequentThresholds.value;
					}
					championPassiveStats.attackRange = totalRange;
				} else {
					console.warn('[CHAMPION_SPECIFICS kindred] failed to calculate passive attack range vars', { firstMarksThreshold, subsequentThresholds, rangePerStack: rangePerStep, firstTierMult });
				}
			},
		},
	},
} satisfies IChampionSpecific<'Kindred'>;
