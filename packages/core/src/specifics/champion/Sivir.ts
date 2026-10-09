import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISivir from '@lolcalc/data/files/champion/Sivir.json';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const passiveBonusMS: IDeriveProgressFn = (progress, self) => {
	const bonusMS = championAbilityVariableValue('FlatMS', {
		abilityKey: 'passive',
		abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
		damageSource: self,
	});

	if (typeof bonusMS.value === 'number') {
		return (bonusMS.value * progress) / 100;
	}

	console.warn('[CHAMPION_SPECIFICS sivir] failed to calculate passive bonus MS', bonusMS);
	return Number.NaN;
};

export default {
	setupData(self) {
		return {
			passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 0), 100),
		};
	},
	passive: {
		bonusMS: passiveBonusMS,
		variables: defineChampionVariables<'Sivir', typeof ISivir, 'passive'>()({
			known: {
				BonusMS: [],
			},
			calculate(self) {
				return {
					BonusMS: {
						value: self.stats.value.championPassive.moveSpeed,
					},
				};
			},
			meta: {
				FlatMS: {
					displayedName: 'MaxBonusMS',
				},
				BonusMS: {
					isCustom: true,
				},
			},
			uninteresting: ['HasteDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const bonusMS = passiveBonusMS(self.internalData.value.passiveMSProgress, {
					champion: self.champion,
					level: self.level,
				} as DamageSource);
				if (!Number.isNaN(bonusMS)) {
					championPassiveStats.moveSpeed = bonusMS;
				}
			},
		},
	},
} satisfies IChampionSpecific<'Sivir'>;
