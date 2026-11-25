import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IEzreal from '@lolcalc/data/files/champion/Ezreal.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

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
		variables: defineChampionVariables<'Ezreal', typeof IEzreal, 'passive'>()({
			known: {
				AttackSpeed: [],
			},
			calculate(self) {
				return {
					AttackSpeed: {
						value: self.stats.value.championPassive.bonusAttackSpeedPercent,
					},
				};
			},
			meta: {
				AttackSpeed: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['StackDuration', 'MaxStacks', 'AttackSpeedPerStack'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Ezreal', typeof IEzreal, 'q'>()({
			meta: {
				Damage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['CDRefund'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Ezreal', typeof IEzreal, 'w'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['DetonationTimeout', 'ManaReturn'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Ezreal', typeof IEzreal, 'e'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Ezreal', typeof IEzreal, 'r'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				DamageMinionMonster: {
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Ezreal'>;
