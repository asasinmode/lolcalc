import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IEzreal from '@lolcalc/data/files/champion/Ezreal.json';
import type { IChampionSpecific } from '../champion.ts';
import { clamp } from '@lolcalc/shared/utils.ts';

function passiveMaxStacks(self: DamageSource<'Ezreal'>): number {
	return (self.champion.value! as typeof IEzreal).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!;
}

export default {
	setupData(self) {
		const maxStacks: number = passiveMaxStacks(self);
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
		};
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats, baseStats }) {
				const { passiveStacks } = self.internalData.value;
				const bonusAttackSpeedPercent = passiveStacks * (self.champion.value as typeof IEzreal).abilities.passive.variants[0]!.dataValues.AttackSpeedPerStack[1]!;
				championPassiveStats.bonusAttackSpeedPercent = bonusAttackSpeedPercent;
				championPassiveStats.attackSpeed = bonusAttackSpeedPercent * baseStats.attackSpeedRatio;
			},
		},
	},
	passive: {
		maxStacks: passiveMaxStacks,
	},
} satisfies IChampionSpecific<'Ezreal'>;
