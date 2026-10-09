import { combineCompounding } from '@lolcalc/core/calculate/util.ts';
import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IBriar from '@lolcalc/data/files/champion/Briar.json';

import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Briar', typeof IBriar, 'passive'>()({
			known: {
				HealIncrease: [],
			},
			calculate(self) {
				return {
					HealIncrease: {
						value: self.stats.value.variables.briarHealingMult ?? 0,
					},
				};
			},
			meta: {
				HealIncrease: {
					isCustom: true,
					resultsMultiplier: 100,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['BleedDuration', 'MaxBleedStacks', 'HealPercent', 'CurrentHealthPercentCost', 'PercentOfBleedHealedOnKill'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { bonusStats, totalStats }, { calculatedVariables }) {
				const currentHpPercent = Math.min(self.currentHealth.value, totalStats.hp) / totalStats.hp;
				const missingHealthPercent = (1 - currentHpPercent) * 100;

				const healingMultVar = championAbilityVariableValue('TotalHealPerMissingHPPercentTooltip', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { stats: { value: { bonus: bonusStats } } } as DamageSource,
				});
				const { calculatesFrom } = healingMultVar;

				if (typeof calculatesFrom?.[0]?.value !== 'number' || typeof calculatesFrom?.[1]?.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS briar] failed to calculate passive healing multiplier', healingMultVar);

					return;
				}

				calculatedVariables.briarHealingMult = (calculatesFrom[0].value * missingHealthPercent) / 10_000 + ((bonusStats.hp / 100) * missingHealthPercent * calculatesFrom[1].value) / 100;

				calculatedVariables.hpRegenMult = combineCompounding(calculatedVariables.hpRegenMult, calculatedVariables.briarHealingMult);
				calculatedVariables.healMultAdditive += calculatedVariables.briarHealingMult;
			},
			priority: HOOK_PRIORITIES.postTotal.Briar,
		},
	},
} satisfies IChampionSpecific<'Briar'>;
