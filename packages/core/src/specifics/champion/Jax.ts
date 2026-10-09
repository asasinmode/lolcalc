import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IJax from '@lolcalc/data/files/champion/Jax.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

function maxPassiveStacks(self: DamageSource<'Jax'>): number {
	return (self.champion.value! as typeof IJax).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!;
}

export default {
	setupData(self) {
		const maxStacks: number = maxPassiveStacks(self);
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
		};
	},
	passive: {
		maxStacks: maxPassiveStacks,
		variables: defineChampionVariables<'Jax', typeof IJax, 'passive'>()({
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
				AttackSpeedPercent: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const attackSpeedPerStack = championAbilityVariableValue('AttackSpeedPerStack', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				});
				if (typeof attackSpeedPerStack.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS jax] failed to calculate passive attack speed', attackSpeedPerStack);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Jax'>;
