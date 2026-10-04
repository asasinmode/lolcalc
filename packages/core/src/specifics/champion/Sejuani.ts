import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

export default {
	setupData(self) {
		return {
			isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
		};
	},
	w: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
} satisfies IChampionSpecific<'Sejuani'>;
