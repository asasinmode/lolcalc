import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IAmbessa from '@lolcalc/data/files/champion/Ambessa.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Ambessa', typeof IAmbessa, 'passive'>()({
			meta: {
				Calc_OnHit_Damage_Flat: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['Calc_Attack_Speed', 'Attack_Buff_Duration', 'Attack_Buff_Max_Stacks', 'Calc_OnHit_Energy_Refund', 'Attack_Range_Amount'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Ambessa', typeof IAmbessa, 'q'>()({
			known: {
				SweepTotalDamage: [],
				SlamTotalDamage: [],
			},
			calculate(self, target) {
				const targetTotalHP = target?.stats.value.total.hp ?? 0;
				let SweepTotalDamage = Number.NaN;
				let SlamTotalDamage = Number.NaN;

				const abilityParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				};

				const sweepBase = championAbilityVariableValue('Calc_Damage_1_Max', abilityParams);
				const sweepPercent = championAbilityVariableValue('Calc_Damage_1_Percent_Max', abilityParams);
				if (typeof sweepBase.value === 'number' && typeof sweepPercent.value === 'number') {
					SweepTotalDamage = sweepBase.value + targetTotalHP * sweepPercent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS ambessa] failed to calculate sweep variables', sweepBase, sweepPercent);
				}

				const slamBase = championAbilityVariableValue('Calc_Damage_2_Max', abilityParams);
				const slamPercent = championAbilityVariableValue('Calc_Damage_2_Percent_Max', abilityParams);
				if (typeof slamBase.value === 'number' && typeof slamPercent.value === 'number') {
					SlamTotalDamage = slamBase.value + targetTotalHP * slamPercent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS ambessa] failed to calculate slam variables', slamBase, slamPercent);
				}

				return {
					SweepTotalDamage: {
						value: SweepTotalDamage,
					},
					SlamTotalDamage: {
						value: SlamTotalDamage,
					},
				};
			},
			meta: {
				Calc_Damage_1_Max: {
					type: VariableType.physical,
					displayedName: 'SweepBaseDamage',
				},
				Calc_Damage_1_Percent_Max: {
					displayedName: 'SweepPercentDamage',
				},
				Calc_Damage_2_Max: {
					type: VariableType.physical,
					displayedName: 'SlamBaseDamage',
				},
				Calc_Damage_2_Percent_Max: {
					displayedName: 'SlamPercentDamage',
				},
				SweepTotalDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
				SlamTotalDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['Calc_Damage_1_Min_Ratio', 'Calc_Damage_2_Min_Ratio', 'Calc_Damage_Monster_Flat_Bonus'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Ambessa', typeof IAmbessa, 'w'>()({
			meta: {
				Calc_Shield: {
					type: VariableType.shield,
				},
				Calc_Damage_Low: {
					type: VariableType.physical,
				},
				Calc_Damage_High: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['Shield_Duration', 'Buff_Duration'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Ambessa', typeof IAmbessa, 'e'>()({
			meta: {
				Calc_Damage_Flat: {
					type: VariableType.physical,
				},
				Slow_Amount: {
					type: VariableType.affectedBySlowResist,
				},
				Slow_Duration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: [],
		}),
	},
	r: {
		variables: defineChampionVariables<'Ambessa', typeof IAmbessa, 'r'>()({
			// TODO fix calc_omnivamp, has extended equals
			meta: {
				Calc_Damage: {
					type: VariableType.physical,
				},
				Stun_Duration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['Omnivamp_MonsterMod', 'Omnivamp_MinionMod', 'Suppress_Duration'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.hasPassiveStack) {
					const attackRange = championAbilityVariableValue('Attack_Range_Amount', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					});
					if (typeof attackRange.value === 'number') {
						championPassiveStats.attackRange = attackRange.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS ambessa] failed to calculate passive attack range', attackRange);
					}
				}
			},
		},
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.hasPassiveStack) {
					const attackSpeed = championAbilityVariableValue('Calc_Attack_Speed', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: {} as DamageSource,
					});
					if (typeof attackSpeed.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = attackSpeed.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS ambessa] failed to calculate passive attack speed', attackSpeed);
					}
				}

				if (self.abilityLevels.value.r) {
					const armorPen = championAbilityVariableValue('Armor_Penetration', {
						abilityKey: 'r',
						abilityVariant: self.champion.value!.abilities.r.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { abilityLevels: self.abilityLevels } as DamageSource,
					});
					if (typeof armorPen.value === 'number') {
						championPassiveStats.percentArmorPen = armorPen.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS ambessa] failed to calculate r armor pen', armorPen.value);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Ambessa'>;
