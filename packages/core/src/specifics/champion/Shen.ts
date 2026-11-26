import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
// todo do variables
import type IShen from '@lolcalc/data/files/champion/Shen.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Shen', typeof IShen, 'passive'>()({
			known: {
				'{7dfdcd99}': [],
			},
			calculate() {
				return {
					/* originally a buff indicating shen has won his nemesis quest vs zed */
					'{7dfdcd99}': {
						value: 0,
					},
				};
			},
			meta: {
				ShieldValue: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['ShieldDuration', 'ShieldCooldown'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Shen', typeof IShen, 'q'>()({
			known: {
				TotalDamage: [],
				TotalEmpoweredDamage: [],
			},
			calculate(self, target) {
				const targetTotalHP = target?.stats.value.total.hp ?? 0;
				let TotalDamage = Number.NaN;
				let TotalEmpoweredDamage = Number.NaN;

				const qParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				};

				const baseDamage = championAbilityVariableValue('BaseFlatDamage', qParams);
				const basePercent = championAbilityVariableValue('BasePercentHealth', qParams);
				if (typeof baseDamage.value === 'number' && typeof basePercent.value === 'number') {
					TotalDamage = baseDamage.value + targetTotalHP * basePercent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS shen] failed to calculate normal total damage vars', baseDamage, basePercent);
				}

				const empPercent = championAbilityVariableValue('EmpPercentHealth', qParams);
				if (typeof baseDamage.value === 'number' && typeof empPercent.value === 'number') {
					TotalEmpoweredDamage = baseDamage.value + targetTotalHP * empPercent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS shen] failed to calculate empowered damage vars', baseDamage, empPercent);
				}

				return {
					TotalDamage: {
						value: TotalDamage,
					},
					TotalEmpoweredDamage: {
						value: TotalEmpoweredDamage,
					},
				};
			},
			meta: {
				Slow: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				BaseFlatDamage: {
					type: VariableType.magic,
				},
				TotalDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				TotalEmpoweredDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['NumEnhancedAttacks', 'SteroidAS', 'MonsterAmp'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Shen', typeof IShen, 'w'>()({
			uninteresting: ['ZoneDuration', 'ZoneDelay'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Shen', typeof IShen, 'e'>()({
			meta: {
				CCDuration: {
					type: VariableType.affectedByTenacity,
				},
				TauntDamage: {
					type: VariableType.physical,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Shen', typeof IShen, 'r'>()({
			known: {
				ShieldOnTarget: [],
			},
			calculate(self, target) {
				let ShieldOnTarget = Number.NaN;

				const rParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'r',
					abilityVariant: self.champion.value!.abilities.r.variants[0]!,
					damageSource: self,
				};

				const shield = championAbilityVariableValue('Shield', rParams);
				const maxShield = championAbilityVariableValue('MaxShield', rParams);
				if (typeof shield.value === 'number' && typeof maxShield.value === 'number') {
					const targetTotalHP = target?.stats.value.total.hp ?? 0;
					const targetCurrentHP = target ? Math.min(targetTotalHP, target.currentHealth.value) : 0;
					const missingHealthPercent = 1 - targetCurrentHP / (targetTotalHP || 1);

					ShieldOnTarget = shield.value + (maxShield.value - shield.value) * Math.min(missingHealthPercent / 0.6, 1);
				} else {
					console.warn('[CHAMPION_SPECIFICS shen] failed to calculate shield on target variables', shield, maxShield);
				}

				return {
					ShieldOnTarget: {
						value: ShieldOnTarget,
					},
				};
			},
			meta: {
				Shield: {
					type: VariableType.shield,
				},
				MaxShield: {
					type: VariableType.shield,
				},
				ShieldOnTarget: {
					isCustom: true,
					type: VariableType.shield,
					additionalInfo: "Goes up to <var>MaxShield</var> based on the <u>column target's</u> missing hp",
				},
			},
			uninteresting: ['ShieldDuration', 'ChannelDuration'],
		}),
	},
} satisfies IChampionSpecific<'Shen'>;
