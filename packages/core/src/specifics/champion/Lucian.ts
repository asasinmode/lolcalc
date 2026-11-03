import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ILucian from '@lolcalc/data/files/champion/Lucian.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isWMSActive: clamp(0, Math.round(self.internalData.value.isWMSActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Lucian', typeof ILucian, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				MinionDamage: {
					type: VariableType.physical,
				},
				PassiveTotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['PassiveDuration', 'NumAuto', 'MaxAutos'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Lucian', typeof ILucian, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Lucian', typeof ILucian, 'w'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MoveSpeedAmount'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Lucian', typeof ILucian, 'e'>()({
			uninteresting: ['CDRefundBase', 'CDRefundChampion'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Lucian', typeof ILucian, 'r'>()({
			known: {},
			calculate() {
				return {};
			},
			meta: {
				TotalNumShots: {
					/* 26.21 doesn't show what it scales with */
					extendedEquals: undefined,
					scalesWithStatIcon: undefined,
				},
				TotalDamage: {
					type: VariableType.physical,
					/* 26.21 doesn't show what it scales with */
					extendedEquals: undefined,
					scalesWithStatIcon: undefined,
				},
				DamagePerBullet: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['Duration', 'CritValueMod', 'PercentDamageAmpToMinions'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.isWMSActive) {
					const ms = championAbilityVariableValue('MoveSpeedAmount', { abilityKey: 'w', abilityVariant: self.champion.value!.abilities.w.variants[0]!, abilityLevel: self.abilityLevels.value.w });
					if (typeof ms.value === 'number') {
						championPassiveStats.moveSpeed = ms.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS lucian] failed to calculate W ms', ms);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Lucian'>;
