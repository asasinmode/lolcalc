import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IPyke from '@lolcalc/data/files/champion/Pyke.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Pyke', typeof IPyke, 'passive'>()({
			known: {
				f1: [],
			},
			calculate(self) {
				return {
					f1: {
						value: self.stats.value.championPassive.attackDamage,
					},
				};
			},
			meta: {
				f1: {
					displayedName: 'BonusAD',
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Pyke', typeof IPyke, 'r'>()({
			known: {
				f9: [],
				f10: [],
			},
			calculate() {
				return {
					f9: { value: 0 },
					f10: { value: 0 },
				};
			},
			meta: {
				f1: {
					displayedName: 'BonusAD',
				},
				ReducedDamageFinal: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['f9', 'f10', 'RRecastDuration', 'ReducedDamage'],
		}),
	},
	calculateHooks: {
		preItemTotal: {
			handler(self, { championPassiveStats, itemPassivesStats, itemBaseStats }, { calculatedVariables }) {
				const hpToAd = championAbilityVariableValue('HPPerBAD', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: self,
				});

				if (typeof hpToAd.value === 'number') {
					calculatedVariables.pykePassiveHpToAd = hpToAd.value;
					const bonusHp = itemBaseStats.hp + itemPassivesStats.hp;
					championPassiveStats.attackDamage = bonusHp / calculatedVariables.pykePassiveHpToAd;

					itemBaseStats.hp = 0;
					itemPassivesStats.hp = 0;
				} else {
					console.warn('[CHAMPION_SPECIFICS pyke] failed to calculate passive hp to ad', hpToAd);
					calculatedVariables.pykePassiveHpToAd = 0;
				}
			},
			priority: HOOK_PRIORITIES.preItemTotal.Pyke,
		},
		preBonus: {
			handler(_self, { runeShardStats, championPassiveStats }, { calculatedVariables }) {
				if (runeShardStats.hp) {
					championPassiveStats.attackDamage! += runeShardStats.hp / calculatedVariables.pykePassiveHpToAd!;
					runeShardStats.hp = 0;
				}
			},
			priority: HOOK_PRIORITIES.preBonus.Pyke,
		},
	},
} satisfies IChampionSpecific<'Pyke'>;
