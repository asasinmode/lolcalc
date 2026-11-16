import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IOrianna from '@lolcalc/data/files/champion/Orianna.json';
import type { IChampion } from '@lolcalc/data/types.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMaxStacks(self: DamageSource<'Orianna'>): number {
	return (self.champion.value! as typeof IOrianna).abilities.passive.variants[0]!.dataValues.StackCount[1]!;
}

function calculateWMS(progress: number, champion: IChampion, abilityLevel: number) {
	const msPercent = championAbilityVariableValue('HasteAmount', {
		abilityKey: 'w',
		abilityVariant: champion.abilities.w.variants[0]!,
		abilityLevel,
	});

	if (typeof msPercent.value === 'number') {
		return msPercent.value * progress;
	}

	console.warn('[CHAMPION_SPECIFICS orianna] failed to calculate W bonus MS', msPercent);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), passiveMaxStacks(self)),
			wMSProgress: clamp(0, Math.round(self.internalData.value.wMSProgress ?? 0), 100),
			applyEResists: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), 1),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Orianna', typeof IOrianna, 'passive'>()({
			known: {
				WithStacksDamage: [],
			},
			calculate(self) {
				let WithStacksDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					abilityKey: 'passive',
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('TotalDamage', passiveParams);
				const stackDamage = championAbilityVariableValue('StackDamage', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof stackDamage.value === 'number') {
					WithStacksDamage = baseDamage.value + stackDamage.value * self.internalData.value.passiveStacksOnTarget;
				} else {
					console.warn('[CHAMPION_SPECIFICS orianna] failed to calculate passive damage', baseDamage, stackDamage);
				}

				return {
					WithStacksDamage: {
						value: WithStacksDamage,
					},
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				StackDamage: {
					type: VariableType.magic,
				},
				StackDamageMax: {
					type: VariableType.magic,
				},
				WithStacksDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['StackDuration'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Orianna', typeof IOrianna, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				ReducedDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	w: {
		derivedMS: ((progress, self) => self?.stats.value.variables.oriannaWBonusMS ?? calculateWMS(progress, self.champion.value!, self.abilityLevels.value.w)) satisfies IDeriveProgressFn,
		variables: defineChampionVariables<'Orianna', typeof IOrianna, 'w'>()({
			known: {
				BonusMS: [],
			},
			calculate(self) {
				return {
					BonusMS: {
						value: self.stats.value.variables.oriannaWBonusMS ?? 0,
					},
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				Slow: {
					type: VariableType.affectedBySlowResist,
				},
				BonusMS: {
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['FieldDuration', 'SlowAndHasteDuration'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Orianna', typeof IOrianna, 'e'>()({
			meta: {
				TotalDamageTooltip: {
					type: VariableType.magic,
				},
				TotalShieldTooltip: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['ShieldDuration'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Orianna', typeof IOrianna, 'r'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.wMSProgress) {
					const ms = calculateWMS(self.internalData.value.wMSProgress, self.champion.value!, self.abilityLevels.value.w);
					if (!Number.isNaN(ms)) {
						calculatedVariables.oriannaWBonusMS = ms;
						calculatedVariables.totalBonusPercentMoveSpeed += ms * 0.01;
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Orianna'>;
