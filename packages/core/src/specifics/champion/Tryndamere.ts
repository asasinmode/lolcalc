import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ITryndamere from '@lolcalc/data/files/champion/Tryndamere.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Tryndamere', typeof ITryndamere, 'passive'>()({
			uninteresting: ['PassiveCritConversionTooltip'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const critPerStack = championAbilityVariableValue('PassiveCritConversionTooltip', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				});
				if (typeof critPerStack.value === 'number') {
					championPassiveStats.critChance = self.currentAbilityResource.value * critPerStack.value * 0.01;
				} else {
					console.warn('[CHAMPION_SPECIFICS tryndamere] failed to calculate passive crit', critPerStack);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Tryndamere'>;
