import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IDiana from '@lolcalc/data/files/champion/Diana.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveEmpowered: clamp(0, Math.round(self.internalData.value.isPassiveEmpowered ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Diana', typeof IDiana, 'passive'>()({
			meta: {
				CleaveDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['BuffDuration', 'MonsterMod'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const bonusAS = championAbilityVariableValue(self.internalData.value.isPassiveEmpowered ? 'EmpoweredAS' : 'BonusAS', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				});

				if (typeof bonusAS.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent = bonusAS.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS diana] failed to calculate passive AS', bonusAS);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Diana'>;
