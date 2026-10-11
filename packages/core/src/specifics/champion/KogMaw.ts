import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IKogMaw from '@lolcalc/data/files/champion/KogMaw.json';
import type { IChampion } from '@lolcalc/data/types.js';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

/** doesn't seem to be in a variable */
const passiveMinMS = 0.1;

function calculatePassiveMS(champion: IChampion, progress: number): number {
	const ms = championAbilityVariableValue('TooltipPassiveMS', {
		abilityKey: 'passive',
		abilityVariant: champion.abilities.passive.variants[0]!,
	});
	if (typeof ms.value === 'number') {
		return progress === 1 ? passiveMinMS : passiveMinMS + (ms.value - passiveMinMS) * ((progress - 1) / 99);
	}
	console.warn('[CHAMPION_SPECIFICS kogmaw] failed to calculate passive ms', ms);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 0), 1),
		};
	},
	passive: {
		derivedMS: ((progress, self): number => {
			return (self?.stats.value.variables.kogMawPassiveMS ?? calculatePassiveMS(self.champion.value!, progress)) * 100;
		}) satisfies IDeriveProgressFn<false, 'KogMaw'>,
		calculateSlow: calculatePassiveMS,
		variables: defineChampionVariables<'KogMaw', typeof IKogMaw, 'passive'>()({
			known: {
				BonusMS: [],
			},
			calculate(self) {
				return {
					BonusMS: {
						value: self.stats.value.variables.kogMawPassiveMS ?? 0,
					},
				};
			},
			meta: {
				PassiveDamage: {
					type: VariableType.true,
				},
				BonusMS: {
					resultsMultiplier: 100,
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['TooltipPassiveDuration', 'TooltipPassiveMS'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.passiveMSProgress) {
					calculatedVariables.kogMawPassiveMS = calculatePassiveMS(self.champion.value!, self.internalData.value.passiveMSProgress);
					calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.kogMawPassiveMS;
				}
			},
		},
	},
} satisfies IChampionSpecific<'KogMaw'>;
