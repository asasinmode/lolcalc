import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IYunara from '@lolcalc/data/files/champion/Yunara.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Yunara', typeof IYunara, 'passive'>()({
			known: {
				AdditionalDamage: [],
			},
			calculate(self) {
				let AdditionalDamage = Number.NaN;

				const percent = championAbilityVariableValue('Calc_Damage_Amp', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof percent.value === 'number') {
					AdditionalDamage = self.stats.value.total.attackDamage * percent.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS yunara] failed to calculate passive additonal damage', percent);
				}

				return {
					AdditionalDamage: {
						value: AdditionalDamage,
					},
				};
			},
			meta: {
				AdditionalDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Yunara'>;
