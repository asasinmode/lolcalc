import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IAmbessa from '@lolcalc/data/files/champion/Ambessa.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Ambessa', typeof IAmbessa, 'passive'>()({
			meta: {
				Calc_OnHit_Damage_Flat: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['Calc_Attack_Speed', 'Attack_Buff_Duration', 'Attack_Buff_Max_Stacks', 'Calc_OnHit_Energy_Refund', 'Attack_Range_Amount'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.hasPassiveStack) {
					const attackRange = championAbilityVariableValue('Attack_Range_Amount', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: {} as DamageSource });
					if (typeof attackRange.value === 'number') {
						championPassiveStats.attackRange = attackRange.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS ambessa] failed to calculate passive attack speed', attackRange);
					}
				}
			},
		},
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.hasPassiveStack) {
					const attackSpeed = championAbilityVariableValue('Calc_Attack_Speed', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: {} as DamageSource });
					if (typeof attackSpeed.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = attackSpeed.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS ambessa] failed to calculate passive attack speed', attackSpeed);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Ambessa'>;
