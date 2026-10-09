import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';

/* doesn't seem to be in passive's data */
const passiveMaxStacks = 5;

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
	},
} satisfies IChampionSpecific<'Jinx'>;
