import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ITeemo from '@lolcalc/data/files/champion/Teemo.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveASActive: clamp(0, Math.round(self.internalData.value.isPassiveASActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Teemo', typeof ITeemo, 'passive'>()({
			uninteresting: ['StealthCooldownDuration', 'AttackSpeedDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.isPassiveASActive) {
					const as = championAbilityVariableValue('BonusAttackSpeed', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
					if (typeof as.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = as.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS ekko] failed to calculate passive ms', as);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Teemo'>;
