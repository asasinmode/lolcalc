import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IJarvanIV from '@lolcalc/data/files/champion/JarvanIV.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'JarvanIV', typeof IJarvanIV, 'passive'>()({
			known: {
				Damage: [],
			},
			calculate(self, target) {
				let Damage = Number.NaN;

				const percent = championAbilityVariableValue('TooltipCurrentHealthDamage', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self });
				if (typeof percent.value === 'number') {
					Damage = percent.value * (target ? Math.min(target.stats.value.total.hp, target?.currentHealth.value) : 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS jarvan] failed to calculate passive damage percent', percent);
				}
				return {
					Damage: {
						value: Damage,
					},
				};
			},
			meta: {
				Damage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['TooltipCurrentHealthDamage'],
		}),
	},
	r: {
		dataOverrides: {
			isImmobilizing: true,
		},
	},
} satisfies IChampionSpecific<'JarvanIV'>;
