import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IDrMundo from '@lolcalc/data/files/champion/DrMundo.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'DrMundo', typeof IDrMundo, 'passive'>()({
			known: {
				HealthRegen: [],
				CannisterHpRestore: [],
			},
			calculate(self) {
				const cannisterPercentRestore = championAbilityVariableValue('MaxHealthGain', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				});
				let hpRestore = 0;
				if (typeof cannisterPercentRestore.value === 'number') {
					hpRestore = (cannisterPercentRestore.value as number) * self.stats.value.total.hp;
				} else {
					console.warn('[CHAMPION_SPECIFICS mundo] failed to calculate passive cannister hp restore percent', cannisterPercentRestore);
				}

				return {
					HealthRegen: {
						value: self.stats.value.championPassive.hpRegen ?? 0,
					},
					CannisterHpRestore: {
						value: hpRestore,
					},
				};
			},
			meta: {
				HealthRegen: {
					type: VariableType.hpRegen,
					isCustom: true,
				},
				CannisterHpRestore: {
					type: VariableType.heal,
					isCustom: true,
				},
			},
			uninteresting: ['CurrentHealthLoss', 'CannisterGroundDuration', 'PassiveCooldownRefund', 'MaxHealthGain'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, bonusStats, championPassiveStats }) {
				const maxHealthRegenPercent = championAbilityVariableValue('MaxHealthRegen', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				});
				if (typeof maxHealthRegenPercent.value === 'number') {
					championPassiveStats.hpRegen = maxHealthRegenPercent.value * totalStats.hp;
					bonusStats.hpRegen += championPassiveStats.hpRegen;
					totalStats.hpRegen += championPassiveStats.hpRegen;
				} else {
					console.warn('[CHAMPION_SPECIFICS mundo] failed to calculate passive max health regen percent', maxHealthRegenPercent);
				}
			},
			priority: HOOK_PRIORITIES.postTotal.DrMundo,
		},
	},
} satisfies IChampionSpecific<'DrMundo'>;
