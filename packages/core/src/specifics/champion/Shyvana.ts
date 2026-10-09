import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IShyvana from '@lolcalc/data/files/champion/Shyvana.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
	passive: {
		variables: defineChampionVariables<'Shyvana', typeof IShyvana, 'passive'>()({
			known: {
				'{bba88b2a}': [0],
			},
			calculate(self) {
				return {
					'{bba88b2a}': {
						value: self.internalData.value.passiveStacks,
					},
				};
			},
			meta: {
				'{bba88b2a}': {
					isCustom: true,
					displayedName: 'Stacks',
				},
			},
			// TODO bonus armor/magic resist don't show the scaling icon in game. is shown by default because asol uses same var type and does show it. either hide it here explicitly or update asol to do it manually and hide by default for everyone. check how more champions do it
			uninteresting: ['BonusArmor', 'BonusMagicResist', 'Stacks_Per_Large_Monster', 'Stacks_Per_Epic_Monster'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				const params: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const bonusArmor = championAbilityVariableValue('BonusArmor', params);
				const bonusMr = championAbilityVariableValue('BonusMagicResist', params);

				if (typeof bonusArmor.value === 'number' && typeof bonusMr.value === 'number') {
					championPassiveStats.armor = bonusArmor.value * self.internalData.value.passiveStacks;
					championPassiveStats.magicResist = bonusMr.value * self.internalData.value.passiveStacks;
				} else {
					console.warn('[CHAMPION_SPECIFICS shyvana] failed to calculate passive resists', bonusArmor, bonusMr);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Shyvana'>;
