import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IBrand from '@lolcalc/data/files/champion/Brand.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Brand', typeof IBrand, 'passive'>()({
			known: {
				HealthDamage: [],
				CalculatedExplosionDamage: [],
			},
			calculate(self, target) {
				let HealthDamage = Number.NaN;
				let CalculatedExplosionDamage = Number.NaN;

				const burnPercent = championAbilityVariableValue('PercentHealthDamage', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof burnPercent.value === 'number') {
					HealthDamage = (burnPercent.value * (target?.stats.value.total.hp ?? 0)) / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS aurora] failed to calculate pasive proc percent dmg', burnPercent);
				}

				const explosionPercent = championAbilityVariableValue('ExplosionDamage', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof explosionPercent.value === 'number') {
					CalculatedExplosionDamage = explosionPercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS aurora] failed to calculate pasive proc percent dmg', explosionPercent);
				}

				return {
					HealthDamage: {
						value: HealthDamage,
					},
					CalculatedExplosionDamage: {
						value: CalculatedExplosionDamage,
					},
				};
			},
			meta: {
				HealthDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				ExplosionDamage: {
					displayedName: 'PercentExplosionDamage',
				},
				CalculatedExplosionDamage: {
					isCustom: true,
					type: VariableType.magic,
					displayedName: 'ExplosionDamage',
				},
			},
			uninteresting: ['JungleMonsterDPSCap', 'EpicMonsterDPSCap'],
		}),
	},
} satisfies IChampionSpecific<'Brand'>;
