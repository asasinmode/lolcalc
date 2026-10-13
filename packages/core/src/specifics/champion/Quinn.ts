import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IQuinn from '@lolcalc/data/files/champion/Quinn.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Quinn', typeof IQuinn, 'passive'>()({
			known: {
				f1: [],
			},
			calculate(self) {
				let Cooldown = Number.NaN;

				const baseCD = championAbilityVariableValue('HarrierCooldown', { abilityKey: 'r', abilityVariant: self.champion.value!.abilities.r.variants[0]!, damageSource: self });
				if (typeof baseCD.value === 'number') {
					Cooldown = baseCD.value * 0.99 ** (self.stats.value.total.critChance * 100);
				} else {
					console.warn('[CHAMPION_SPECIFICS quinn] failed to calculate passive base cd', baseCD);
				}

				return {
					f1: {
						value: Cooldown,
					},
				};
			},
			meta: {
				BonusDamage: {
					type: VariableType.physical,
				},
				BonusMonsterDmg: {
					type: VariableType.physical,
				},
				f1: {
					displayedName: 'Cooldown',
				},
			},
			uninteresting: ['RevealDuration'],
		}),
	},
} satisfies IChampionSpecific<'Quinn'>;
