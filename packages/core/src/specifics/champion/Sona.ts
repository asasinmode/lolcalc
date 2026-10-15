import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISona from '@lolcalc/data/files/champion/Sona.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

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
		variables: defineChampionVariables<'Sona', typeof ISona, 'passive'>()({
			known: {
				'{1705b20f}': [],
			},
			calculate(self) {
				return {
					'{1705b20f}': {
						value: self.internalData.value.passiveStacks,
					},
				};
			},
			meta: {
				'{1705b20f}': {
					displayedName: 'Stacks',
					isCustom: true,
				},
				PowerChordDamage: {
					type: VariableType.magic,
				},
				TotalStaccatoDamage: {
					type: VariableType.magic,
				},
				TotalTempoMoveSpeedSlow: {
					type: VariableType.affectedBySlowResist,
				},
				TempoDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
			/* DiminuendoDuration is W var */
			uninteresting: ['AccelerandoAHPerStack', 'AccelerandoCap', 'AccelerandoUltCDR', 'PowerChordPassiveCountMax', 'DiminuendoDuration' as any],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (!self.internalData.value.passiveStacks) return;

				const hastePerStack = championAbilityVariableValue('AccelerandoAHPerStack', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value });
				if (typeof hastePerStack.value === 'number') {
					championPassiveStats.basicHaste = hastePerStack.value * self.internalData.value.passiveStacks;
				} else {
					console.warn('[CHAMPION_SPECIFICS sona] failed to calculate passive ah per stack', hastePerStack);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Sona'>;
