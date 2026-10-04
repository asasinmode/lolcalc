import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IIrelia from '@lolcalc/data/files/champion/Irelia.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

function maxPassiveStacks(self: DamageSource<'Irelia'>): number {
	return (self.champion.value! as typeof IIrelia).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!;
}

export default {
	setupData(self) {
		const maxStacks: number = maxPassiveStacks(self);
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
		};
	},
	r: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
	passive: {
		maxStacks: maxPassiveStacks,
		variables: defineChampionVariables<'Irelia', typeof IIrelia, 'passive'>()({
			known: {
				AttackSpeedPercent: [],
			},
			calculate(self) {
				return {
					AttackSpeedPercent: {
						value: self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0,
					},
				};
			},
			meta: {
				OnHitBonus: {
					type: VariableType.magic,
				},
				AttackSpeedPercent: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['BuffDuration', 'MaxStacks', 'OnHitStructureMod'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const attackSpeedPerStack = championAbilityVariableValue('SingleStackAS', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
				if (typeof attackSpeedPerStack.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS irelia] failed to calculate passive attack speed', attackSpeedPerStack);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Irelia'>;
