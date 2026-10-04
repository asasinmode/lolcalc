import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

export default {
	setupData(self) {
		return {
			isOverheated: clamp(0, Math.round(self.internalData.value.isOverheated ?? 0), 1),
		};
	},
} satisfies IChampionSpecific<'Rumble'>;
