import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IZac from '@lolcalc/data/files/champion/Zac.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Zac', typeof IZac, 'passive'>()({
			known: {
				GooHeal: [],
			},
			calculate(self) {
				let GooHeal = Number.NaN;

				const percent = championAbilityVariableValue('HealPercent', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof percent.value === 'number') {
					GooHeal = percent.value * self.stats.value.total.hp;
				} else {
					console.warn('[CHAMPION_SPECIFICS zac] failed to calculate passive blob heal', percent);
				}

				return {
					GooHeal: {
						value: GooHeal,
					},
				};
			},
			meta: {
				GooHeal: {
					isCustom: true,
					type: VariableType.heal,
				},
			},
			uninteresting: ['ReviveCooldown'],
		}),
	},
} satisfies IChampionSpecific<'Zac'>;
