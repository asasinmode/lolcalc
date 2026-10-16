import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IXayah from '@lolcalc/data/files/champion/Xayah.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Xayah', typeof IXayah, 'passive'>()({
			known: {
				f12: [6],
				f14: [3],
				f16: [0],
				Damage: [],
			},
			/* the variables all seem to need manual resolving */
			calculate(self) {
				let Damage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const damagePercent = championAbilityVariableValue(self.level.value >= 13 ? 'PDamageFalloffMax' : self.level.value >= 7 ? 'PDamageFalloffMid' : 'PDamageFalloffMin', passiveParams);
				if (typeof damagePercent.value === 'number') {
					Damage = damagePercent.value * self.stats.value.total.attackDamage;
				} else {
					console.warn('[CHAMPION_SPECIFICS xayah] failed to calculate feather damage percent', damagePercent);
				}

				return {
					f12: championAbilityVariableValue('PFeatherDuration', passiveParams),
					f14: championAbilityVariableValue('PStacksPerCast', passiveParams),
					f16: damagePercent,
					Damage: {
						value: Damage,
					},
				};
			},
			meta: {
				f12: {
					displayedName: 'FeatherDuration',
				},
				f14: {
					displayedName: 'AttacksNumber',
				},
				f16: {
					displayedName: 'DamagePercent',
					isPercentage: true,
					multiplier: 100,
					calculatesFrom(params) {
						const passiveParams: IGameVariableValueParameters['championAbility'] = {
							abilityKey: 'passive',
							abilityVariant: params.abilityVariant,
						};
						const minDamage = championAbilityVariableValue('PDamageFalloffMin', passiveParams);
						const maxDamage = championAbilityVariableValue('PDamageFalloffMax', passiveParams);

						if (typeof minDamage.value === 'number' && typeof maxDamage.value === 'number') {
							return [
								{
									value: { min: minDamage.value, max: maxDamage.value },
									isPercentage: true,
									stat: 'level',
								},
							];
						} else {
							return [];
						}
					},
				},
				Damage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['f12', 'f14'],
		}),
	},
} satisfies IChampionSpecific<'Xayah'>;
