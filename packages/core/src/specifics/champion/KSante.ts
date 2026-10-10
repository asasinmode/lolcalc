import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IKSante from '@lolcalc/data/files/champion/KSante.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'KSante', typeof IKSante, 'passive'>()({
			known: {
				MarkDamage: [],
				AllOutDamage: [],
			},
			calculate(self, target) {
				let MarkDamage = Number.NaN;
				let AllOutDamage = Number.NaN;

				const targetTotalHp = target?.stats.value.total.hp ?? 0;
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: self,
				};

				const markFlatVar = championAbilityVariableValue('FlatDamage', passiveParams);
				const markDamagePercentVar = championAbilityVariableValue('PercentHealthDamage', passiveParams);
				if (typeof markFlatVar.value === 'number' && typeof markDamagePercentVar.value === 'number') {
					MarkDamage = markFlatVar.value + targetTotalHp * markDamagePercentVar.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS ksante] failed to calculate passive mark dmg vars', markFlatVar, markDamagePercentVar);
				}

				const allOutDamagePercentVar = championAbilityVariableValue('MaxHealthDamagePercent', passiveParams);
				if (typeof allOutDamagePercentVar.value === 'number') {
					AllOutDamage = targetTotalHp * allOutDamagePercentVar.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS ksante] failed to calculate passive all out var', allOutDamagePercentVar);
				}

				return {
					MarkDamage: {
						value: MarkDamage,
					},
					AllOutDamage: {
						value: AllOutDamage,
					},
				};
			},
			meta: {
				MarkDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
				AllOutDamage: {
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
