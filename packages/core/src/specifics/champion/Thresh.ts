import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IThresh from '@lolcalc/data/files/champion/Thresh.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
	variables: defineChampionVariables<'Thresh', typeof IThresh>()({
		known: {
			'{5fbfbf13}': [],
		},
		calculate(self) {
			return {
				'{5fbfbf13}': {
					value: self.internalData.value.passiveStacks,
				},
			};
		},
	}),
	passive: {
		variables: defineChampionVariables<'Thresh', typeof IThresh, 'passive'>()({
			meta: {
				CurrentSoulBonus: {
					displayedName: 'BonusArmorAndAP',
				},
			},
			uninteresting: ['StatValuePerSoul'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (!self.internalData.value.passiveStacks) return;

				const statPerSoul = championAbilityVariableValue('StatValuePerSoul', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				});
				if (typeof statPerSoul.value === 'number') {
					championPassiveStats.abilityPower = statPerSoul.value * self.internalData.value.passiveStacks;
					championPassiveStats.armor = statPerSoul.value * self.internalData.value.passiveStacks;
				} else {
					console.warn('[CHAMPION_SPECIFICS thres] failed to calculate passive stat per soul', statPerSoul);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Thresh'>;
