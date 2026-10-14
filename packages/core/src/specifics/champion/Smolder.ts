import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ISmolder from '@lolcalc/data/files/champion/Smolder.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
	variables: defineChampionVariables<'Smolder', typeof ISmolder>()({
		known: {
			'{32bcea5d}': [],
		},
		calculate(self) {
			return {
				'{32bcea5d}': {
					value: self.internalData.value.passiveStacks,
				},
			};
		},
	}),
	passive: {
		modifyVariantData(abilityVariant) {
			/* on patch 26.20 the extended tooltip is not displayed in game */
			abilityVariant.tooltipExtended = undefined;
		},
		variables: defineChampionVariables<'Smolder', typeof ISmolder, 'passive'>()({
			known: {
				'f1.0': [],
			},
			calculate(self) {
				return {
					'f1.0': {
						value: self.internalData.value.passiveStacks,
					},
				};
			},
			meta: {
				'f1.0': {
					displayedName: 'Stacks',
				},
			},
		}),
	},
	q: {
		variables: defineChampionVariables<'Smolder', typeof ISmolder, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				Passive_QDamageIncrease: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['StackTier1', 'StackTier2', 'StackTier3', 'ManaRestore', 'Tier2_BlowbackPercentageDamage', 'Tier3_DotLength', 'Tier3_ExecuteThreshold', 'LifestealMod', 'CritRatio'],
		}),
	},
} satisfies IChampionSpecific<'Smolder'>;
