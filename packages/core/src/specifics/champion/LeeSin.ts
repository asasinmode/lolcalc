import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

export default {
	setupData(self) {
		return {
			hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
		};
	},
} satisfies IChampionSpecific<'LeeSin'>;
