import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IViego from '@lolcalc/data/files/champion/Viego.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Viego', typeof IViego, 'passive'>()({
			known: {
				PossessHeal: [],
			},
			calculate(self, target) {
				let PossessHeal = Number.NaN;
				const healPercent = championAbilityVariableValue('PercentHealthHeal', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: self,
				});
				if (typeof healPercent.value === 'number') {
					PossessHeal = (target?.stats.value.total.hp ?? 0) * healPercent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS viego] failed to calculate possess heal percent', healPercent);
				}

				return {
					PossessHeal: {
						value: PossessHeal,
					},
				};
			},
			meta: {
				PossessHeal: {
					isCustom: true,
					type: VariableType.heal,
				},
			},
			uninteresting: ['TakedownWindow', 'TransformDuration', 'MoveSpeedPercent'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(_self, { totalStats }) {
				totalStats.mana = 0;
			},
		},
	},
} satisfies IChampionSpecific<'Viego'>;
