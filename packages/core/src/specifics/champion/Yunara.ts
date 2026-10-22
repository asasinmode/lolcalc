import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IYunara from '@lolcalc/data/files/champion/Yunara.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Yunara', typeof IYunara, 'passive'>()({
			known: {
				AdditionalDamage: [],
			},
			calculate(self) {
				let AdditionalDamage = Number.NaN;

				const percent = championAbilityVariableValue('Calc_Damage_Amp', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof percent.value === 'number') {
					AdditionalDamage = self.stats.value.total.attackDamage * percent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS yunara] failed to calculate passive additonal damage', percent);
				}

				return {
					AdditionalDamage: {
						value: AdditionalDamage,
					},
				};
			},
			meta: {
				AdditionalDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Yunara', typeof IYunara, 'w'>()({
			known: {
				'f3.0': [],
			},
			calculate(self) {
				return {
					'f3.0': {
						value: Math.max(0, self.stats.value.bonus.bonusAttackSpeedPercent - self.stats.value.effect.bonusAttackSpeedPercent),
					},
				};
			},
			meta: {
				'f3.0': {
					displayedName: 'CurrentBonusAS',
					multiplier: 100,
				},
				Calc_Damage_Initial: {
					type: VariableType.magic,
				},
				Calc_Slow: {
					type: VariableType.affectedBySlowResist,
				},
				Slow_Duration: {
					type: VariableType.affectedByTenacity,
				},
				Calc_Damage_Per_Second: {
					type: VariableType.magic,
				},
				Calc_RW_Damage: {
					type: VariableType.magic,
				},
				Calc_RW_Slow_Amount: {
					type: VariableType.affectedBySlowResist,
				},
				RW_Slow_Duration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['Cast_Time_Attack_Speed_Cap_Empowered'],
		}),
	},
} satisfies IChampionSpecific<'Yunara'>;
