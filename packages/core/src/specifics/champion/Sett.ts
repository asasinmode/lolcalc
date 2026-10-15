import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ISett from '@lolcalc/data/files/champion/Sett.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Sett', typeof ISett, 'passive'>()({
			known: {
				HPRegen: [],
			},
			calculate(self) {
				return {
					HPRegen: {
						value: self.stats.value.championPassive.hpRegen ?? 0,
					},
				};
			},
			meta: {
				HPRegen: {
					isCustom: true,
					type: VariableType.hpRegen,
				},
				RightPunchBonus: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['MissingHealthUnit'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Sett', typeof ISett, 'w'>()({
			known: {
				f1: [],
				TotalCenterDamage: [],
				TotalSideDamage: [],
				TotalShield: [],
			},
			calculate(self) {
				let TotalDamage = Number.NaN;
				let TotalShield = Number.NaN;

				const currentGrit = Math.min(self.stats.value.variables.settMaxGrit ?? 0, self.currentAbilityResource.value);

				const wParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'w',
					abilityVariant: self.champion.value!.abilities.w.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('DamageCalc', wParams);
				const gritConversion = championAbilityVariableValue('DamageConversion', wParams);
				if (typeof gritConversion.value === 'number' && typeof baseDamage.value === 'number') {
					TotalDamage = baseDamage.value + gritConversion.value * currentGrit;
				} else {
					console.warn('[CHAMPION_SPECIFICS sett] failed to calculate w grit damage', baseDamage, gritConversion);
				}

				const shieldScaling = championAbilityVariableValue('ShieldConversion', wParams);
				if (typeof gritConversion.value === 'number') {
					TotalShield = currentGrit;
				} else {
					console.warn('[CHAMPION_SPECIFICS sett] failed to calculate w grit damage scaling', shieldScaling);
				}

				return {
					f1: {
						value: self.stats.value.variables.settMaxGrit ?? 0,
					},
					TotalCenterDamage: {
						value: TotalDamage,
					},
					TotalSideDamage: {
						value: TotalDamage,
					},
					TotalShield: {
						value: TotalShield,
					},
				};
			},
			meta: {
				f1: {
					displayedName: 'MaxDamage',
					type: VariableType.true,
				},
				DamageCalc: {
					type: VariableType.true,
				},
				TotalCenterDamage: {
					isCustom: true,
					type: VariableType.true,
				},
				TotalSideDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
				TotalShield: {
					isCustom: true,
					type: VariableType.shield,
				},
			},
			uninteresting: ['DamageStored', 'AdrenalineStorageWindow', 'ShieldConversion', 'ShieldMaxDuration'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, totalPreMultipliersStats, bonusStats, championPassiveStats }, { calculatedVariables }) {
				/* technically there's a MaxGrit W var but it's just half of hp so might as well do it by hand */
				calculatedVariables.settMaxGrit = totalStats.hp / 2;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				};
				const bonusHPRegen = championAbilityVariableValue('TooltipRegenPerMissingHealthCalc', passiveParams);
				const hpUnit = championAbilityVariableValue('MissingHealthUnit', passiveParams);
				if (typeof bonusHPRegen.value === 'number' && typeof hpUnit.value === 'number') {
					const missingHPPercent = Math.min(1, (totalStats.hp - Math.min(totalStats.hp, self.currentHealth.value)) / totalStats.hp);
					const regenPer5 = (missingHPPercent / hpUnit.value) * bonusHPRegen.value;
					championPassiveStats.hpRegen = regenPer5;
					totalPreMultipliersStats.hpRegen += championPassiveStats.hpRegen;
					totalStats.hpRegen += championPassiveStats.hpRegen;
					bonusStats.hpRegen += championPassiveStats.hpRegen;
				} else {
					console.warn('[CHAMPION_SPECIFICS sett] failed to calculate passive hp regen', bonusHPRegen, hpUnit);
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Sett,
		},
	},
} satisfies IChampionSpecific<'Sett'>;
