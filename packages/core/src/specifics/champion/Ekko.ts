import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IEkko from '@lolcalc/data/files/champion/Ekko.json';
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
		variables: defineChampionVariables<'Ekko', typeof IEkko, 'passive'>()({
			meta: {
				ThreeHitDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['SpeedDuration', 'LockoutTime', 'MonsterMod'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Ekko', typeof IEkko, 'q'>()({
			meta: {
				InitialDamage: {
					type: VariableType.magic,
				},
				RecallDamage: {
					type: VariableType.magic,
				},
				SlowPercent: {
					type: VariableType.affectedBySlowResist,
				},
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Ekko', typeof IEkko, 'w'>()({
			known: {
				MissingHealthDamage: [],
			},
			calculate(self, target) {
				let MissingHealthDamage = Number.NaN;
				const wParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'w', abilityVariant: self.champion.value!.abilities.w.variants[0]!, damageSource: self };

				const healthThreshold = championAbilityVariableValue('BelowHealthThreshold', wParams);
				if (typeof healthThreshold.value === 'number') {
					const targetCurrentHP = target ? Math.min(target.stats.value.total.hp, target.currentHealth.value) : 0;
					if (targetCurrentHP / (target?.stats.value.total.hp || 1) <= healthThreshold.value) {
						const percentDamage = championAbilityVariableValue('MissingHealthPercent', wParams);
						if (typeof percentDamage.value === 'number') {
							MissingHealthDamage = percentDamage.value * ((target?.stats.value.total.hp ?? 0) - targetCurrentHP);
						} else {
							console.warn('[CHAMPION_SPECIFICS ekko] failed to calculate w percent damage', percentDamage);
						}
					} else {
						MissingHealthDamage = 0;
					}
				} else {
					console.warn('[CHAMPION_SPECIFICS ekko] failed to calculate w damage threshold', healthThreshold);
				}

				return {
					MissingHealthDamage: {
						value: MissingHealthDamage,
					},
				};
			},
			meta: {
				MissingHealthDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
				SlowPercent: {
					type: VariableType.affectedBySlowResist,
				},
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
				TotalShield: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['BelowHealthThreshold', 'SlowZoneDuration', 'OnHitMinMinionDamage', 'OnHitMaxMinionDamage'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Ekko', typeof IEkko, 'e'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Ekko', typeof IEkko, 'r'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				TotalBaseHeal: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['PercentHealAmpPerPercentMissingHealth'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const ms = championAbilityVariableValue('BonusMS', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
					if (typeof ms.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += ms.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS ekko] failed to calculate passive ms', ms);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Ekko'>;
