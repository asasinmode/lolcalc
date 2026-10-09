import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';

const passiveStyleOptions = {
	none: 0,
	e: 1,
	d: 2,
	c: 3,
	b: 4,
	a: 5,
	s: 6,
};

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveStyleOptions.s),
		};
	},
	passive: {
		styleOptions: passiveStyleOptions,
	},
} satisfies IChampionSpecific<'Samira'>;
