import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IEkko from '@lolcalc/data/files/champion/Ekko.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Ekko', typeof IEkko, 'passive'>()({
			meta: {
				ThreeHitDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['SpeedDuration', 'LockoutTime', 'MonsterMod'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const ms = championAbilityVariableValue('BonusMS', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof ms.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += ms.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS ekko] failed to calculate passive ms');
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Ekko'>;
