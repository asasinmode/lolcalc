import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IOrianna from '@lolcalc/data/files/champion/Orianna.json';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';

function passiveMaxStacks(self: DamageSource<'Orianna'>): number {
	return (self.champion.value! as typeof IOrianna).abilities.passive.variants[0]!.dataValues.StackCount[1]!;
}

export default {
	setupData(self) {
		return {
			passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), passiveMaxStacks(self)),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
	},
} satisfies IChampionSpecific<'Orianna'>;
