import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ILeeSin from '@lolcalc/data/files/champion/LeeSin.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'LeeSin', typeof ILeeSin, 'passive'>()({
			uninteresting: ['PassiveAS'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.hasPassiveStack) {
					const as = championAbilityVariableValue('PassiveAS', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					});
					if (typeof as.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = as.value * 0.01;
					} else {
						console.warn('[CHAMPION_SPECIFICS lee sin] failed to calculate passive as', as);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'LeeSin'>;
