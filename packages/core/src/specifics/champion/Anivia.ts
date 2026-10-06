import type IAnivia from '@lolcalc/data/files/champion/Anivia.json';
import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isEgg: clamp(0, Math.round(self.internalData.value.isEgg ?? 0), 1),
		};
	},
	w: {
		dataOverrides: {
			isImmobilizing: true,
		},
		variables: defineChampionVariables<'Anivia', typeof IAnivia, 'w'>()({
			uninteresting: ['WallDuration'],
		}),
	},
} satisfies IChampionSpecific<'Anivia'>;
