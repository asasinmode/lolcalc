import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ILocke from '@lolcalc/data/files/champion/Locke.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Locke', typeof ILocke, 'passive'>()({
			known: {
				OnHitDamage: [],
			},
			calculate(self, target) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };
				const minDamage = championAbilityVariableValue('MinOnHitDamage', passiveParams);
				const maxDamage = championAbilityVariableValue('MaxOnHitDamage', passiveParams);
				let OnHitDamage = 0;

				if (typeof minDamage.value === 'number' && typeof maxDamage.value === 'number') {
					/** not saved in an actual variable? */
					const maxThreshold = 0.3;
					const targetPercentHealth = target ? (Math.min(target.currentHealth.value, target.stats.value.total.hp) / target.stats.value.total.hp || 1) : 0;
					const damagePercent = Math.max(0, Math.min(1, (1 - targetPercentHealth) / (1 - maxThreshold)));
					OnHitDamage = minDamage.value + (maxDamage.value - minDamage.value) * damagePercent;
				}

				return {
					OnHitDamage: {
						value: OnHitDamage,
					},
				};
			},
			meta: {
				MinOnHitDamage: {
					type: VariableType.magic,
				},
				MaxOnHitDamage: {
					type: VariableType.magic,
				},
				OnHitDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
			},
		}),
	},
	q: {
		variables: defineChampionVariables<'Locke', typeof ILocke, 'q'>()({
			meta: {
				MissileDamage: {
					type: VariableType.magic,
				},
				NailDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['SlowAmount1', 'SlowAmount2', 'SlowAmount3', 'SlowDuration1', 'SlowDuration2', 'SlowDuration3', 'TwoMarkBonusPercent', 'ThreeMarkBonusPercent'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Locke', typeof ILocke, 'w'>()({
			meta: {
				DamageRestoreAmount: {
					type: VariableType.heal,
				},
				AdditionalHeal: {
					type: VariableType.heal,
				},
				MaxHealingThreshold: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['DecayTimeHelper', 'BaseDuration', 'HealthCost'],
		}),
	},
} satisfies IChampionSpecific<'Locke'>;
