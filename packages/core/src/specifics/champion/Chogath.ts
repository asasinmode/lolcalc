import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IChogath from '@lolcalc/data/files/champion/Chogath.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return { ultStacks: Math.max(0, self.internalData.value.ultStacks ?? 0) };
	},
	passive: {
		variables: defineChampionVariables<'Chogath', typeof IChogath, 'passive'>()({
			meta: {
				ChogathCarnivoreHeal: {
					type: VariableType.heal,
				},
			},
		}),
	},
	q: {
		variables: defineChampionVariables<'Chogath', typeof IChogath, 'q'>()({
			meta: {
				TotalDamageTooltip: {
					type: VariableType.magic,
				},
				Effect2Amount: {
					type: VariableType.affectedBySlowResist,
					displayedName: 'SlowAmount',
				},
				Effect3Amount: {
					type: VariableType.affectedByTenacity,
					displayedName: 'SlowDuration',
				},
			},
			uninteresting: ['Effect5Amount'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Chogath', typeof IChogath, 'w'>()({
			meta: {
				Effect2Amount: {
					type: VariableType.affectedByTenacity,
					displayedName: 'SilenceDuration',
				},
				TotalDamageTooltip: {
					type: VariableType.magic,
				},
			},
		}),
	},
	e: {
		variables: defineChampionVariables<'Chogath', typeof IChogath, 'e'>()({
			known: {
				'{8682fc00}': [],
				'TotalDamage': [],
			},
			calculate(self, target) {
				const variableParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'e', abilityVariant: self.champion.value!.abilities.e.variants[0]!, damageSource: self, dynamicVariables: { values: { '{8682fc00}': { value: self.internalData.value.ultStacks } } } };
				const flat = championAbilityVariableValue('FlatDamageCalc', variableParams);
				const percent = championAbilityVariableValue('MaxHealthPercentCalc', variableParams);

				let TotalDamage = Number.NaN;

				if (typeof flat.value === 'number' && typeof percent.value === 'number') {
					TotalDamage = flat.value + (target ? Math.min(target.currentHealth.value, target.stats.value.total.hp) : 0) * percent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS chogath] failed to calculate E damage variables', flat, percent);
				}

				return {
					'{8682fc00}': {
						value: self.internalData.value.ultStacks,
					},
					'TotalDamage': {
						value: TotalDamage,
					},
				};
			},
			meta: {
				FlatDamageCalc: {
					type: VariableType.magic,
				},
				SlowAmountPercentage: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				MaxHealthPercentCalc: {
					type: VariableType.magic,
				},
				ModifiedMonsterCap: {
					type: VariableType.magic,
				},
				TotalDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
			},
			uninteresting: ['FeastStackMultiplier'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Chogath', typeof IChogath, 'r'>()({
			known: {
				f3: [],
				HealthFromStacks: [],
				Stacks: [],
			},
			calculate(self) {
				return {
					f3: { value: 0 },
					HealthFromStacks: {
						value: self.stats.value.championPassive.hp ?? 0,
					},
					Stacks: {
						value: self.internalData.value.ultStacks,
					},
				};
			},
			meta: {
				RDamage: {
					type: VariableType.true,
				},
				RMonsterDamage: {
					type: VariableType.true,
				},
				HealthFromStacks: {
					isCustom: true,
				},
				Stacks: {
					isCustom: true,
				},
			},
			uninteresting: ['f3', 'AttackRangePerStack', 'CastRangePerStack', 'MaxBonusAttackRange', 'MaxBonusCastRange', 'RMinionMaxStacks'],
		}),
	},
	calculateHooks: {
		postItemTotal: {
			handler(self, { championPassiveStats, itemTotalStats, itemPassivesStats }, { calculatedVariables }) {
				const params: IGameVariableValueParameters['championAbility'] = { abilityKey: 'r', abilityVariant: self.champion.value!.abilities.r.variants[0]!, damageSource: self };
				const hpPerStack = championAbilityVariableValue('RHealthPerStack', params);

				if (typeof hpPerStack.value === 'number') {
					const hp = hpPerStack.value * self.internalData.value.ultStacks;
					championPassiveStats.hp = hp;

					if (calculatedVariables.riftmakerBonusHPToAP) {
						const ap = hp * calculatedVariables.riftmakerBonusHPToAP;
						itemTotalStats.abilityPower += ap;
						itemPassivesStats.abilityPower += ap;
						calculatedVariables.riftmakerVoidInfusion! += ap;
						calculatedVariables.apMultipliersBase += ap;
						calculatedVariables.additionalAdaptiveForceCheckAp -= ap;
					}
				} else {
					console.warn('[CHAMPION_SPECIFICS chogath] failed to calculate hp per ult stack', hpPerStack);
				}

				const rangePerStack = championAbilityVariableValue('AttackRangePerStack', params);
				if (typeof rangePerStack.value === 'number') {
					championPassiveStats.attackRange = rangePerStack.value * self.internalData.value.ultStacks;
				} else {
					console.warn('[CHAMPION_SPECIFICS chogath] failed to calculate range per ult stack', rangePerStack);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Chogath'>;
