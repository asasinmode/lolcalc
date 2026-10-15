import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ISylas from '@lolcalc/data/files/champion/Sylas.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Sylas', typeof ISylas, 'passive'>()({
			known: {
				MonsterDamage: [],
				MonsterAOEDamage: [],
			},
			calculate(self, target) {
				let MonsterDamage = Number.NaN;
				let MonsterAOEDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const passiveDamage = championAbilityVariableValue('PassiveDamage', passiveParams);
				const aoeDamage = championAbilityVariableValue('PassiveAoEDamage', passiveParams);
				const monsterMult = championAbilityVariableValue('MonsterDamageMulti', passiveParams);
				if (typeof passiveDamage.value === 'number' && typeof aoeDamage.value === 'number' && typeof monsterMult.value === 'number') {
					MonsterDamage = passiveDamage.value * monsterMult.value;
					MonsterAOEDamage = aoeDamage.value * monsterMult.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS sylas] failed to calculate passive monster damage, vars', { passiveDamage, aoeDamage, monsterMult });
				}

				return {
					MonsterDamage: {
						value: MonsterDamage,
					},
					MonsterAOEDamage: {
						value: MonsterAOEDamage,
					},
				};
			},
			meta: {
				PassiveDamage: {
					type: VariableType.magic,
				},
				PassiveAoEDamage: {
					type: VariableType.magic,
				},
				MonsterDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				MonsterAOEDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['PassiveCharges', 'MonsterDamageMulti', 'PassiveAttackSpeed'],
		}),
	},
	e: {
		dataOverrides: {
			isImmobilizing: true,
		},
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.hasPassiveStack) {
					const as = championAbilityVariableValue('PassiveAttackSpeed', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					});
					if (typeof as.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = as.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS sylas] failed to calculate passive as', as);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Sylas'>;
