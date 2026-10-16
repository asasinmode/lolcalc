import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IVayne from '@lolcalc/data/files/champion/Vayne.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Vayne', typeof IVayne, 'passive'>()({
			uninteresting: ['MovementSpeed'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.isPassiveMSActive) {
					const ms = championAbilityVariableValue('MovementSpeed', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					});
					if (typeof ms.value === 'number') {
						championPassiveStats.moveSpeed = ms.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS vayne] failed to calculate passive ms', ms);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Vayne'>;
