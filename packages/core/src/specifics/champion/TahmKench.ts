import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ITahmKench from '@lolcalc/data/files/champion/TahmKench.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'TahmKench', typeof ITahmKench, 'passive'>()({
			known: {
				DamageAPRatio: [],
			},
			calculate(self) {
				let DamageAPRatio = Number.NaN;

				const totalDamage = championAbilityVariableValue('TotalDamage', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self });
				const calculatesFromAPPart = totalDamage.calculatesFrom?.find((part) => part.stat === 'abilityPower');
				if (typeof calculatesFromAPPart?.value === 'number') {
					DamageAPRatio = calculatesFromAPPart.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS tahm kench] failed to calculate passive damage ap ratio', totalDamage);
				}

				return {
					DamageAPRatio: {
						value: DamageAPRatio,
					},
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				DamageAPRatio: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
					roundReplaced: 3,
				},
			},
			uninteresting: ['APRatioPer100BonusHP', 'MaxStacks', 'Duration'],
		}),
	},
} satisfies IChampionSpecific<'TahmKench'>;
