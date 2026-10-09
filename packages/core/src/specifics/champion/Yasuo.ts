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
