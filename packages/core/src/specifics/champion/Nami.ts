import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { STAT_ICON } from '@lolcalc/data';
import type INami from '@lolcalc/data/files/champion/Nami.json';
import type { IChampion } from '@lolcalc/data/types.js';
import { EffectObjectName } from '@lolcalc/shared';
import { clamp, roundNumber } from '@lolcalc/shared/utils.ts';
import { computed } from 'vue';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

function passiveCalculateMS(champion: IChampion, progress: number, totalAP: number): number {
	const bonusMS = championAbilityVariableValue('TotalMSBonus', {
		abilityKey: 'passive',
		abilityVariant: champion.abilities.passive.variants[0]!,
		damageSource: { stats: { value: { total: { abilityPower: totalAP } } } } as DamageSource,
	});

	if (typeof bonusMS.value === 'number') {
		return (bonusMS.value * progress) / 100;
	}

	console.warn('[CHAMPION_SPECIFICS nami] failed to calculate passive bonus MS', bonusMS);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 0), 100),
			passiveMSTotalAp: self.internalData.value.passiveMSTotalAp !== undefined ? Math.max(0, self.internalData.value.passiveMSTotalAp) : undefined,
		};
	},
	passive: {
		effectControls: {
			model: (self) =>
				computed({
					get() {
						return self.internalData.value.passiveMSTotalAp !== undefined;
					},
					set(value) {
						if (value) {
							self.internalData.value.passiveMSTotalAp = self.stats.value.total.abilityPower;
							const effect = self.getEffect(EffectObjectName.namiPSurgingTides)?.[0];
							if (effect) {
								effect.data.value[0] = 0;
							}
						} else {
							self.internalData.value.passiveMSTotalAp = undefined;
						}
					},
				}),
			refresh(self) {
				self.internalData.value.passiveMSTotalAp = self.stats.value.total.abilityPower;
			},
			currentlySnapshot(_effectData, self) {
				return `calculating using: <scaleap>%i:${STAT_ICON.abilityPower}% ${roundNumber(self.internalData.value.passiveMSTotalAp ?? 0, 3)}</scaleap>`;
			},
		},
		derivedMS: ((progress, self) => {
			return self?.stats.value.championPassive.moveSpeed ?? passiveCalculateMS(self.champion.value!, progress, self.stats.value.total.abilityPower);
		}) satisfies IDeriveProgressFn,
		calculateMS: passiveCalculateMS,
		variables: defineChampionVariables<'Nami', typeof INami, 'passive'>()({
			known: {
				BonusMS: [],
			},
			calculate(self) {
				return {
					BonusMS: {
						value: self.stats.value.championPassive.moveSpeed ?? 0,
					},
				};
			},
			meta: {
				BonusMS: {
					isCustom: true,
				},
			},
			uninteresting: ['BuffDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const { passiveMSProgress, passiveMSTotalAp } = self.internalData.value;
				if (passiveMSTotalAp === undefined) {
					return;
				}

				const bonusMS = passiveCalculateMS(self.champion.value!, passiveMSProgress, passiveMSTotalAp);

				if (!Number.isNaN(bonusMS)) {
					championPassiveStats.moveSpeed = bonusMS;
				}
			},
		},
	},
} satisfies IChampionSpecific<'Nami'>;
