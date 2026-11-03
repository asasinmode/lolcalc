import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IVi from '@lolcalc/data/files/champion/Vi.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			applyWPen: clamp(0, Math.round(self.internalData.value.applyWPen ?? 0), 1),
			isWASActive: clamp(0, Math.round(self.internalData.value.isWASActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Vi', typeof IVi, 'passive'>()({
			meta: {
				TotalShield: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['ShieldDuration', 'CDReductionOn3Hit'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Vi', typeof IVi, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				MaxDamageTooltip: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['SelfSlow'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Vi', typeof IVi, 'w'>()({
			known: {
				AdditionalPercentDamage: [],
				ArmorRemoved: [],
			},
			calculate(self, target) {
				let AdditionalPercentDamage = Number.NaN;

				const thirdHitPercent = championAbilityVariableValue('TotalDamageTooltip', {
					abilityKey: 'w',
					abilityVariant: self.champion.value!.abilities.w.variants[0]!,
					damageSource: self,
				});
				if (typeof thirdHitPercent.value === 'number') {
					AdditionalPercentDamage = thirdHitPercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS vi] failed to calculate w percent dmg', thirdHitPercent);
				}

				return {
					AdditionalPercentDamage: {
						value: AdditionalPercentDamage,
					},
					ArmorRemoved: {
						value: 'TODO',
					},
				};
			},
			meta: {
				AdditionalPercentDamage: {
					type: VariableType.physical,
					isCustom: true,
				},
				ArmorRemoved: {
					isCustom: true,
				},
			},
			/* CDReductionOn3Hit is passive var */
			uninteresting: ['ShredAmount', 'SharedBuffsDuration', 'CDReductionOn3Hit' as any, 'MonsterDamageCap'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Vi', typeof IVi, 'e'>()({
			meta: {
				TotalDamageTooltip: {
					type: VariableType.physical,
				},
				// TODO treat AmmoRechargeTime as cd, apply haste here and in ability level vars
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Vi', typeof IVi, 'r'>()({
			meta: {
				SecondaryTargetStunDuration: {
					type: VariableType.affectedByTenacity,
				},
				Damage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['RStunDuration'],
		}),
	},
} satisfies IChampionSpecific<'Vi'>;
