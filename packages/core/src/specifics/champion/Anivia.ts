import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

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
	},
} satisfies IChampionSpecific<'Anivia'>;
