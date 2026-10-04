import type { IChampionSpecific } from '../champion.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
} satisfies IChampionSpecific<'Smolder'>;
