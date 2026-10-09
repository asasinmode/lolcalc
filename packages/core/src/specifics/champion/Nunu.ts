import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type INunu from '@lolcalc/data/files/champion/Nunu.json';
import type { IChampion } from '@lolcalc/data/types.js';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

function passiveCalculateBuffs(champion: IChampion): {
	bonusMSPercent: number;
	bonusASPercent: number;
} {
	const moveSpeed = championAbilityVariableValue('MSIncrease', {
		abilityKey: 'passive',
		abilityVariant: champion.abilities.passive.variants[0]!,
	});
	const attackSpeed = championAbilityVariableValue('ASIncrease', {
		abilityKey: 'passive',
		abilityVariant: champion.abilities.passive.variants[0]!,
	});

	if (typeof moveSpeed.value === 'number' && typeof attackSpeed.value === 'number') {
		return {
			bonusMSPercent: moveSpeed.value,
			bonusASPercent: attackSpeed.value,
		};
	}

	console.warn('[CHAMPION_SPECIFICS nunu] failed to calculate passive move/attack speed', moveSpeed, attackSpeed);

	return { bonusMSPercent: Number.NaN, bonusASPercent: Number.NaN };
}

export default {
	setupData(self) {
		return {
			isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Nunu', typeof INunu, 'passive'>()({
			meta: {
				CleaveDamage: {
					type: VariableType.physical,
				},
			},
		}),
		calculateBuffs: passiveCalculateBuffs,
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				if (self.internalData.value.isPassiveActive) {
					const { bonusMSPercent, bonusASPercent } = passiveCalculateBuffs(self.champion.value!);
					championPassiveStats.bonusAttackSpeedPercent = bonusASPercent;
					calculatedVariables.totalBonusPercentMoveSpeed += bonusMSPercent;
				}
			},
		},
	},
	r: {
		variables: defineChampionVariables<'Nunu', typeof INunu, 'r'>()({
			meta: {
				MaximumDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Nunu'>;
