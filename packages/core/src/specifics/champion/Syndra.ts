import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ISyndra from '@lolcalc/data/files/champion/Syndra.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMaxStacks(self: DamageSource<'Syndra'>): number {
	return (self.champion.value! as typeof ISyndra).abilities.passive.variants[0]!.dataValues.MaxStackAmount[1]!;
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
	w: {
		variables: defineChampionVariables<'Syndra', typeof ISyndra, 'w'>()({
			known: {
				f2: [],
				f3: [0, 1],
			},
			calculate(self) {
				let f3 = Number.NaN;
				const wUpgradeThreshold = championAbilityVariableValue('WUpgradeThreshold', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});

				if (typeof wUpgradeThreshold.value === 'number') {
					f3 = self.internalData.value.passiveStacks >= wUpgradeThreshold.value ? 1 : 0;
				} else {
					console.warn('[CHAMPION_SPECIFICS syndra] failed to calculate w upgrade threshold', wUpgradeThreshold);
				}

				return {
					f2: championAbilityVariableValue('SlowDuration', {
						abilityKey: 'w',
						abilityVariant: self.champion.value!.abilities.w.variants[0]!,
						damageSource: self,
					}),
					f3: {
						value: f3,
					},
				};
			},
			meta: {
				f2: {
					displayedName: 'SlowDuration',
					type: VariableType.affectedByTenacity,
					roundReplaced: 2,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Syndra'>;
