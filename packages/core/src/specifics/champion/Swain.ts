import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISwain from '@lolcalc/data/files/champion/Swain.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
	variables: defineChampionVariables<'Swain', typeof ISwain>()({
		known: {
			'{0dc6979e}': [],
		},
		calculate(self) {
			return {
				'{0dc6979e}': {
					value: self.internalData.value.passiveStacks,
				},
			};
		},
	}),
	passive: {
		variables: defineChampionVariables<'Swain', typeof ISwain, 'passive'>()({
			known: {
				f1: [],
				StackCollectionHeal: [],
			},
			calculate(self) {
				let StackCollectionHeal = Number.NaN;

				const stackHealPercent = championAbilityVariableValue('PassiveHealPercent', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof stackHealPercent.value === 'number') {
					StackCollectionHeal = stackHealPercent.value * self.stats.value.total.hp;
				} else {
					console.warn('[CHAMPION_SPECIFICS swain] failed to calculate passive stack heal', stackHealPercent);
				}

				return {
					StackCollectionHeal: {
						value: StackCollectionHeal,
					},
					f1: {
						value: self.internalData.value.passiveStacks,
					},
				};
			},
			meta: {
				f1: {
					displayedName: 'Stacks',
				},
				StackCollectionHeal: {
					isCustom: true,
					type: VariableType.heal,
				},
			},
			uninteresting: [],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const hpPerStack = championAbilityVariableValue('HealthIncrement', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value });
				if (typeof hpPerStack.value === 'number') {
					championPassiveStats.hp = self.internalData.value.passiveStacks * hpPerStack.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS swain] failed to calculate passive hp per stack', hpPerStack.value);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Swain'>;
