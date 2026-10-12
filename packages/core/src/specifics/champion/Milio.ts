import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IMilio from '@lolcalc/data/files/champion/Milio.json';
import { VariableType } from '@lolcalc/shared';
import { toValue, computed } from 'vue';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveAllySourceId: self.internalData.value.passiveAllySourceId ?? '0',
			_passiveAllyAD: computed(() => {
				const id = self.internalData.value.passiveAllySourceId?.toString();
				if (!id || id === '0') return 0;
				const src = self.sourcesTargetsRef?.[0][1].value.find((s) => s.id === id) ?? self.sourcesTargetsRef?.[1][1].value.find((s) => s.id === id);
				if (!src) {
					console.warn('[CHAMPION_SPECIFICS milio] failed to find specified damage source', id);
					return 0;
				}
				return src.stats.value.total.attackDamage;
			}),
		};
	},
	passive: {
		variables: defineChampionVariables<'Milio', typeof IMilio, 'passive'>()({
			known: {
				TotalDamage: [],
			},
			calculate(self) {
				let TotalDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const adRatio = championAbilityVariableValue('ADBurstRatio', passiveParams);
				const burn = championAbilityVariableValue('BurnDamage', passiveParams);
				if (typeof adRatio.value === 'number' && typeof burn.value === 'number') {
					TotalDamage = burn.value + adRatio.value * toValue(self.internalData.value._passiveAllyAD);
				} else {
					console.warn('[CHAMPION_SPECIFICS milio] failed to calculate passive burn', adRatio, burn);
				}

				return {
					TotalDamage: {
						value: TotalDamage,
					},
				};
			},
			meta: {
				BurnDamage: {
					type: VariableType.magic,
				},
				TotalDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
			},
			uninteresting: ['BurnDuration'],
		}),
	},
} satisfies IChampionSpecific<'Milio'>;
