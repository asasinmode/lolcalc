import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IMonkeyKing from '@lolcalc/data/files/champion/MonkeyKing.json';
import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

const passiveMaxStacks = (self: DamageSource<'MonkeyKing'>): number => (self.champion.value! as typeof IMonkeyKing).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!;

export default {
	setupData(self) {
		const maxStacks: number = passiveMaxStacks(self);
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
	},
} satisfies IChampionSpecific<'MonkeyKing'>;
