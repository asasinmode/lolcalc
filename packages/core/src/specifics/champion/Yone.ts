import type IYone from '@lolcalc/data/files/champion/Yone.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables, windBrotherCalculateHooks } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Yone', typeof IYone, 'passive'>()({
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
				f2: {
					displayedName: 'BonusCritChance',
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				f3: {
					displayedName: 'BonusAD',
				},
			},
			uninteresting: ['YoneCritToAD', 'CritChanceMultiplier', 'MagicDamageSplit'],
		}),
	},
	q: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
	calculateHooks: windBrotherCalculateHooks('Yone'),
} satisfies IChampionSpecific<'Yone'>;
