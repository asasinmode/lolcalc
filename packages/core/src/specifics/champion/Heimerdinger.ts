import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IHeimerdinger from '@lolcalc/data/files/champion/Heimerdinger.json';
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
		variables: defineChampionVariables<'Heimerdinger', typeof IHeimerdinger, 'passive'>()({
			uninteresting: ['MovementSpeed'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Heimerdinger', typeof IHeimerdinger, 'q'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				DamageBeam: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MaxTurrets', 'MaxKits'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Heimerdinger', typeof IHeimerdinger, 'w'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				TotalDamage: {
					type: VariableType.magic,
				},
				ExtraHitDamage: {
					type: VariableType.magic,
				},
				ExtraHitDamageMinions: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['Rockets'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Heimerdinger', typeof IHeimerdinger, 'e'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				SlowPercent: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Heimerdinger', typeof IHeimerdinger, 'r'>()({
			meta: {
				QUltDamage: {
					type: VariableType.magic,
				},
				QUltDamageBeam: {
					type: VariableType.magic,
				},
				WUltDamage: {
					type: VariableType.magic,
				},
				WUltTotalDamage: {
					type: VariableType.magic,
				},
				EUltDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const ms = championAbilityVariableValue('MovementSpeed', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value });
					if (typeof ms.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += ms.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS heimerdinger] failed to calculate passive ms', ms);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Heimerdinger'>;
