import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IRenata from '@lolcalc/data/files/champion/Renata.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Renata', typeof IRenata, 'passive'>()({
			known: {
				MarkDamage: [],
			},
			calculate(self, target) {
				let MarkDamage = Number.NaN;

				/* on patch 26.20 self & ally damage is the same value. Update if it changes */
				const percent = championAbilityVariableValue('PercentAmpCalc', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof percent.value === 'number') {
					MarkDamage = percent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS renata] failed to calculate passive mark percent damage', percent);
				}

				return {
					MarkDamage: {
						value: MarkDamage,
					},
				};
			},
			meta: {
				MarkDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['PassiveDuration'],
		}),
	},
} satisfies IChampionSpecific<'Renata'>;
