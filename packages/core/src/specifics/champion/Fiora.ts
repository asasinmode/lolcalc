import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IFiora from '@lolcalc/data/files/champion/Fiora.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const passiveBonusMS: IDeriveProgressFn = (progress, self) => {
	const bonusMS = championAbilityVariableValue('PercentMS', {
		abilityKey: 'r',
		abilityVariant: self.champion.value!.abilities.r.variants[0]!,
		damageSource: self,
	});

	if (typeof bonusMS.value === 'number') {
		return bonusMS.value * progress;
	}

	console.warn('[CHAMPION_SPECIFICS fiora] failed to calculate passive bonus MS', bonusMS);
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
		variables: defineChampionVariables<'Fiora', typeof IFiora, 'passive'>()({
			known: {
				VitalDamage: [],
				BonusMS: [],
			},
			calculate(self, target) {
				const vitalDamagePercent = championAbilityVariableValue('PassiveDamageTotal', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});

				return {
					VitalDamage: {
						value: (vitalDamagePercent.value as number) * (target?.stats.value.total.hp ?? 0),
					},
					BonusMS: {
						value: self.stats.value.variables.fioraPassiveBonusMS,
					},
				};
			},
			meta: {
				VitalDamage: {
					isCustom: true,
					type: VariableType.true,
				},
				PercentMS: {
					displayedName: 'MaxBonusMS',
				},
				PassiveHealAmount: {
					type: VariableType.heal,
				},
				BonusMS: {
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['MovementSpeedDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				const bonusMS = passiveBonusMS(self.internalData.value.passiveMSProgress, {
					champion: self.champion,
					abilityLevels: self.abilityLevels,
				} as DamageSource);
				if (!Number.isNaN(bonusMS)) {
					calculatedVariables.fioraPassiveBonusMS = bonusMS;
					calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.fioraPassiveBonusMS / 100;
				}
			},
		},
	},
} satisfies IChampionSpecific<'Fiora'>;
