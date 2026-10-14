import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISeraphine from '@lolcalc/data/files/champion/Seraphine.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

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
		variables: defineChampionVariables<'Seraphine', typeof ISeraphine, 'passive'>()({
			known: {
				BonusRange: [],
			},
			calculate(self) {
				return {
					BonusRange: {
						value: self.stats.value.championPassive.attackRange ?? 0,
					},
				};
			},
			meta: {
				BonusRange: {
					isCustom: true,
				},
				AutoDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['BonusAARange', 'NoteDuration', 'MaxNotes', 'AllyNoteDamagePercent'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.passiveStacks) {
					const rangePerNote = championAbilityVariableValue('BonusAARange', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
					if (typeof rangePerNote.value === 'number') {
						championPassiveStats.attackRange = rangePerNote.value * self.internalData.value.passiveStacks;
					} else {
						console.warn('[CHAMPION_SPECIFICS seraphine] failed to calculate passive attack range');
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Seraphine'>;
