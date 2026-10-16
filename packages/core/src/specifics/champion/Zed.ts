import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IZed from '@lolcalc/data/files/champion/Zed.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Zed', typeof IZed, 'passive'>()({
			known: {
				Damage: [],
				MonsterDamage: [],
			},
			calculate(self, target) {
				let Damage = Number.NaN;
				let MonsterDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const damagePercent = championAbilityVariableValue('MaxHPDamage', passiveParams);
				if (typeof damagePercent.value === 'number') {
					Damage = damagePercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS zed] failed to calculate passive damage percent', damagePercent);
				}

				const monsterMod = championAbilityVariableValue('MonsterDamageMod', passiveParams);
				if (typeof monsterMod.value === 'number') {
					MonsterDamage = Damage * monsterMod.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS zed] failed to calculate passive monster mod', monsterMod);
				}

				return {
					Damage: {
						value: Damage,
					},
					MonsterDamage: {
						value: MonsterDamage,
					},
				};
			},
			meta: {
				MaxHPDamage: {
					displayedName: 'MaxHPDamagePercent',
				},
				Damage: {
					isCustom: true,
					type: VariableType.magic,
				},
				MonsterDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['CurrentHealthThreshold', 'PerUnitCD', 'MonsterDamageMod', 'MonsterDamageCap'],
		}),
	},
} satisfies IChampionSpecific<'Zed'>;
