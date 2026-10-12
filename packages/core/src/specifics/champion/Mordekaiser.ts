import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IMordekaiser from '@lolcalc/data/files/champion/Mordekaiser.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Mordekaiser', typeof IMordekaiser, 'passive'>()({
			known: {
				AuraTotalDamage: [],
			},
			calculate(self, target) {
				let AuraTotalDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const auraPercent = championAbilityVariableValue('PercentHealthForAura', passiveParams);
				const baseDamage = championAbilityVariableValue('AuraDamagePerStack', passiveParams);
				if (typeof auraPercent.value === 'number' && typeof baseDamage.value === 'number') {
					AuraTotalDamage = baseDamage.value + auraPercent.value * 0.01 * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS mordekaiser] failed to calculate passive dmg', auraPercent, baseDamage);
				}

				return {
					AuraTotalDamage: {
						value: AuraTotalDamage,
					},
				};
			},
			meta: {
				BonusAPAuto: {
					type: VariableType.magic,
				},
				AuraDamagePerStack: {
					type: VariableType.magic,
				},
				AuraTotalDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['CombatTrackingDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const ms = championAbilityVariableValue('PassiveMovementSpeed', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
					if (typeof ms.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += ms.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS mordekaiser] failed to calculate passive ms', ms);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Mordekaiser'>;
