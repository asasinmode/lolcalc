import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { ITEMS_BY_NAME, STAT_ICON } from '@lolcalc/data';
import type IAkali from '@lolcalc/data/files/champion/Akali.json';
import type { IChampion } from '@lolcalc/data/types.js';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { computed } from 'vue';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn, IEffectControlsProps, IInternalItemDataOf } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

function passivePreSnapshotRange(self: DamageSource<'Akali'>): number {
	const preMultipliersNoPassive = self.stats.value.totalPreMultipliers.attackRange - (self.internalData.value.passiveRangeSnapshot ?? 0);

	let rfcWithoutPassive = 0;
	if ((self.internalItemData.value as IInternalItemDataOf<'rfc'>)?.sharpshooter) {
		rfcWithoutPassive = Math.min(ITEMS_BY_NAME.rfc?.dataValues.MaxRangeIncrease, Math.floor(preMultipliersNoPassive * ITEMS_BY_NAME.rfc?.dataValues.RangePercentIncrease));
	}

	return preMultipliersNoPassive + rfcWithoutPassive;
}

function calculateWMS(progress: number, champion: IChampion, abilityLevel: number) {
	const msPercent = championAbilityVariableValue('MovementSpeed', {
		abilityKey: 'w',
		abilityVariant: champion.abilities.w.variants[0]!,
		abilityLevel,
	});

	if (typeof msPercent.value === 'number') {
		return msPercent.value * progress * 0.01;
	}

	console.warn('[CHAMPION_SPECIFICS akali] failed to calculate W bonus MS', msPercent);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			passiveRangeSnapshot: Math.max(0, Math.round(self.internalData.value.passiveRangeSnapshot ?? 0)),
			wMSProgress: clamp(0, Math.round(self.internalData.value.wMSProgress ?? 0), 100),
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
		extraControls: {
			model: (self) =>
				computed({
					get() {
						return self.internalData.value.passiveRangeSnapshot ? 1 : 0;
					},
					set(value) {
						if (value) {
							self.internalData.value.passiveRangeSnapshot = passivePreSnapshotRange(self);
						} else {
							self.internalData.value.passiveRangeSnapshot = undefined;
						}
					},
				}),
			refresh(self) {
				self.internalData.value.passiveRangeSnapshot = passivePreSnapshotRange(self);
			},
			currentlySnapshot(_effectData, self) {
				return `currently snapshot: <const>%i:${STAT_ICON.attackRange}% ${Math.floor(self.internalData.value.passiveRangeSnapshot ?? 0)}</const>`;
			},
		} satisfies IEffectControlsProps<[], 'Akali'>,
	},
	q: {
		variables: defineChampionVariables<'Akali', typeof IAkali, 'q'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				SlowPercentage: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
	w: {
		derivedMS: ((progress, self) => self?.stats.value.variables.akaliWBonusMS ?? calculateWMS(progress, self.champion.value!, self.abilityLevels.value.w)) satisfies IDeriveProgressFn,
		variables: defineChampionVariables<'Akali', typeof IAkali, 'w'>()({
			known: {
				BonusMS: [],
			},
			calculate(self) {
				return {
					BonusMS: {
						value: self.stats.value.variables.akaliWBonusMS ?? 0,
					},
				};
			},
			meta: {
				BonusMS: {
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['MovementSpeedDuration', 'EnergyRestore'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Akali', typeof IAkali, 'e'>()({
			meta: {
				E1Damage: {
					type: VariableType.magic,
				},
				E2DamageCalc: {
					type: VariableType.magic,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Akali', typeof IAkali, 'r'>()({
			known: {
				Cast2Damage: [],
			},
			calculate(self, target) {
				let Cast2Damage = Number.NaN;

				const rParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'r',
					abilityVariant: self.champion.value!.abilities.r.variants[0]!,
					damageSource: self,
				};
				const dmgMin = championAbilityVariableValue('Cast2DamageMin', rParams);
				const dmgMax = championAbilityVariableValue('Cast2DamageMax', rParams);
				const executeThreshold = championAbilityVariableValue('MaxExecuteThreshold', rParams);
				if (typeof dmgMin.value === 'number' && typeof dmgMax.value === 'number' && typeof executeThreshold.value === 'number') {
					const currentHPPercent = target ? Math.min(target.currentHealth.value, target.stats.value.total.hp) / target.stats.value.total.hp : 0;
					const dmgDiffMult = Math.min(1, (1 - currentHPPercent) / (1 - executeThreshold.value));
					Cast2Damage = dmgMin.value + dmgDiffMult * (dmgMax.value - dmgMin.value);
				} else {
					console.warn('[CHAMPION_SPECIFICS akali] failed to calculate R cast 2 damage vars', { dmgMin, dmgMax, executeThreshold });
				}

				return {
					Cast2Damage: {
						value: Cast2Damage,
					},
				};
			},
			meta: {
				Cast1Damage: {
					type: VariableType.magic,
				},
				Cast2DamageMin: {
					type: VariableType.magic,
				},
				Cast2DamageMax: {
					type: VariableType.magic,
				},
				Cast2Damage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['CooldownBetweenCasts', 'MaxExecuteThreshold'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				championPassiveStats.attackRange = self.internalData.value.passiveRangeSnapshot;
			},
		},
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const msPercent = championAbilityVariableValue('PassiveSpeedBonus', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
					if (typeof msPercent.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += msPercent.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS akali] failed to calculate passive ms', msPercent);
					}
				}
				if (self.internalData.value.wMSProgress) {
					const ms = calculateWMS(self.internalData.value.wMSProgress, self.champion.value!, self.abilityLevels.value.w);
					if (!Number.isNaN(ms)) {
						calculatedVariables.akaliWBonusMS = ms;
						calculatedVariables.totalBonusPercentMoveSpeed += ms * 0.01;
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Akali'>;
