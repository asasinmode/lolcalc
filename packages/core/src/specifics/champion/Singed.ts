import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

const passiveMaxStacks = 9;

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
	},
	w: {
		dataOverrides: {
			isImmobilizing: true,
		},
	},
} satisfies IChampionSpecific<'Singed'>;
