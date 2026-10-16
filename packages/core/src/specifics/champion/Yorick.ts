import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IYorick from '@lolcalc/data/files/champion/Yorick.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Yorick', typeof IYorick, 'passive'>()({
			known: {
				GhoulMonsterDamage: [],
			},
			calculate(self) {
				let GhoulMonsterDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('YorickPassiveGhoulDamage', passiveParams);
				const monsterMod = championAbilityVariableValue('GhoulMonsterDamageMod', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof monsterMod.value === 'number') {
					GhoulMonsterDamage = baseDamage.value * monsterMod.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS yorick] failed to calculate passive ghoul monster damage', baseDamage, monsterMod);
				}

				return {
					GhoulMonsterDamage: {
						value: GhoulMonsterDamage,
					},
				};
			},
			meta: {
				YorickPassiveGhoulDamage: {
					type: VariableType.physical,
				},
				GhoulMonsterDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['YorickPassiveGhoulMax', 'YorickGhoulDamageReductionVsTowers', 'GhoulMonsterDamageMod', 'MeleeAttackDamageModifier', 'MinionDamageTakenMod', 'MonsterDamageTakenMod'],
		}),
	},
} satisfies IChampionSpecific<'Yorick'>;
