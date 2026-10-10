import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IIllaoi from '@lolcalc/data/files/champion/Illaoi.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Illaoi', typeof IIllaoi, 'passive'>()({
			known: {
				HealOnHit: [],
			},
			calculate(self) {
				let HealOnHit = Number.NaN;

				const percent = championAbilityVariableValue('MissingHPPercentHeal', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self });
				if (typeof percent.value === 'number') {
					HealOnHit = percent.value * (self.stats.value.total.hp - Math.min(self.stats.value.total.hp, self.currentHealth.value));
				} else {
					console.warn('[CHAMPION_SPECIFICS illaoi] failed to calculate passive heal percent', percent);
				}

				return {
					HealOnHit: {
						value: HealOnHit,
					},
				};
			},
			meta: {
				HealOnHit: {
					isCustom: true,
					type: VariableType.heal,
				},
				TentacleDamageTotal: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['TentacleDisabledLifetime', 'MissingHPPercentHeal'],
		}),
	},
} satisfies IChampionSpecific<'Illaoi'>;
