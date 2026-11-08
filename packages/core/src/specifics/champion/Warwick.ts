import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IWarwick from '@lolcalc/data/files/champion/Warwick.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { applyModifyVarFns } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const wOptions = {
	none: 0,
	normal: 1,
	enhanced: 2,
};

export default {
	setupData(self) {
		return {
			wVariantActive: clamp(0, Math.round(self.internalData.value.wVariantActive ?? 0), wOptions.enhanced),
			isEActive: clamp(0, Math.round(self.internalData.value.isEActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Warwick', typeof IWarwick, 'passive'>()({
			known: {
				Healing: [],
				EmpoweredHealing: [],
			},
			calculate(self) {
				let Healing = Number.NaN;
				let EmpoweredHealing = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('OnHitDamage', passiveParams);
				const healRatio = championAbilityVariableValue('HealingRatio', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof healRatio.value === 'number') {
					Healing = applyModifyVarFns(baseDamage.value * healRatio.value, self, VariableType.magic);
				} else {
					console.warn('[CHAMPION_SPECIFICS warwick] failed to calculate passive damage & healing ratio', baseDamage, healRatio);
				}

				const empoweredHealRatio = championAbilityVariableValue('EmpoweredHealingRatio', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof empoweredHealRatio.value === 'number') {
					EmpoweredHealing = baseDamage.value * empoweredHealRatio.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS warwick] failed to calculate passive empowered healing ratio', empoweredHealRatio);
				}

				return {
					Healing: {
						value: Healing,
					},
					EmpoweredHealing: {
						value: EmpoweredHealing,
					},
				};
			},
			meta: {
				OnHitDamage: {
					type: VariableType.magic,
				},
				Healing: {
					type: VariableType.heal,
					isCustom: true,
				},
				EmpoweredHealing: {
					type: VariableType.heal,
					isCustom: true,
				},
			},
			uninteresting: ['HealingThreshold', 'HealingRatio', 'EmpoweredHealingThreshold', 'EmpoweredHealingRatio'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Warwick', typeof IWarwick, 'q'>()({
			known: {
				TotalDamage: [],
				DamageHeal: [],
			},
			calculate(self, target) {
				let TotalDamage = Number.NaN;
				let DamageHeal = Number.NaN;

				const qParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('BaseBiteDamage', qParams);
				const damagePercent = championAbilityVariableValue('TargetPercentHPDamage', qParams);
				if (typeof baseDamage.value === 'number' && typeof damagePercent.value === 'number') {
					TotalDamage = baseDamage.value + damagePercent.value * 0.01 * (target ? Math.min(target.currentHealth.value, target.stats.value.total.hp) : 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS warwick] failed to calculate q damage vars', baseDamage, damagePercent);
				}

				const healPercent = championAbilityVariableValue('LifestealPercent', qParams);
				if (typeof healPercent.value === 'number') {
					DamageHeal = applyModifyVarFns(TotalDamage, self, VariableType.magic) * healPercent.value * 0.01;
				} else {
					console.warn('[CHAMPION_SPECIFICS warwick] failed to calculate q damage heal percent', healPercent);
				}

				return {
					TotalDamage: { value: TotalDamage },
					DamageHeal: { value: DamageHeal },
				};
			},
			meta: {
				BaseBiteDamage: {
					type: VariableType.magic,
				},
				TotalDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				DamageHeal: {
					isCustom: true,
					type: VariableType.heal,
				},
			},
			uninteresting: [],
		}),
	},
	w: {
		options: wOptions,
	},
	e: {
		variables: defineChampionVariables<'Warwick', typeof IWarwick, 'e'>()({
			meta: {
				FearDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['DRDuration'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Warwick', typeof IWarwick, 'r'>()({
			known: {
				DamageHeal: [],
			},
			calculate(self) {
				const DamageHeal = championAbilityVariableValue('DamageCumulative', {
					abilityKey: 'r',
					abilityVariant: self.champion.value!.abilities.r.variants[0]!,
					damageSource: self,
				});
				if (typeof DamageHeal.value === 'number') {
					DamageHeal.value = applyModifyVarFns(DamageHeal.value ?? 0, self, VariableType.magic);
				}

				return {
					DamageHeal,
				};
			},
			meta: {
				DamageCumulative: {
					type: VariableType.magic,
				},
				DamageHeal: {
					isCustom: true,
					type: VariableType.heal,
				},
			},
			uninteresting: ['RDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				if (self.internalData.value.wVariantActive) {
					const wParams: IGameVariableValueParameters['championAbility'] = {
						abilityKey: 'w',
						abilityVariant: self.champion.value!.abilities.w.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					};
					/* doesn't seem to be in a variable */
					const mult = self.internalData.value.wVariantActive === wOptions.enhanced ? 2 : 1;
					const ms = championAbilityVariableValue('MoveSpeedBonus', wParams);
					if (typeof ms.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += ms.value * 0.01 * mult;
					} else {
						console.warn('[CHAMPION_SPECIFICS warwick] failed to calculate W ms', ms);
					}
					const as = championAbilityVariableValue('PassiveASBonus', wParams);
					if (typeof as.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = as.value * 0.01 * mult;
					} else {
						console.warn('[CHAMPION_SPECIFICS warwick] failed to calculate W as', as);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Warwick'>;
