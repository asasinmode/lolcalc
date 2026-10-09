import type IDraven from '@lolcalc/data/files/champion/Draven.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
	passive: {
		variables: defineChampionVariables<'Draven', typeof IDraven, 'passive'>()({
			known: {
				DravenPassiveGoldEarned: [],
				DravenPassiveHighestBounty: [],
			},
			calculate() {
				return {
					DravenPassiveGoldEarned: { value: 0 },
					DravenPassiveHighestBounty: { value: 0 },
				};
			},
			uninteresting: ['StackGain', 'PassiveGoldBase', 'PassiveGoldPerStack', 'PercentOfStacksLost', 'DravenPassiveGoldEarned', 'DravenPassiveHighestBounty'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Draven', typeof IDraven, 'r'>()({
			known: {
				f1: [],
				'{577427b5}': [],
			},
			calculate(self) {
				return {
					f1: { value: 0 },
					'{577427b5}': { value: self.internalData.value.passiveStacks },
				};
			},
			meta: {
				RCalculatedDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['f1', 'RDamageReductionPerHit', 'RMinDamagePercent', 'RPassiveStacksCoefficient'],
		}),
	},
} satisfies IChampionSpecific<'Draven'>;
