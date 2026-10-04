import type IDraven from '@lolcalc/data/files/champion/Draven.json';
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
		}),
	},
} satisfies IChampionSpecific<'Draven'>;
