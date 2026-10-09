import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IAurora from '@lolcalc/data/files/champion/Aurora.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Aurora', typeof IAurora, 'passive'>()({
			known: {
				CalculatedProcDamage: [],
			},
			calculate(self, target) {
				let CalculatedProcDamage = Number.NaN;

				const procDamage = championAbilityVariableValue('ProcDamage', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof procDamage.value === 'number') {
					CalculatedProcDamage = procDamage.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS aurora] failed to calculate pasive proc percent dmg', procDamage);
				}

				return {
					CalculatedProcDamage: {
						value: CalculatedProcDamage,
					},
				};
			},
			meta: {
				CalculatedProcDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				HealCalc: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['SpiritModeDuration'],
		}),
	},
} satisfies IChampionSpecific<'Aurora'>;
