import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IWarwick from '@lolcalc/data/files/champion/Warwick.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Warwick', typeof IWarwick, 'passive'>()({
			known: {
				Healing: [],
				EmpoweredHealing: [],
			},
			calculate(self) {
				let Healing = Number.NaN;
				let EmpoweredHealing = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('OnHitDamage', passiveParams);
				const healRatio = championAbilityVariableValue('HealingRatio', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof healRatio.value === 'number') {
					Healing = baseDamage.value * healRatio.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS warwick] failed to calculate passive damage & healing ratio', baseDamage, healRatio);
				}

				const empoweredHealRatio = championAbilityVariableValue('EmpoweredHealingRatio', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof empoweredHealRatio.value === 'number') {
					EmpoweredHealing = baseDamage.value * empoweredHealRatio.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS warwick] failed to calculate passive empowered healing ratio', empoweredHealRatio);
				}

				return {
					Healing: {
						value: Healing,
					},
					EmpoweredHealing: {
						value: EmpoweredHealing,
					},
				};
			},
			meta: {
				OnHitDamage: {
					type: VariableType.magic,
				},
				Healing: {
					type: VariableType.heal,
					isCustom: true,
				},
				EmpoweredHealing: {
					type: VariableType.heal,
					isCustom: true,
				},
			},
			uninteresting: ['HealingThreshold', 'HealingRatio', 'EmpoweredHealingThreshold', 'EmpoweredHealingRatio'],
		}),
	},
} satisfies IChampionSpecific<'Warwick'>;
