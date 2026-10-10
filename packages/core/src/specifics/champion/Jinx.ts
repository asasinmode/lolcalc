import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IJinx from '@lolcalc/data/files/champion/Jinx.json';
import type { IChampion } from '@lolcalc/data/types.js';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

/* doesn't seem to be in passive's data */
const passiveMaxStacks = 5;

function calculatePassiveMS(champion: IChampion, progress: number, passiveStacks: number): number {
	const ms = championAbilityVariableValue('MSBuff', {
		abilityKey: 'passive',
		abilityVariant: champion.abilities.passive.variants[0]!,
	});
	if (typeof ms.value === 'number') {
		return ms.value * progress * passiveStacks * 0.0001;
	}
	console.warn('[CHAMPION_SPECIFICS jinx] failed to calculate passive ms', ms);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks),
			passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 100), 100),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		derivedMS: ((progress, self): number => {
			return (self?.stats.value.variables.jinxPassiveMoveSpeed ?? calculatePassiveMS(self.champion.value!, progress, self.internalData.value.passiveStacks)) * 100;
		}) satisfies IDeriveProgressFn<false, 'Jinx'>,
		calculateSlow: calculatePassiveMS,
		variables: defineChampionVariables<'Jinx', typeof IJinx, 'passive'>()({
			known: {
				BonusMSPercent: [],
				BonusAS: [],
			},
			calculate(self) {
				return {
					BonusMSPercent: {
						value: self.stats.value.variables.jinxPassiveMoveSpeed ?? 0,
					},
					BonusAS: {
						value: self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0,
					},
				};
			},
			meta: {
				BonusMSPercent: {
					isCustom: true,
					resultsMultiplier: 100,
					resultsIsPercentage: true,
				},
				BonusAS: {
					isCustom: true,
					resultsMultiplier: 100,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['BuffDuration', 'ASBuff', 'MSBuff', 'AssistMarkerDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				const { passiveStacks, passiveMSProgress } = self.internalData.value;
				if (!passiveStacks) return;

				calculatedVariables.attackSpeedCap = 90;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				};

				calculatedVariables.jinxPassiveMoveSpeed = calculatePassiveMS(self.champion.value!, passiveMSProgress, passiveStacks);
				calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.jinxPassiveMoveSpeed;

				const as = championAbilityVariableValue('ASBuff', passiveParams);
				if (typeof as.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent = (as.value * passiveStacks) / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS jinx] failed to calculate passive as', as);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Jinx'>;
