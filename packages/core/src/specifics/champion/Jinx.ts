import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IJinx from '@lolcalc/data/files/champion/Jinx.json';
import { formatImagePath } from '@lolcalc/data/meta.ts';
import type { IChampion } from '@lolcalc/data/types.js';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn, IAbilityImgIndexGetter } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

/* doesn't seem to be in passive's data */
const passiveMaxStacks = 5;
const qBuffOptions = {
	minigun0: 0,
	minigun1: 1,
	minigun2: 2,
	minigun3: 3,
	fishbones: 4,
};

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
			qBuff: clamp(0, Math.round(self.internalData.value.qBuff ?? 0), 4),
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
	q: {
		buffOptions: qBuffOptions,
		modifyVariantData(abillityVariant, _binData, variantData) {
			if (variantData.mSpell?.mImgIconName) {
				abillityVariant.image = variantData.mSpell.mImgIconName.map(formatImagePath);
			}
		},
		abilityImgVariantIndex: [(self) => self.internalData.value.qBuff, (qBuff) => (qBuff === qBuffOptions.fishbones ? 0 : 1)] as IAbilityImgIndexGetter<number, 'Jinx'>,
		variables: defineChampionVariables<'Jinx', typeof IJinx, 'q'>()({
			known: {
				MinigunAS: [],
			},
			calculate(self) {
				return {
					MinigunAS: {
						value: self.stats.value.variables.jinxQAS ?? 0,
					},
				};
			},
			meta: {
				MinigunAS: {
					isCustom: true,
					resultsMultiplier: 100,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['RocketASPDPenalty', 'MinigunAttackSpeedDuration', 'MinigunAttackSpeedStacks'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				const { passiveStacks, passiveMSProgress, qBuff } = self.internalData.value;
				if (passiveStacks) {
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
						championPassiveStats.bonusAttackSpeedPercent = as.value * passiveStacks * 0.01;
					} else {
						console.warn('[CHAMPION_SPECIFICS jinx] failed to calculate passive as', as);
					}
				}

				const qParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					abilityLevel: self.abilityLevels.value.q,
				};

				if (qBuff === qBuffOptions.fishbones) {
					const range = championAbilityVariableValue('RocketBonusRange', qParams);
					if (typeof range.value === 'number') {
						championPassiveStats.attackRange = range.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS jinx] failed to calculate q range', range);
					}
				} else if (qBuff) {
					const maxAS = championAbilityVariableValue('MinigunAttackSpeedMax', qParams);
					if (typeof maxAS.value === 'number') {
						const firstStackAS = maxAS.value / 2;
						championPassiveStats.bonusAttackSpeedPercent = (championPassiveStats.bonusAttackSpeedPercent ?? 0) + (firstStackAS + firstStackAS * 0.5 * (qBuff - 1)) * 0.01;
					} else {
						console.warn('[CHAMPION_SPECIFICS jinx] failed to calculate q as', maxAS);
					}
				}
			},
		},
		postBonus: {
			handler(self, { totalPreMultipliersStats, bonusStats, baseOnLevelStats }) {
				if (self.internalData.value.qBuff === qBuffOptions.fishbones) {
					const asPenalty = championAbilityVariableValue('RocketASPDPenalty', {
						abilityKey: 'q',
						abilityVariant: self.champion.value!.abilities.q.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						abilityLevel: self.abilityLevels.value.q,
					});
					if (typeof asPenalty.value === 'number') {
						const penaltyPercent = bonusStats.bonusAttackSpeedPercent * asPenalty.value;
						const penalty = baseOnLevelStats.attackSpeedRatio * penaltyPercent;
						totalPreMultipliersStats.bonusAttackSpeedPercent -= penaltyPercent;
						totalPreMultipliersStats.attackSpeed -= penalty;
						bonusStats.bonusAttackSpeedPercent -= penaltyPercent;
						bonusStats.attackSpeed -= penalty;
					} else {
						console.warn('[CHAMPION_SPECIFICS jinx] failed to calculate q as penalty', asPenalty);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Jinx'>;
