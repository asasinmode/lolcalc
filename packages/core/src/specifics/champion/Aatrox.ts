import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IAatrox from '@lolcalc/data/files/champion/Aatrox.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Aatrox', typeof IAatrox, 'passive'>()({
			known: {
				Damage: [],
			},
			calculate(self, target) {
				let Damage = Number.NaN;

				const damagePercent = championAbilityVariableValue('PDamage', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof damagePercent.value === 'number') {
					Damage = (target?.stats.value.total.hp ?? 0) * damagePercent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS passive] failed to calculate passive damage percent', damagePercent);
				}

				return {
					Damage: {
						value: Damage,
					},
				};
			},
			meta: {
				MonsterDamageCap: {
					type: VariableType.magic,
				},
				PDamage: {
					displayedName: 'DamagePercent',
				},
				Damage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['PHealingRatio', 'PHealingMinionMod'],
		}),
	},
} satisfies IChampionSpecific<'Aatrox'>;
