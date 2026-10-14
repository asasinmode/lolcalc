import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IRumble from '@lolcalc/data/files/champion/Rumble.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isOverheated: clamp(0, Math.round(self.internalData.value.isOverheated ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Rumble', typeof IRumble, 'passive'>()({
			known: {
				OverheatedAADamage: [],
			},
			calculate(self, target) {
				let OverheatedAADamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const flatDamage = championAbilityVariableValue('TotalBaseDamage', passiveParams);
				const percentDamage = championAbilityVariableValue('OverheatPercBonusDamage', passiveParams);
				if (typeof flatDamage.value === 'number' && typeof percentDamage.value === 'number') {
					OverheatedAADamage = flatDamage.value + percentDamage.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS rumble] failed to calculate passive proc percent dmg', flatDamage);
				}

				return {
					OverheatedAADamage: {
						value: OverheatedAADamage,
					},
				};
			},
			meta: {
				TotalBaseDamage: {
					type: VariableType.magic,
				},
				OverheatedAADamage: {
					type: VariableType.magic,
					isCustom: true,
				},
			},
			uninteresting: ['DangerZoneHeat', 'OverheatingHeat', 'OverheatDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.isOverheated) {
					const as = championAbilityVariableValue('OverheatAS', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
					if (typeof as.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = as.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS rumble] failed to calculate passive as', as);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Rumble'>;
