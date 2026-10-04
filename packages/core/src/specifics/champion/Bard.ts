import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IBard from '@lolcalc/data/files/champion/Bard.json';
import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

function passiveMaxChimeMS(self: DamageSource<'Bard'>): number {
	return (self.champion.value! as typeof IBard).abilities.passive.variants[0]!.dataValues.MaxSpeedStacks[1]!;
}

export default {
	setupData(self) {
		const maxChimes: number = passiveMaxChimeMS(self);
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			chimeMoveSpeed: clamp(0, Math.round(self.internalData.value.chimeMoveSpeed ?? 0), maxChimes),
		};
	},
	passive: {
		maxChimeMS: passiveMaxChimeMS,
	},
} satisfies IChampionSpecific<'Bard'>;
