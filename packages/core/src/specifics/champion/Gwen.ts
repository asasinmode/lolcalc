import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IGwen from '@lolcalc/data/files/champion/Gwen.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Gwen', typeof IGwen, 'passive'>()({
			known: {
				'1000CutsDamage': [],
				Heal: [],
			},
			calculate(self, target) {
				let CutsDamage = Number.NaN;
				let Heal = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };
				const cutsPercent = championAbilityVariableValue('PercentHealth1000Cuts', passiveParams);
				if (typeof cutsPercent.value === 'number') {
					CutsDamage = cutsPercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS gwen] failed to calculate passive damage percent', cutsPercent);
				}

				const healPercent = championAbilityVariableValue('HealingPercent', passiveParams);
				const maxHeal = championAbilityVariableValue('healcap', passiveParams);
				if (typeof healPercent.value === 'number' && typeof maxHeal.value === 'number') {
					Heal = Math.min(maxHeal.value, healPercent.value * CutsDamage);
				} else {
					console.warn('[CHAMPION_SPECIFICS gwen] failed to calculate passive heal vars', healPercent, maxHeal);
				}

				return {
					'1000CutsDamage': {
						value: CutsDamage,
					},
					Heal: {
						value: Heal,
					},
				};
			},
			meta: {
				'1000CutsDamage': {
					isCustom: true,
					type: VariableType.magic,
				},
				Heal: {
					isCustom: true,
					type: VariableType.heal,
				},
				MonsterDamageCap: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['ExecuteThreshold', 'HealingPercent'],
		}),
	},
} satisfies IChampionSpecific<'Gwen'>;
