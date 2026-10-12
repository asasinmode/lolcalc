import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ILillia from '@lolcalc/data/files/champion/Lillia.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Lillia', typeof ILillia, 'passive'>()({
			known: {
				DotDamage: [],
			},
			calculate(self, target) {
				let DotDamage = Number.NaN;

				const dotPercent = championAbilityVariableValue('DotPercentTooltip', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof dotPercent.value === 'number') {
					DotDamage = dotPercent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS lillia] failed to calculate passive percent dmg', dotPercent);
				}

				return {
					DotDamage: {
						value: DotDamage,
					},
				};
			},
			meta: {
				DotDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
				MonsterHealTT: {
					type: VariableType.heal,
				},
				ChampionHealTT: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['Duration', 'MonsterDamageCap', 'MultiHealMod'],
		}),
	},
} satisfies IChampionSpecific<'Lillia'>;
