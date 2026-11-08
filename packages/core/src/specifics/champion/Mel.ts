import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { calculatesFromPartExtendedEquals, championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { STAT_ICON } from '@lolcalc/data';
import type IMel from '@lolcalc/data/files/champion/Mel.json';
import { VariableType } from '@lolcalc/shared';
import { roundNumber } from '@lolcalc/shared/utils.ts';
import { computed } from 'vue';
import type { IChampionSpecific } from '../champion.ts';
import type { IEffectControlsProps } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			wMSTotalAP: self.internalData.value.wMSTotalAP !== undefined ? Math.max(0, self.internalData.value.wMSTotalAP) : undefined,
		};
	},
	passive: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'passive'>()({
			meta: {
				PassiveFlatDamage: {
					type: VariableType.magic,
				},
				PassiveStackDamage: {
					type: VariableType.magic,
				},
				PassiveBonusMissileDamage: {
					type: VariableType.magic,
				},
			},
			/* minion mod is from R */
			uninteresting: ['FlatMinionMod' as any, 'PassiveBonusMissiles', 'MaxPassiveBonusMissiles', 'OverwhelmDuration'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'q'>()({
			meta: {
				InitialDamage: {
					type: VariableType.magic,
				},
				SubsequentDamage: {
					type: VariableType.magic,
				},
				TotalDamageTT: {
					type: VariableType.magic,
					scalesWithStatIcon: undefined,
					/* on patch 26.19 different from what the game shows `= (60 const + (0.55 %i:ap%) + 29.5 const)` but I think it's better */
					extendedEquals(variableValueParams) {
						const projectiles = championAbilityVariableValue('Count', variableValueParams);
						const base = championAbilityVariableValue('InitialDamage', variableValueParams);
						const followup = championAbilityVariableValue('SubsequentDamage', variableValueParams);
						const projectilesCount = (projectiles.value as number) - 1;

						const constPart = (base.calculatesFrom?.[0]?.value as number) + (followup.calculatesFrom?.[0]?.value as number) * projectilesCount;
						const apPart = (base.calculatesFrom?.[1]?.value as number) + (followup.calculatesFrom?.[1]?.value as number) * projectilesCount;

						return `${calculatesFromPartExtendedEquals({ value: constPart, stat: 'const' })} + ${calculatesFromPartExtendedEquals({ value: apPart, stat: 'abilityPower', isPercentage: true })}`;
					},
				},
			},
			uninteresting: [],
		}),
	},
	w: {
		extraControls: {
			model: (self) =>
				computed({
					get() {
						return self.internalData.value.wMSTotalAP === undefined ? 0 : 1;
					},
					set(value) {
						if (value) {
							self.internalData.value.wMSTotalAP = self.stats.value.total.abilityPower;
						} else {
							self.internalData.value.wMSTotalAP = undefined;
						}
					},
				}),
			refresh(self) {
				self.internalData.value.wMSTotalAP = self.stats.value.total.abilityPower;
			},
			currentlySnapshot(_effectData, self) {
				return `calculating using: <scaleap>%i:${STAT_ICON.abilityPower}% ${self.stats.value.championPassive.moveSpeed === undefined ? self.stats.value.total.abilityPower : roundNumber(self.internalData.value.wMSTotalAP ?? 0, 3)}</scaleap>`;
			},
		} satisfies IEffectControlsProps<[], 'Mel'>,
		variables: defineChampionVariables<'Mel', typeof IMel, 'w'>()({
			meta: {
				InitialDamage: {
					type: VariableType.magic,
				},
				SubsequentDamage: {
					type: VariableType.magic,
				},
				TotalShield: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['BuffDuration', 'MaxRetaliation'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'e'>()({
			meta: {
				RootDurationMin: {
					type: VariableType.affectedByTenacity,
				},
				RootDurationMax: {
					type: VariableType.affectedByTenacity,
				},
				Damage: {
					type: VariableType.magic,
				},
				Slow: {
					type: VariableType.affectedBySlowResist,
				},
				AreaDamagePerSecond: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MinionModTooltip'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'r'>()({
			meta: {
				PassiveFlatDamage: {
					type: VariableType.magic,
				},
				PassiveStackDamage: {
					type: VariableType.magic,
				},
				UltFlatDamage: {
					type: VariableType.magic,
				},
				UltStackDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				const { wMSTotalAP } = self.internalData.value;
				if (wMSTotalAP === undefined) return;

				const ms = championAbilityVariableValue('TotalMS', {
					abilityKey: 'w',
					abilityVariant: self.champion.value!.abilities.w.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					abilityLevel: self.abilityLevels.value.w,
					damageSource: { level: { value: self.level.value }, stats: { value: { total: { abilityPower: wMSTotalAP } } } } as DamageSource,
				});
				if (typeof ms.value === 'number') {
					calculatedVariables.totalBonusPercentMoveSpeed += ms.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS mel] failed to calculate W ms', ms);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Mel'>;
