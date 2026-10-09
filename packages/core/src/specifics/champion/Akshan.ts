import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IAkshan from '@lolcalc/data/files/champion/Akshan.json';
import type { IChampion } from '@lolcalc/data/types.js';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

function calculatePassiveMS(champion: IChampion, progress: number, level: number, bonusAttackSpeedPercent: number): number {
	const ms = championAbilityVariableValue('ASModdedMS', {
		abilityKey: 'passive',
		abilityVariant: champion.abilities.passive.variants[0]!,
		damageSource: {
			level: { value: level },
			stats: { value: { bonus: { bonusAttackSpeedPercent } } },
		} as DamageSource,
	});
	if (typeof ms.value === 'number') {
		return (ms.value * progress) / 100;
	}
	console.warn('[CHAMPION_SPECIFICS akshan] failed to calculate passive ms', ms);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 0), 100),
		};
	},
	passive: {
		variables: defineChampionVariables<'Akshan', typeof IAkshan, 'passive'>()({
			meta: {
				SecondAutoDamage: {
					type: VariableType.physical,
				},
				PassiveProcDamage: {
					type: VariableType.magic,
				},
				TotalShieldAmount: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['HasteDuration', 'ShieldDuration', 'SecondAutoCritRatio'],
		}),
		derivedMS: ((progress, self): number => {
			return self?.stats.value.championPassive.moveSpeed ?? calculatePassiveMS(self.champion.value!, progress, self.level.value, self.stats.value.bonus.bonusAttackSpeedPercent);
		}) satisfies IDeriveProgressFn,
		calculateSlow: calculatePassiveMS,
	},
	w: {
		variables: defineChampionVariables<'Akshan', typeof IAkshan, 'w'>()({
			known: {
				/* it's present in the ability variables but needs to be here to be used in extracting a stringtable variable */
				GameModeInteger: [1],
				f2: [],
			},
			calculate() {
				return {
					GameModeInteger: { value: 1 },
					f2: { value: 0 },
				};
			},
		}),
	},
	calculateHooks: {
		postBonus: {
			handler(self, { championPassiveStats, bonusStats, totalPreMultipliersStats }) {
				if (self.internalData.value.passiveMSProgress) {
					championPassiveStats.moveSpeed = calculatePassiveMS(self.champion.value!, self.internalData.value.passiveMSProgress, self.level.value, bonusStats.bonusAttackSpeedPercent);
					bonusStats.moveSpeed += championPassiveStats.moveSpeed;
					totalPreMultipliersStats.moveSpeed += championPassiveStats.moveSpeed;
				}
			},
		},
	},
} satisfies IChampionSpecific<'Akshan'>;
