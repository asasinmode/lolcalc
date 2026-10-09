import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type ISona from '@lolcalc/data/files/champion/Sona.json';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';

function passiveMaxStacks(self: DamageSource<'Sona'>): number {
	return (self.champion.value! as typeof ISona).abilities.passive.variants[0]!.dataValues.AccelerandoCap[1]! * 2;
}

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks(self)),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
	},
} satisfies IChampionSpecific<'Sona'>;
