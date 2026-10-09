import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type ISeraphine from '@lolcalc/data/files/champion/Seraphine.json';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';

function passiveMaxStacks(self: DamageSource<'Seraphine'>): number {
	return (self.champion.value! as typeof ISeraphine).abilities.passive.variants[0]!.dataValues.MaxNotes[1]! * 5;
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
} satisfies IChampionSpecific<'Seraphine'>;
