import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ISamira from '@lolcalc/data/files/champion/Samira.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

const passiveStyleOptions = {
	none: 0,
	e: 1,
	d: 2,
	c: 3,
	b: 4,
	a: 5,
	s: 6,
};

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveStyleOptions.s),
		};
	},
	passive: {
		styleOptions: passiveStyleOptions,
		variables: defineChampionVariables<'Samira', typeof ISamira, 'passive'>()({
			known: {
				TotalMS: [],
				EmpoweredMeleeDamage: [],
			},
			calculate(self, target) {
				let EmpoweredMeleeDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('BonusMeleeDamage', passiveParams);
				const maxDamage = championAbilityVariableValue('EmpoweredMeleeDamageTooltip', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof maxDamage.value === 'number') {
					const targetMissingHPPercent = target ? Math.max(0, (target.stats.value.total.hp - Math.min(target.stats.value.total.hp, target.currentHealth.value)) / target.stats.value.total.hp) : 0;
					EmpoweredMeleeDamage = baseDamage.value + (maxDamage.value - baseDamage.value) * targetMissingHPPercent;
				} else {
					console.warn('[CHAMPION_SPECIFICS samira] failed to calculate passive damage vars', baseDamage, maxDamage);
				}

				return {
					TotalMS: {
						value: self.stats.value.variables.samiraPassiveBonusMS ?? 0,
					},
					EmpoweredMeleeDamage: {
						value: EmpoweredMeleeDamage,
					},
				};
			},
			meta: {
				BonusMeleeDamage: {
					type: VariableType.magic,
				},
				EmpoweredMeleeDamageTooltip: {
					type: VariableType.magic,
				},
				TotalMS: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				EmpoweredMeleeDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['DurationTOOLTIP'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.passiveStacks) {
					const ms = championAbilityVariableValue('MSBonusNew', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
					if (typeof ms.value === 'number') {
						calculatedVariables.samiraPassiveBonusMS = ms.value * self.internalData.value.passiveStacks;
						calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.samiraPassiveBonusMS;
					} else {
						console.warn('[CHAMPION_SPECIFICS samira] failed to calculate passive ms', ms);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Samira'>;
