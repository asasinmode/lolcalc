import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IUrgot from '@lolcalc/data/files/champion/Urgot.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Urgot', typeof IUrgot, 'passive'>()({
			known: {
				TotalDamage: [],
			},
			calculate(self, target) {
				let TotalDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('ADDamage', passiveParams);
				const percentDamage = championAbilityVariableValue('PercentHPRatio', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof percentDamage.value === 'number') {
					TotalDamage = baseDamage.value + percentDamage.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS urgot] failed to calculate passive dmg', baseDamage, percentDamage);
				}

				return {
					TotalDamage: {
						value: TotalDamage,
					},
				};
			},
			meta: {
				ADDamage: {
					type: VariableType.physical,
				},
				TotalDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: [],
		}),
	},
} satisfies IChampionSpecific<'Urgot'>;
