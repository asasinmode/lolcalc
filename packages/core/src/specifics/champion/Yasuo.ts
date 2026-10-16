import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { CONSTS } from '@lolcalc/data';
import type IYasuo from '@lolcalc/data/files/champion/Yasuo.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables, windBrotherCalculateHooks } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Yasuo', typeof IYasuo, 'passive'>()({
			known: {
				f2: [],
				f3: [],
			},
			calculate(self) {
				return {
					f2: {
						value: self.stats.value.championPassive.critChance ?? 0,
					},
					f3: {
						value: self.stats.value.championPassive.attackDamage,
					},
				};
			},
			meta: {
				ShieldValue: {
					type: VariableType.shield,
				},
				f2: {
					displayedName: 'BonusCritChance',
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				f3: {
					displayedName: 'BonusAD',
				},
				CurrentCritDamage: {
					calculatesFrom(params) {
						const variable = championAbilityVariableValue('CurrentCritDamage', params);
						const critDamageMod = championAbilityVariableValue('CritDamageMod', params);

						if (typeof variable.calculatesFrom?.[0]?.value === 'number' && typeof critDamageMod.value === 'number') {
							return [
								{
									stat: 'const',
									value: CONSTS.defaultCritDamageMult * critDamageMod.value,
									isPercentage: true,
								},
								variable.calculatesFrom[0],
							];
						} else {
							console.warn('[CHAMPION_SPECIFICS yasuo] failed to calculate passive current crit damage calculates from', variable, critDamageMod);
							return variable.calculatesFrom ?? [];
						}
					},
				},
			},
			uninteresting: ['YasuoCritToAD', 'CritChanceMultiplier'],
		}),
	},
	q: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
	e: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
	calculateHooks: windBrotherCalculateHooks('Yasuo'),
} satisfies IChampionSpecific<'Yasuo'>;
