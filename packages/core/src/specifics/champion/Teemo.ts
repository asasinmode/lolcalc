import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';

export default {
	setupData(self) {
		return {
			isPassiveASActive: clamp(0, Math.round(self.internalData.value.isPassiveASActive ?? 0), 1),
		};
	},
} satisfies IChampionSpecific<'Teemo'>;
