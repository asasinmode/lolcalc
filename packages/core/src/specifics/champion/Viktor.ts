import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

const passiveUpgradesMask = 2 ** 4;

export default {
	setupData(self) {
		let passiveAbilityUpgradesMask = clamp(0, Math.round(self.internalData.value.passiveAbilityUpgradesMask ?? 0), passiveUpgradesMask);

		/* unevolve R if not all basic are evolved */
		const rBit = 1 << 3;
		const notAllEvolved = (passiveAbilityUpgradesMask & (rBit - 1)) !== (rBit - 1);
		if (notAllEvolved) {
			passiveAbilityUpgradesMask &= ~rBit;
		}

		return {
			passiveAbilityUpgradesMask,
		};
	},
	passive: {
		upgradesMask: passiveUpgradesMask,
	},
} satisfies IChampionSpecific<'Viktor'>;
