import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IGangplank from '@lolcalc/data/files/champion/Gangplank.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Gangplank', typeof IGangplank, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.true,
				},
			},
			uninteresting: ['DoTDuration', 'MoveSpeedDuration', 'TurretDamageMult'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Gangplank', typeof IGangplank, 'q'>()({
			known: {
				/* it's present in the ability variables but needs to be here to be used in extracting a stringtable variable */
				GameModeInteger: [1],
				f1: [],
				f3: [],
			},
			calculate() {
				return {
					GameModeInteger: { value: 1 },
					f1: { value: 0 },
					f3: { value: 0 },
				};
			},
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const ms = championAbilityVariableValue('MoveSpeed', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
					if (typeof ms.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += ms.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS gangplank] failed to calculate passive ms', ms);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Gangplank'>;
