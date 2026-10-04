import type IAkali from '@lolcalc/data/files/champion/Akali.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Akali', typeof IAkali, 'passive'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const bonusMSPercent = championAbilityVariableValue('PassiveSpeedBonus', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self });
					if (typeof bonusMSPercent.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += bonusMSPercent.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS akali] failed to calculate passive bonus ms', bonusMSPercent);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Akali'>;
