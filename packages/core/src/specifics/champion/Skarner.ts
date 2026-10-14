import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISkarner from '@lolcalc/data/files/champion/Skarner.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Skarner', typeof ISkarner, 'passive'>()({
			known: {
				MaxHPDamage: [],
			},
			calculate(self, target) {
				let MaxHPDamage = Number.NaN;

				const damagePercent = championAbilityVariableValue('PercentHealthDamage', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof damagePercent.value === 'number') {
					MaxHPDamage = damagePercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS skarner] failed to calculate passive percent dmg', damagePercent);
				}

				return {
					MaxHPDamage: {
						value: MaxHPDamage,
					},
				};
			},
			meta: {
				MaxHPDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['Duration', 'StacksToTriggerPassive'],
		}),
	},
} satisfies IChampionSpecific<'Skarner'>;
