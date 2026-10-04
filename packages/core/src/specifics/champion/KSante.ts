import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IKSante from '@lolcalc/data/files/champion/KSante.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'KSante', typeof IKSante, 'passive'>()({
			known: {
				CalculatedMarkDamage: [],
				CalculatedAllOutDamage: [],
			},
			calculate(self, target) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: self,
				};
				const markFlatVar = championAbilityVariableValue('FlatDamage', passiveParams);
				const markDamagePercentVar = championAbilityVariableValue('PercentHealthDamage', passiveParams);
				const allOutDamagePercentVar = championAbilityVariableValue('MaxHealthDamagePercent', passiveParams);

				const targetTotalHp = (target?.stats.value.total.hp ?? 0);

				return {
					CalculatedMarkDamage: {
						value: (markFlatVar.value as number) + targetTotalHp * (markDamagePercentVar.value as number),
					},
					CalculatedAllOutDamage: {
						value: targetTotalHp * (allOutDamagePercentVar.value as number),
					},
				};
			},
			meta: {
				CalculatedMarkDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
				CalculatedAllOutDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['FlatDamage'],
		}),
	},
	q: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
} satisfies IChampionSpecific<'KSante'>;
