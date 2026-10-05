import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IAkali from '@lolcalc/data/files/champion/Akali.json';
import type { IChampionSpecific } from '../champion.ts';
import type { IEffectControlsProps, IInternalItemDataOf } from '../index.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { ITEMS_BY_NAME, STAT_ICON } from '@lolcalc/data';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { computed } from 'vue';
import { defineChampionVariables } from './shared.ts';

function passivePreSnapshotRange(self: DamageSource<'Akali'>): number {
	const preMultipliersNoPassive = self.stats.value.totalPreMultipliers.attackRange - (self.internalData.value.passiveRangeSnapshot ?? 0);

	let rfcWithoutPassive = 0;
	if ((self.internalItemData.value as IInternalItemDataOf<'rfc'>)?.sharpshooter) {
		rfcWithoutPassive = Math.min(
			ITEMS_BY_NAME.rfc?.dataValues.MaxRangeIncrease,
			Math.floor(preMultipliersNoPassive * ITEMS_BY_NAME.rfc?.dataValues.RangePercentIncrease),
		);
	}

	return preMultipliersNoPassive + rfcWithoutPassive;
}

export default {
	setupData(self) {
		return {
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			passiveRangeSnapshot: Math.max(0, Math.round(self.internalData.value.passiveRangeSnapshot ?? 0)),
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
			model: self => computed({
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
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				championPassiveStats.attackRange = self.internalData.value.passiveRangeSnapshot;
			},
		},
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
