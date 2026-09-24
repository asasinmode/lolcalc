import type { IEffectData, TEffects } from '@lolcalc/data';
import type { IChampion, IChampionId } from '@lolcalc/data/types.js';
import type { IStatsCalculationEffectVars } from '@lolcalc/shared';
import type { DamageSource, ICalculateChampionStatsHookSource, IDamageSourceEffect } from '../DamageSource.ts';
import type { IEffectAbilityId, IGameAbilityId } from '../GameAbilityId.ts';
import type { DetectItemVariables } from '../types';
import type { IVariableModifyMeta } from '../variables/game.ts';
import type { IDeriveProgressFn, IEffectControlsProps, IExtraOnValueUpdate, IInternalDataOf, IInternalDragonDataOf, IInternalItemDataOf, ISelectEffectSourceProps, ISpecificVariables } from './index.ts';

import { CONSTS, EFFECTS, ITEMS_BY_NAME, STAT_ICON, useChampion } from '@lolcalc/data';
import { AbilityType, EffectObjectName, GRIEVOUS_WOUND_ITEMS, ITEM_NAME_TO_ID, VariableType } from '@lolcalc/shared';
import { clamp, roundNumber } from '@lolcalc/shared/utils.ts';
import { addMultiplicative, combineCompounding } from '../calculate/util.ts';
import { GameAbilityId } from '../GameAbilityId.ts';
import { championAbilityVariableValue, itemVariableValue } from '../variables/game.ts';
import { CHAMPION_SPECIFICS } from './champion.ts';
import { DRAGON_SPECIFICS } from './dragon.ts';
import { EFFECTS_META } from './effectsMeta.ts';
import { defineVariables, HOOK_PRIORITIES } from './index.ts';
import { ITEM_SPECIFICS } from './item.ts';

const MeleeRangedEnumOptions = {
	none: 0,
	melee: 1,
	ranged: 2,
};

/**
 * specific effects' helpers, utils and calculations
 * order of the keys matters for stringifying game ability id, if it changes it could warrant updating stringified state version
 */
export const EFFECT_SPECIFICS = {
	[EffectObjectName.ghost]: defineEffectSpecific<[ghost: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, _stats, { calculatedVariables }) {
					const bonusMs = championAbilityVariableValue('MovespeedMod', { abilityKey: 'passive', abilityVariant: (EFFECTS as TEffects)[EffectObjectName.ghost], allAbilitiesVariants: [], damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof bonusMs.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += bonusMs.value;
					} else {
						console.warn('[EFFECT_SPECIFICS ghost] failed to calculate bonus ms');
					}
				},
			},
		},
	}),
	[EffectObjectName.cleanse]: defineEffectSpecific<[cleanse: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { calculatedVariables }) {
					calculatedVariables.tenacityBucketB = addMultiplicative(
						calculatedVariables.tenacityBucketB,
						(EFFECTS as TEffects)[EffectObjectName.cleanse].dataValues.TenacityValue[1]!,
					);
				},
				priority: HOOK_PRIORITIES.onTotalPreMultipliers.cleanse,
			},
		},
	}),
	[EffectObjectName.heal]: defineEffectSpecific<[heal: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		calculateHooks: {
			preItemTotal: {
				handler(_self, _stats, { calculatedVariables }) {
					calculatedVariables.totalMultiplicativeMoveSpeed = combineCompounding(
						calculatedVariables.totalMultiplicativeMoveSpeed,
						(EFFECTS as TEffects)[EffectObjectName.heal].dataValues.MoveSpeed[1]!,
					);
				},
			},
		},
	}),
	[EffectObjectName.exhaust]: defineEffectSpecific<[exhaust: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		variables: defineVariables({
			known: {
				Slow: [],
				SlowDuration: [],
			},
			calculate() {
				return {
					Slow: {
						value: (EFFECTS as TEffects).summonerExhaust.dataValues.Slow[1],
					},
					SlowDuration: {
						value: (EFFECTS as TEffects).summonerExhaust.dataValues.DebuffDuration[1]!,
					},
				};
			},
			meta: {
				Slow: {
					type: VariableType.affectedBySlowResist,
					resultsIsPercentage: true,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs }) {
					const slow = (EFFECTS as TEffects).summonerExhaust.dataValues.Slow[1]! / 100;
					debuffs.percentageMSSlow.push(slow);
				},
			},
		},
	}),
	[EffectObjectName.hextechSoulSlow]: defineEffectSpecific<[taggedByLightning: number, isRanged?: number, bonusAD?: number, totalAP?: number, bonusHP?: number]>({
		setupData(data) {
			return [
				clamp(0, data?.[0] ?? 0, 100),
				data?.[1] !== undefined ? Math.max(0, data[1]) : undefined,
				Math.max(0, data?.[2] ?? 0),
				Math.max(0, data?.[3] ?? 0),
				Math.max(0, data?.[4] ?? 0),
			];
		},
		maxValue: 100,
		imgText(_data, self): number {
			return Math.round(self.stats.value.effectVars.hextechSoulSlow ?? 0);
		},
		variables: simpleSlowEffectVariables('hextechSoulSlow'),
		setupDataFromDragonData(damageSource) {
			const { hextechTagged } = damageSource.internalDragonData.value as IInternalDragonDataOf<'Hextech', 'soul'>;
			if (hextechTagged) {
				const { isRanged, total, bonus } = damageSource.stats.value;
				return [
					hextechTagged,
					isRanged ? 1 : 0,
					bonus.attackDamage,
					total.abilityPower,
					bonus.hp,
				];
			}
		},
		deriveProgressValue: (_value, self) => {
			return self?.stats.value.effectVars.hextechSoulSlow ?? 0;
		},
		sourceControls: {
			invalidMessage: (source) => {
				if (source.dragonSoul.value !== 'Hextech') {
					return 'hextech soul not set';
				}
			},
		},
		effectControls: {
			refresh(source) {
				const effect = source.getEffect(EffectObjectName.hextechSoulSlow)?.[0] ?? source.addEffect(GameAbilityId.build(AbilityType.effect, EffectObjectName.hextechSoulSlow), [100]);

				if (effect.source.value) {
					const { isRanged, bonus: { attackDamage, hp }, total: { abilityPower } } = effect.source.value.stats.value;
					effect.data.value[1] = isRanged ? 1 : isRanged === false ? 0 : undefined;
					effect.data.value[2] = attackDamage;
					effect.data.value[3] = abilityPower;
					effect.data.value[4] = hp;
				} else {
					effect.data.value[1] = undefined;
					effect.data.value[2] = 0;
					effect.data.value[3] = 0;
					effect.data.value[4] = 0;
				}
			},
			currentlySnapshot(effectData) {
				return `calculating using: <scalehealth>${roundNumber(effectData?.[4] ?? 0, 3)} bonus %i:${STAT_ICON.hp}%</scalehealth> | <scaleap>${roundNumber(effectData?.[3] ?? 0, 3)} %i:${STAT_ICON.abilityPower}%</scaleap> | <scalead>${roundNumber(effectData?.[2] ?? 0, 3)} bonus %i:${STAT_ICON.attackDamage}%</scalead>`;
			},
		},
		calculateHooks: {
			postInit: {
				handler(self, _stats, { debuffs, effectVars }) {
					const effect = self.getEffect(EffectObjectName.hextechSoulSlow)?.[0];
					if (effect) {
						const [progress, isRanged, bonusAD, totalAP, bonusHP] = effect.data.value;
						effectVars.hextechSoulSlow = DRAGON_SPECIFICS.Hextech.soul.calculateSlow(progress, isRanged === 1, bonusAD, totalAP, bonusHP);
						debuffs.percentageMSSlow.push(effectVars.hextechSoulSlow / 100);
					}
				},
			},
		},
	}),
	[EffectObjectName.stun]: defineEffectSpecific<[isStunned: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		// TODO unused for now, only rune unflinching will need it?
	}),
	[EffectObjectName.slowFlat]: defineEffectSpecific<[slowedByFlat: number]>({
		minValue: 0,
		maxValue: Number.POSITIVE_INFINITY,
		setupData(data) {
			return [Math.max(0, data?.[0] ?? 0)];
		},
		imgText(data) {
			return data[0];
		},
		calculateHooks: {
			postInit: {
				handler(self, _stats, { debuffs }) {
					const effect = self.getEffect(EffectObjectName.slowFlat)?.[0];
					if (effect?.data.value[0]) {
						debuffs.flatMSSlow.push(effect.data.value[0]);
					}
				},
			},
		},
	}),
	[EffectObjectName.slowPercent]: defineEffectSpecific<[slowedByPercent: number]>({
		setupData(data) {
			return [Math.max(0, data?.[0] ?? 0)];
		},
		imgText(data) {
			return `${data[0]}%`;
		},
		deriveProgressValue: value => value,
		variables: simpleSlowEffectVariables('lolcalcPercentSlow'),
		calculateHooks: {
			postInit: {
				handler(self, _stats, { debuffs, effectVars }) {
					const effect = self.getEffect(EffectObjectName.slowPercent)?.[0];
					if (effect?.data.value[0]) {
						effectVars.lolcalcPercentSlow = effect.data.value[0] / 100;
						debuffs.percentageMSSlow.push(effectVars.lolcalcPercentSlow);
					}
				},
			},
		},
	}),
	[EffectObjectName.grievousWounds]: defineEffectSpecific<[gWounds: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		appliedByItems: GRIEVOUS_WOUND_ITEMS.map(itemId => GameAbilityId.build(AbilityType.item, itemId)),
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'brambleVest'>).gWounds) {
				const item = damageSource.items.value.find(item => item && (GRIEVOUS_WOUND_ITEMS as string[]).includes(item.id));
				const strength = item?.dataValues?.GrievousAmount;
				if (strength !== CONSTS.defaultGrievous) {
					console.warn(`[EFFECT_SPECIFICS ${EffectObjectName.grievousWounds}] grievous wounds item gives a different than default grievous value`, item);
				}
				return [1];
			}
		},
		onValueUpdate(value, self) {
			if (value) {
				const effect = self.getEffect(EffectObjectName.grievousWoundsPercent)?.[0];
				if (effect) {
					effect.data.value[0] = 0;
				}
			}
		},
		modifyVariable: {
			type: [VariableType.heal, VariableType.hpRegen],
			handler(value) {
				return value * (typeof value === 'number' ? (1 - CONSTS.defaultGrievous) : 1);
			},
		},
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs }) {
					debuffs.grievousWounds = CONSTS.defaultGrievous;
				},
			},
		},
	}),
	[EffectObjectName.grievousWoundsPercent]: defineEffectSpecific<[gWounds: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 100)];
		},
		imgText(data) {
			return `${data[0]}%`;
		},
		deriveProgressValue: value => value,
		onValueUpdate(value, self) {
			if (value) {
				const effect = self.getEffect(EffectObjectName.grievousWounds)?.[0];
				if (effect) {
					effect.data.value[0] = 0;
				}
			}
		},
		modifyVariable: {
			type: [VariableType.heal, VariableType.hpRegen],
			handler(value, _meta, effectData) {
				return value * (typeof value === 'number' ? (1 - effectData[0] / 100) : 1);
			},
		},
		calculateHooks: {
			postInit: {
				handler(self, _stats, { debuffs }) {
					const effect = self.getEffect(EffectObjectName.grievousWoundsPercent)?.[0];
					if (effect) {
						debuffs.grievousWounds = effect.data.value[0] / 100;
					}
				},
			},
		},
	}),
	[EffectObjectName.shurelyaInspiringSpeech]: defineEffectSpecific<[isInspired: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, _args, { calculatedVariables }) {
					/* checked and it doesn't stack */
					if (!(self.internalItemData.value as IInternalItemDataOf<'shurelya'>).iSpeech) {
						calculatedVariables.totalBonusPercentMoveSpeed += ITEMS_BY_NAME.shurelya?.dataValues.ActiveMoveSpeed;
					}
				},
			},
		},
	}),
	[EffectObjectName.ardentSanctify]: defineEffectSpecific<[isSanctified: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }) {
					if (!(self.internalItemData.value as IInternalItemDataOf<'ardentCenser'>).sanctify) {
						ITEM_SPECIFICS[ITEM_NAME_TO_ID.ardentCenser].calculatePassive(itemPassivesStats);
					}
				},
			},
		},
	}),
	[EffectObjectName.flowingWaterRapids]: defineEffectSpecific<[isRapidsed: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { effectStats }, { calculatedVariables }) {
					if (!(self.internalItemData.value as IInternalItemDataOf<'staffOfFlowingWater'>).rapids) {
						ITEM_SPECIFICS[ITEM_NAME_TO_ID.staffOfFlowingWater].calculatePassive(effectStats, calculatedVariables);
					}
				},
			},
		},
	}),
	[EffectObjectName.bandlepipesFanfare]: defineEffectSpecific<[fanfare: number]>({
		setupData(data): [fanfare: number] {
			return [clamp(0, data?.[0] ?? 0, MeleeRangedEnumOptions.ranged)];
		},
		imgText(data) {
			return data[0] === MeleeRangedEnumOptions.melee ? 'm' : data[0] === MeleeRangedEnumOptions.ranged ? 'r' : '';
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { effectStats }) {
					/* checked and it doesn't stack */
					if ((self.internalItemData.value as IInternalItemDataOf<'bandlepipes'>).fanfare) {
						return;
					}

					const effect = self.getEffect(EffectObjectName.bandlepipesFanfare);
					const attackSpeed = itemVariableValue('AuraAttackSpeed', { item: ITEMS_BY_NAME.bandlepipes, isRanged: effect?.[0].data.value[0] === MeleeRangedEnumOptions.ranged });
					if (typeof attackSpeed.value === 'number') {
						effectStats.bonusAttackSpeedPercent += attackSpeed.value;
					} else {
						console.warn('[EFFECT_SPECIFICS Bandlepipes] failed to calculate bonus attack speed');
					}
				},
			},
		},
		enumOptions: MeleeRangedEnumOptions,
		maxValue: MeleeRangedEnumOptions.ranged,
	}),
	[EffectObjectName.knightsVowSacrifice]: defineEffectSpecific<[hasSacrifice: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
	}),
	[EffectObjectName.frozenHeartWintersCaress]: defineEffectSpecific<[wCaressed: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'frozenHeart'>).wCaress) {
				return [1];
			}
		},
		variables: defineVariables({
			known: {
				AttackSpeedReduction: [],
			},
			calculate(self) {
				return {
					AttackSpeedReduction: {
						value: self.stats.value.variables.frozenHeartCaress ?? 0,
					},
				};
			},
			meta: {
				AttackSpeedReduction: {
					isCustom: true,
				},
			},
		}),
		calculateHooks: {
			preItemTotal: {
				handler(_self, _stats, { calculatedVariables, debuffs, miscDebug }) {
					/* set here to multiplier, then in postTotal calculated into actual attack speed reduction */
					calculatedVariables.frozenHeartCaress = -1 * ITEMS_BY_NAME.frozenHeart?.dataValues.ASPDSlow;
					debuffs.cripple = addMultiplicative(debuffs.cripple, calculatedVariables.frozenHeartCaress);
					miscDebug.totalAdditiveCripple += calculatedVariables.frozenHeartCaress;
				},
			},
			postTotal: {
				handler(_self, _stats, { calculatedVariables, debuffs, miscDebug }) {
					calculatedVariables.frozenHeartCaress = debuffs.totalCrippledAttackSpeed * calculatedVariables.frozenHeartCaress! / (miscDebug.totalAdditiveCripple || 1);
				},
				priority: HOOK_PRIORITIES.postTotal.recordKeeping,
			},
		},
	}),
	[EffectObjectName.serpentsFangVenom]: defineEffectSpecific<[shieldReavedBy: number]>({
		setupData(data): [shieldReavedBy: number] {
			return [clamp(0, data?.[0] ?? 0, MeleeRangedEnumOptions.ranged)];
		},
		imgText(data) {
			return data[0] === MeleeRangedEnumOptions.melee ? 'm' : data[0] === MeleeRangedEnumOptions.ranged ? 'r' : '';
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'serpentsFang'>).sVenom) {
				return [damageSource.stats.value.isRanged ? MeleeRangedEnumOptions.ranged : MeleeRangedEnumOptions.melee];
			}
		},
		modifyVariable: {
			type: [VariableType.shield],
			handler(value, _meta, effectData) {
				if (typeof value === 'number') {
					const reducePercentage = itemVariableValue(
							'ShieldWoundMeleeRangedSplit' satisfies DetectItemVariables<typeof ITEMS_BY_NAME['serpentsFang']>,
							{ item: ITEMS_BY_NAME.serpentsFang, isRanged: effectData[0] === MeleeRangedEnumOptions.ranged },
					);
					value *= 1 - (reducePercentage.value as number / 100);
				}

				return value;
			},
		},
		enumOptions: MeleeRangedEnumOptions,
		maxValue: MeleeRangedEnumOptions.ranged,
	}),
	[EffectObjectName.rylaisRimefrost]: defineEffectSpecific<[isRimefrosted: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'rylaisScepter'>).rimefrost) {
				return [1];
			}
		},
		variables: simpleSlowEffectVariables('rylaiSlow'),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs, effectVars }) {
					effectVars.rylaiSlow = ITEMS_BY_NAME.rylaisScepter?.dataValues.SlowAmount;
					debuffs.percentageMSSlow.push(effectVars.rylaiSlow);
				},
			},
		},
	}),
	[EffectObjectName.abyssalMaskUnmake]: defineEffectSpecific<[isUnmade: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'abyssalMask'>).unmake) {
				return [1];
			}
		},
	}),
	[EffectObjectName.horizonFocusHypershot]: defineEffectSpecific<[isHypershot: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'horizonFocus'>).hypershot) {
				return [1];
			}
		},
	}),
	[EffectObjectName.bloodletterVileDecay]: {
		...defineEffectSpecific<[vileDecayStacks: number]>({
			setupData(data): [vileDecayStacks: number] {
				return [
					clamp(0, data?.[0] ?? 0, EFFECT_SPECIFICS[EffectObjectName.bloodletterVileDecay].maxValue()),
				];
			},
			imgText(data) {
				return data[0];
			},
			setupDataFromSourceItem(damageSource) {
				if ((damageSource.internalItemData.value as IInternalItemDataOf<'bloodlettersCurse'>).vDecay) {
					return [(damageSource.internalItemData.value as IInternalItemDataOf<'bloodlettersCurse'>).vDecay];
				}
			},
			variables: defineVariables({
				known: {
					Shred: [],
					MagicResistShredded: [],
				},
				calculate(self) {
					return {
						Shred: {
							value: self.stats.value.debuffs.percentageMRShred ?? 0,
						},
						MagicResistShredded: {
							value: self.stats.value.debuffs.shreddedMR ?? 0,
						},
					};
				},
				meta: {
					Shred: {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
					MagicResistShredded: {
						isCustom: true,
					},
				},
			}),
			calculateHooks: {
				postInit: {
					handler(self, _stats, { debuffs }) {
						const effect = self.getEffect(EffectObjectName.bloodletterVileDecay)?.[0];
						if (effect) {
							debuffs.percentageMRShred += effect.data.value[0] * ITEMS_BY_NAME.bloodlettersCurse?.dataValues.ShredPerStack;
						}
					},
				},
			},
		}),
		maxValue: () => ITEM_SPECIFICS[ITEM_NAME_TO_ID.bloodlettersCurse].MAX_STACKS,
	},
	[EffectObjectName.blackCleaverCarve]: defineEffectSpecific<[carveStacks: number]>({
		maxValue: () => ITEM_SPECIFICS[ITEM_NAME_TO_ID.blackCleaver].MAX_STACKS,
		setupData(data): [carveStacks: number] {
			return [
				clamp(0, data?.[0] ?? 0, (EFFECT_SPECIFICS[EffectObjectName.blackCleaverCarve].maxValue! as () => number)()),
			];
		},
		imgText(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'blackCleaver'>).carve) {
				return [(damageSource.internalItemData.value as IInternalItemDataOf<'blackCleaver'>).carve];
			}
		},
		variables: defineVariables({
			known: {
				Shred: [],
				ArmorShredded: [],
			},
			calculate(self) {
				return {
					Shred: {
						value: self.stats.value.debuffs.percentageArmorShred ?? 0,
					},
					ArmorShredded: {
						value: self.stats.value.debuffs.shreddedArmor ?? 0,
					},
				};
			},
			meta: {
				Shred: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				ArmorShredded: {
					isCustom: true,
				},
			},
		}),
		calculateHooks: {
			postInit: {
				handler(self, _stats, { debuffs }) {
					const effect = self.getEffect(EffectObjectName.blackCleaverCarve)?.[0];
					if (effect) {
						debuffs.percentageArmorShred += effect.data.value[0] * ITEMS_BY_NAME.blackCleaver?.dataValues.ShredPerStack;
					}
				},
			},
		},
	}),
	[EffectObjectName.botrkClawingShadows]: defineEffectSpecific<[isClawed: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'botrk'>).cShadows) {
				return [1];
			}
		},
		variables: simpleSlowEffectVariables('botrkSlow'),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs, effectVars }) {
					effectVars.botrkSlow = ITEMS_BY_NAME.botrk?.dataValues.MoveSpeedMod * -1;
					debuffs.percentageMSSlow.push(effectVars.botrkSlow);
				},
			},
		},
	}),
	[EffectObjectName.zekesConvergenceFrostfireTempest]: defineEffectSpecific<[fTempested: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'zekesConvergence'>).fTempest) {
				return [1];
			}
		},
		variables: simpleSlowEffectVariables('zekesConvergenceSlow'),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs, effectVars }) {
					effectVars.zekesConvergenceSlow = ITEMS_BY_NAME.zekesConvergence?.dataValues.SlowAmount;
					debuffs.percentageMSSlow.push(effectVars.zekesConvergenceSlow);
				},
			},
		},
	}),
	[EffectObjectName.celestialOppositionBlessingShattered]: defineEffectSpecific<[mBlessingShattered: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'celestialOpposition'>).mbSlow) {
				return [1];
			}
		},
		variables: simpleSlowEffectVariables('celestialOppositionSlow'),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs, effectVars }) {
					effectVars.celestialOppositionSlow = ITEMS_BY_NAME.celestialOpposition?.dataValues.SlowAmount;
					debuffs.percentageMSSlow.push(effectVars.celestialOppositionSlow);
				},
			},
		},
	}),
	[EffectObjectName.randuinsHumility]: defineEffectSpecific<[humiliated: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'randuinsOmen'>).humility) {
				return [1];
			}
		},
		variables: simpleSlowEffectVariables('randuinSlow'),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs, effectVars }) {
					effectVars.randuinSlow = ITEMS_BY_NAME.randuinsOmen?.dataValues.SlowAmount;
					debuffs.percentageMSSlow.push(effectVars.randuinSlow);
				},
			},
		},
	}),
	[EffectObjectName.malignanceHatefog]: defineEffectSpecific<[hatefogged: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'malignance'>).hatefog) {
				return [1];
			}
		},
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs }) {
					const mrReduction = itemVariableValue('MagicResistanceShred', { item: ITEMS_BY_NAME.malignance });
					if (typeof mrReduction.value === 'number') {
						debuffs.flatMRShred += mrReduction.value;
					} else {
						console.warn(`[EFFECT_SPECIFICS ${EffectObjectName.malignanceHatefog}] failed to calculate flat mr reduction`, mrReduction);
					}
				},
			},
		},
	}),
	[EffectObjectName.imperialMandateCommand]: defineEffectSpecific<[commanded: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'imperialMandate'>).command) {
				return [1];
			}
		},
	}),
	[EffectObjectName.stridebreakerBShockwaveSlow]: defineEffectSpecific<[bShockwaved: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'stridebreaker'>).tBShockwave) {
				return [1];
			}
		},
		variables: simpleSlowEffectVariables('stridebreakerSlow'),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs, effectVars }) {
					effectVars.stridebreakerSlow = ITEMS_BY_NAME.stridebreaker?.dataValues.MSSlow * -1;
					debuffs.percentageMSSlow.push(effectVars.stridebreakerSlow);
				},
			},
		},
	}),
	[EffectObjectName.icebornGauntletFrostField]: defineEffectSpecific<[frostField: number]>({
		setupData(data): [frostField: number] {
			return [clamp(0, data?.[0] ?? 0, MeleeRangedEnumOptions.ranged)];
		},
		imgText(data) {
			return data[0] === MeleeRangedEnumOptions.melee ? 'm' : data[0] === MeleeRangedEnumOptions.ranged ? 'r' : '';
		},
		setupDataFromSourceItem(damageSource): [frostField: number] | undefined {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'icebornGauntlet'>).frostField) {
				return [damageSource.stats.value.isRanged ? MeleeRangedEnumOptions.ranged : MeleeRangedEnumOptions.melee];
			}
		},
		enumOptions: MeleeRangedEnumOptions,
		maxValue: MeleeRangedEnumOptions.ranged,
		variables: simpleSlowEffectVariables('icebornGauntletSlow'),
		calculateHooks: {
			postInit: {
				handler(self, _stats, { debuffs, effectVars }) {
					const effect = self.getEffect(EffectObjectName.icebornGauntletFrostField)?.[0];
					const slow = itemVariableValue('SlowAmountMeleeRangedSplit', { item: ITEMS_BY_NAME.icebornGauntlet, isRanged: effect?.data.value[0] === MeleeRangedEnumOptions.ranged });
					if (typeof slow.value === 'number') {
						effectVars.icebornGauntletSlow = slow.value;
						debuffs.percentageMSSlow.push(effectVars.icebornGauntletSlow);
					} else {
						console.warn(`[EFFECT_SPECIFICS ${EffectObjectName.icebornGauntletFrostField}] failed to calculate slow`, slow);
					}
				},
			},
		},
	}),
	[EffectObjectName.bloodsongSpellbladed]: defineEffectSpecific<[bloodsonged: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'bloodsong'>).bloodsonged) {
				return [1];
			}
		},
	}),
	[EffectObjectName.seryldaBitterCold]: defineEffectSpecific<[bitterCold: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'seryldasGrudge'>).bitterCold) {
				return [1];
			}
		},
		componentTooltip: 'The slow will be applied regardless of the target\'s current hp',
		variables: simpleSlowEffectVariables('seryldaSlow'),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs, effectVars }) {
					effectVars.seryldaSlow = ITEMS_BY_NAME.seryldasGrudge?.dataValues.SlowAmount;
					debuffs.percentageMSSlow.push(effectVars.seryldaSlow);
				},
			},
		},
	}),
	[EffectObjectName.gunbladeLightningBolt]: defineEffectSpecific<[lightningBolt: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'hextechGunblade'>).lBolt) {
				return [1];
			}
		},
		variables: simpleSlowEffectVariables('hextechGunbladeSlow'),
		calculateHooks: {
			postInit: {
				handler(_self, _stats, { debuffs, effectVars }) {
					effectVars.hextechGunbladeSlow = ITEMS_BY_NAME.hextechGunblade?.dataValues.SlowAmount;
					debuffs.percentageMSSlow.push(effectVars.hextechGunbladeSlow);
				},
			},
		},
	}),
	[EffectObjectName.amumuPCursedTouch]: defineEffectSpecific<[isCursed: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
	}),
	[EffectObjectName.jannaPTailwind]: defineEffectSpecific<[isTailwinded: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		calculateHooks: {
			postInit: {
				handler(self, _stats, { calculatedVariables }) {
					const effect = self.getEffect(EffectObjectName.jannaPTailwind)?.[0];
					if (effect?.champion.value?.id === 'Janna') {
						const bonusMS = championAbilityVariableValue('MSPercentAlly', { abilityKey: 'passive', abilityVariant: (effect.champion.value as IChampion).abilities.passive.variants[0]! });
						if (typeof bonusMS.value === 'number') {
							calculatedVariables.totalBonusPercentMoveSpeed += bonusMS.value;
						} else {
							console.warn(`[EFFECT_SPECIFICS ${EffectObjectName.jannaPTailwind}] failed to calculate passive ms`, bonusMS);
						}
					}
				},
			},
		},
	}),
	[EffectObjectName.ashePFrostShot]: defineEffectSpecific<[frostShot: number]>({
		enumOptions: {
			'none': 0,
			'normal attack': 1,
			'critical strike': 2,
		},
		maxValue: 2,
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 2)];
		},
		imgText(_data, self) {
			return `${Math.round((self.stats.value.effectVars.ashePSlow ?? 0) * 100)}%`;
		},
		setupDataFromInternalData(damageSource) {
			return [(damageSource.internalData.value as IInternalDataOf<'Ashe'>).frostShot];
		},
		watch(effect) {
			return effect.source.value?.level.value;
		},
		sourceControls: {
			invalidMessage: (source) => {
				if (source.listedChampion.value?.id !== 'Ashe' satisfies IChampionId) {
					return 'it\'s not Ashe';
				}
			},
		},
		variables: simpleSlowEffectVariables('ashePSlow'),
		calculateHooks: {
			postInit: {
				handler(self, _stats, { effectVars, debuffs }) {
					const effect = self.getEffect(EffectObjectName.ashePFrostShot)?.[0];
					if (effect?.champion.value?.id === 'Ashe') {
						const slow = championAbilityVariableValue(effect.data.value?.[0] === 2 ? 'EmpoweredSlowAmount' : 'SlowAmount', { abilityKey: 'passive', abilityVariant: (effect.champion.value as IChampion).abilities.passive.variants[0]!, damageSource: { level: { value: effect.source.value?.level.value ?? 1 } } as DamageSource });
						if (typeof slow.value === 'number') {
							effectVars.ashePSlow = slow.value;
							debuffs.percentageMSSlow.push(slow.value);
						} else {
							console.warn(`[EFFECT_SPECIFICS ${EffectObjectName.ashePFrostShot}] failed to calculate passive slow`, slow);
						}
					}
				},
			},
		},
	}),
	[EffectObjectName.nunuPCallOfFreljord]: defineEffectSpecific<[isCalledByFreljord: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		calculateHooks: {
			postInit: {
				handler(self, { effectStats }, { calculatedVariables }) {
					if ((self.internalData.value as IInternalDataOf<'Nunu'>).isPassiveActive) {
						return;
					}

					const effect = self.getEffect(EffectObjectName.nunuPCallOfFreljord)?.[0];
					if (effect?.champion.value?.id === 'Nunu') {
						const { bonusASPercent, bonusMSPercent } = CHAMPION_SPECIFICS.Nunu.passive.passiveBuffs(effect.champion.value as IChampion);
						effectStats.bonusAttackSpeedPercent += bonusASPercent;
						calculatedVariables.totalBonusPercentMoveSpeed += bonusMSPercent;
					}
				},
			},
		},
	}),
	[EffectObjectName.ornnPLivingForge]: defineEffectSpecific<[livingForgeItemSlot: number]>({
		setupData(data): [livingForgeItemSlot: number] {
			return [clamp(0, data?.[0] ?? 1, 6)];
		},
		imgText(data) {
			return data[0];
		},
		enumOptions: {
			none: 0,
			1: 1,
			2: 2,
			3: 3,
			4: 4,
			5: 5,
			6: 6,
		},
		maxValue: 6,
	}),
	[EffectObjectName.rellPBreakMold]: {
		...defineEffectSpecific<[breakTheMoldStacks: number, totalArmor?: number, totalMR?: number]>({
			async setupData(data, self): Promise<[number, number | undefined, number | undefined]> {
				const { armor, magicResist } = self.stats.value.total;
				return [
					clamp(0, data?.[0] ?? 0, await EFFECT_SPECIFICS[EffectObjectName.rellPBreakMold].maxValue()),
					data?.[1] ?? armor,
					data?.[2] ?? magicResist,
				];
			},
			imgText(data) {
				return data[0];
			},
			setupDataFromInternalData(damageSource, self): [number, number | undefined, number | undefined] | undefined {
				const { passiveStacksOnTarget } = damageSource.internalData.value as IInternalDataOf<'Rell'>;
				if (passiveStacksOnTarget) {
					const selfEffect = self.getEffect(EffectObjectName.rellPBreakMold)?.[0];
					const snapshotSource = selfEffect?.data.value ?? [];
					return [passiveStacksOnTarget, snapshotSource?.[1] ?? self.stats.value.total.armor, snapshotSource?.[2] ?? self.stats.value.total.magicResist] as [number, number, number];
				}
			},
			effectControls: {
				refresh(source, isSourceChange) {
					let effect = source.getEffect(EffectObjectName.rellPBreakMold)?.[0];
					const addedEffect = !effect;
					if (!effect) {
						effect = source.addEffect(GameAbilityId.build(AbilityType.effect, EffectObjectName.rellPBreakMold));
						effect.newDataPromise?.then((effect) => {
							effect!.data.value[0] = CHAMPION_SPECIFICS.Rell.MAX_PASSIVE_STACKS({ champion: { value: effect!.champion.value as IChampion } } as DamageSource);
						});
					};

					if (addedEffect || !isSourceChange || effect.data.value[1] === undefined || effect.data.value[2] === undefined) {
						const { total: { armor, magicResist } } = source.stats.value;
						effect.data.value[1] = armor;
						effect.data.value[2] = magicResist;
					}
				},
				currentlySnapshot(effectData) {
					return `stealing from: <scalearmor>%i:${STAT_ICON.armor}% ${roundNumber(effectData?.[1] ?? 0, 3)}</scalearmor> | <scalemr>%i:${STAT_ICON.magicResist}% ${roundNumber(effectData?.[2] ?? 0, 3)}</scalemr>`;
				},
			},
			sourceControls: {
				invalidMessage: (source) => {
					if (source.listedChampion.value?.id !== 'Rell' satisfies IChampionId) {
						return 'it\'s not Rell';
					}
				},
			},
			variables: defineVariables({
				known: {
					ResistStealPercent: [],
					StolenArmor: [],
					StolenMagicResist: [],
				},
				calculate(self) {
					return {
						ResistStealPercent: {
							value: self.stats.value.effectVars.rellPResistsStealPercent ?? 0,
						},
						StolenArmor: {
							value: self.stats.value.effectVars.rellPArmorStolen ?? 0,
						},
						StolenMagicResist: {
							value: self.stats.value.effectVars.rellPMRStolen ?? 0,
						},
					};
				},
				meta: {
					ResistStealPercent: {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
					StolenArmor: {
						isCustom: true,
					},
					StolenMagicResist: {
						isCustom: true,
					},
				},
			}),
			calculateHooks: {
				postInit: {
					handler(self, { bonusStats }, { effectVars }) {
						const effect = self.getEffect(EffectObjectName.rellPBreakMold)?.[0];
						if (!effect || effect.champion.value?.id !== 'Rell') {
							return;
						}

						const { stealPercent, stolenArmor, stolenMR } = CHAMPION_SPECIFICS.Rell.passive.stolenResists(effect.data.value, effect.champion.value as IChampion, effect.source.value?.level.value);
						effectVars.rellPResistsStealPercent = stealPercent;
						effectVars.rellPArmorStolen = stolenArmor;
						effectVars.rellPMRStolen = stolenMR;
						bonusStats.armor -= effectVars.rellPArmorStolen;
						bonusStats.magicResist -= effectVars.rellPMRStolen;
					},
				},
			},
		}),
		maxValue: async (): Promise<number> => {
			const rell = await useChampion('Rell');
			return CHAMPION_SPECIFICS.Rell.MAX_PASSIVE_STACKS({ champion: { value: rell } } as DamageSource);
		},
	},
	[EffectObjectName.namiPSurgingTides]: defineEffectSpecific<[surgingTides: number, totalAP?: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 100), Math.max(0, data?.[1] ?? 0)];
		},
		maxValue: 100,
		imgText(_data, self) {
			return Math.round(self.stats.value.effectVars.namiPassiveBonusMS ?? 0);
		},
		deriveProgressValue: (_value, self) => {
			return self?.stats.value.effectVars.namiPassiveBonusMS ?? 0;
		},
		onValueUpdate(value, self) {
			if (value && (self.internalData.value as IInternalDataOf<'Nami'>).passiveMSTotalAp !== undefined) {
				(self.internalData.value as IInternalDataOf<'Nami'>).passiveMSTotalAp = undefined;
			}
		},
		progressComponentSymbol: '',
		sourceControls: {
			invalidMessage: (source) => {
				if (source.listedChampion.value?.id !== 'Nami' satisfies IChampionId) {
					return 'it\'s not Nami';
				}
			},
		},
		effectControls: {
			refresh(source) {
				const effect = source.getEffect(EffectObjectName.namiPSurgingTides)?.[0] ?? source.addEffect(GameAbilityId.build(AbilityType.effect, EffectObjectName.namiPSurgingTides), [100]);
				effect.data.value[1] = effect.source.value?.stats.value.total.abilityPower ?? 0;
			},
			currentlySnapshot(effectData) {
				return `calculating using: <scaleap>%i:${STAT_ICON.abilityPower}% ${roundNumber(effectData?.[1] ?? 0, 3)}</scaleap>`;
			},
		},
		variables: defineVariables({
			known: {
				BonusMS: [],
			},
			calculate(self) {
				return {
					BonusMS: {
						value: self.stats.value.effectVars.namiPassiveBonusMS,
					},
				};
			},
			meta: {
				BonusMS: {
					isCustom: true,
				},
			},
		}),
		calculateHooks: {
			postInit: {
				handler(self, { effectStats }, { effectVars }) {
					const effect = self.getEffect(EffectObjectName.namiPSurgingTides)?.[0];
					if (effect?.champion.value?.id === 'Nami') {
						const [progress, totalAP] = effect.data.value;
						effectVars.namiPassiveBonusMS = CHAMPION_SPECIFICS.Nami.passive.calculateMS(effect.champion.value as IChampion, progress, totalAP ?? 0);
						const { passiveMSTotalAp } = self.internalData.value as IInternalDataOf<'Nami'>;
						if (passiveMSTotalAp === undefined) {
							effectStats.moveSpeed += effectVars.namiPassiveBonusMS;
						}
					}
				},
			},
		},
	}),
	[EffectObjectName.nasusWWither]: defineEffectSpecific<[witherProgress: number]>({
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 100)];
		},
		maxValue: 100,
		imgText(_data, self) {
			return Math.round(self.stats.value.effectVars.nasusWSlow ?? 0);
		},
		setupDataFromInternalData(damageSource) {
			const { wProgress } = damageSource.internalData.value as IInternalDataOf<'Nasus'>;
			if (wProgress) {
				return [wProgress];
			}
		},
		watch(effect) {
			return effect.source.value?.abilityLevels.value.w;
		},
		deriveProgressValue: (_value, self) => {
			return self?.stats.value.effectVars.nasusWSlow ?? 0;
		},
		sourceControls: {
			invalidMessage: (source) => {
				if (source.listedChampion.value?.id !== 'Nasus' satisfies IChampionId) {
					return 'it\'s not Nasus';
				}
			},
		},
		variables: defineVariables({
			known: {
				AttackSpeedSlow: [],
				MoveSpeedSlow: [],
				AttackSpeedReduction: [],
			},
			calculate(self) {
				return {
					MoveSpeedSlow: {
						value: self.stats.value.effectVars.nasusWSlow ?? 0,
					},
					AttackSpeedSlow: {
						value: self.stats.value.effectVars.nasusWCripple ?? 0,
					},
					AttackSpeedReduction: {
						value: self.stats.value.effectVars.nasusWASReduced ?? 0,
					},
				};
			},
			meta: {
				MoveSpeedSlow: {
					isCustom: true,
					resultsIsPercentage: true,
					type: VariableType.affectedBySlowResist,
				},
				AttackSpeedSlow: {
					isCustom: true,
					resultsMultiplier: 100,
					resultsIsPercentage: true,
				},
				AttackSpeedReduction: {
					isCustom: true,
				},
			},
		}),
		calculateHooks: {
			postInit: {
				handler(self, _stats, { miscDebug, effectVars, debuffs }) {
					const effect = self.getEffect(EffectObjectName.nasusWWither)?.[0];
					if (effect?.champion.value?.id === 'Nasus') {
						const wLevel = effect.source.value?.abilityLevels.value.w ?? 1;
						effectVars.nasusWSlow = CHAMPION_SPECIFICS.Nasus.w.calculateSlow(effect.champion.value as IChampion, effect.data.value[0], wLevel);
						debuffs.percentageMSSlow.push(effectVars.nasusWSlow / 100);

						const msToASSlowRatio = championAbilityVariableValue('AttackSpeedSlowMult', {
							abilityKey: 'w',
							abilityVariant: (effect.champion.value as IChampion)!.abilities.w.variants[0]!,
							abilityLevel: wLevel,
						});
						if (typeof msToASSlowRatio.value === 'number') {
							effectVars.nasusWCripple = effectVars.nasusWSlow * msToASSlowRatio.value / 100;
							debuffs.cripple = addMultiplicative(debuffs.cripple, effectVars.nasusWCripple);
							miscDebug.totalAdditiveCripple += effectVars.nasusWCripple;
						} else {
							console.warn(`[EFFECT_SPECIFICS ${EffectObjectName.nasusWWither}] failed to calculate ms to as slow ratio`, msToASSlowRatio);
						}
					}
				},
			},
			postTotal: {
				handler(_self, _stats, { effectVars, debuffs, miscDebug }) {
					effectVars.nasusWASReduced = debuffs.totalCrippledAttackSpeed * effectVars.nasusWCripple! / (miscDebug.totalAdditiveCripple || 1);
				},
				priority: HOOK_PRIORITIES.postTotal.recordKeeping,
			},
		},
	}),
} satisfies IHypotheticalEffectSpecifics;

for (const [effectObjectName, effectSpecific] of Object.entries(EFFECT_SPECIFICS)) {
	Object.assign(effectSpecific, EFFECTS_META[effectObjectName as EffectObjectName]);
}

export type TEffectSpecifics = typeof EFFECT_SPECIFICS;
export type IHypotheticalEffectSpecifics = Record<EffectObjectName, IEffectSpecific<any>>;

export interface IEffectSpecific<T extends (number | undefined)[] = [number]> {
	sourceAbility: IGameAbilityId;
	/** used when an effect is applied by multiple items, overrides `sourceAbility` when creating EFFECTS_APPLIED_BY_ITEMS_TO_TARGET */
	appliedByItems?: IGameAbilityId[];
	label: string;
	/**
	 * same as `IDamageSourceInternalDataProvider.setupData` for `DamageSource.appliedEffects[number].data`
	 * @param data the existing effect's data for cloning
	 */
	setupData: (data: T | undefined, self: DamageSource) => Promise<T> | T;
	/** checks if effect's data is not the default value, if not present, `defaultEffectIsActive` will be used */
	isActive?: (data: NoInfer<T>) => number | boolean;
	imgText?: (data: NoInfer<T>, self: DamageSource) => number | string;
	/**
	 * used for getting the `appliedEffect`'s data that's being added (`applyEffectsFromTo`) because a source has an item which applies its effect on target
	 * for example, if `damageSource` has Serpent's Fang, there's a checkbox for applying it's effect, Shield Reave, to all targets used in calculations. This sets `internalItemData.sVenom` to `1`. Based on that, this function (which is expected to be found on all effect specifics that can be applied by items found on source to target) creates the data for appliedEffect of `EffectObjectName.serpentsFangVenom`
	 * in this case it would be
	 *	- `0` when `internalItemData.sVenom` is `0`
	 *	- `1` when `internalItemData.sVenom` is `1` **AND** `damageSource.isRanged` is `false`
	 *	- `2` when `internalItemData.sVenom` is `1` **AND** `damageSource.isRanged` is `true`
	 */
	setupDataFromSourceItem?: (damageSource: DamageSource, self: DamageSource) => NoInfer<T> | undefined;
	/** same as setupDataFromSourceItem but for dragon effects */
	setupDataFromDragonData?: (damageSource: DamageSource, self: DamageSource) => NoInfer<T> | undefined;
	/** same as setupDataFromSourceItem but for champion effects */
	setupDataFromInternalData?: (damageSource: DamageSource, self: DamageSource) => NoInfer<T> | undefined;
	watch?: IDamageSourceEffect['watch'];
	/**
	 * based on this and `maxValue` VExtra components are created.
	 * - both `undefined` = `VExtraBoolean`
	 * - `minValue` or `maxValue` specified = `VExtraNumber`
	 * @default 0
	 */
	minValue?: number;
	/**
	 * see `minValue`
	 * @default 1
	 */
	maxValue?: number | (() => Promise<number> | number);
	/** if specified, the component for this effect will be `VExtraEnum` */
	enumOptions?: Record<string, number>;
	/** if present, component for this will be `VExtraProgress` */
	deriveProgressValue?: IDeriveProgressFn<true>;
	/** will be called when the value is updated through the extra component */
	onValueUpdate?: IExtraOnValueUpdate;
	componentTooltip?: string;
	progressComponentSymbol?: string;
	sourceControls?: ISelectEffectSourceProps;
	effectControls?: IEffectControlsProps<T>;
	calculateHooks?: ICalculateChampionStatsHookSource;
	/** function that will be called on a resolved `gameVariable` with a matching type, for example Serpent's Fang passive shield reave effect will reduce all `VARIABLE_TYPE.shield` */
	modifyVariable?: {
		type: VariableType[];
		handler: IEffectModifyVariableFunction<T>;
	};
	/** variables to be showned in results */
	variables?: ISpecificVariables<never, any>;
}

type IEffectModifyVariableFunction<T extends (number | undefined)[] = [number]> = (value: number, meta: IVariableModifyMeta, effectData: T) => number;

export const EFFECT_SPECIFICS_OBJECT_ENTRIES = Object.entries(EFFECT_SPECIFICS) as [EffectObjectName, IEffectSpecific][];

const slowEffectDescriptionObj = {
	stringtable: 'game_buff_tooltip_slow',
};

/** `effect.json` values for purely custom effects - if an effectObjectName has this specified, it will be put in `effect.json` during `scripts/updateData` */
export const CUSTOM_EFFECTS: Partial<Record<EffectObjectName, Omit<IEffectData[EffectObjectName], 'dataKey'>
	| { objectName: string }
	| {
		/* effect sources like summoner spells can have their effect description in a separate object from the spell description, like Cleanse's summoner spell is in shared/SummonerBoost but the effect "this unit has increased tenacity" is in shared/Cleanse, so specify the effect object key if needed, otherwise will use just the main spell object */
		sharedSpellObjectKey: string;
		sharedSpellEffectObjectKey?: string | string[];
	}
	| { championSpellObjectKey: string } | string>
> = {
	/* items */
	[EffectObjectName.knightsVowSacrifice]: {
		description: 'This unit takes reduced damage thanks to a nearby ally\'s sacrifice.',
	},
	[EffectObjectName.celestialOppositionBlessingShattered]: slowEffectDescriptionObj,
	[EffectObjectName.randuinsHumility]: slowEffectDescriptionObj,
	[EffectObjectName.stridebreakerBShockwaveSlow]: slowEffectDescriptionObj,
	[EffectObjectName.icebornGauntletFrostField]: slowEffectDescriptionObj,
	[EffectObjectName.seryldaBitterCold]: {
		/* effect seems to have identical text to rylai  */
		objectName: EffectObjectName.rylaisRimefrost,
	},
	[EffectObjectName.bloodsongSpellbladed]: {
		description: 'This unit takes increased damage.',
	},
	[EffectObjectName.gunbladeLightningBolt]: {
		/* effect seems to have identical text to botrk  */
		objectName: EffectObjectName.botrkClawingShadows,
	},
	/* champion passives */
	[EffectObjectName.ashePFrostShot]: {
		championSpellObjectKey: 'Characters/Ashe/Spells/AshePassiveAbility/AshePassiveSlow',
	},
	[EffectObjectName.nunuPCallOfFreljord]: 'game_buff_tooltip_nunup',
	[EffectObjectName.ornnPLivingForge]: {
		description: 'This unit\'s item is upgraded thanks to ally Ornn.',
	},
	[EffectObjectName.namiPSurgingTides]: {
		championSpellObjectKey: 'Characters/Nami/Spells/NamiPassiveAbility/NamiPassivett',
	},
	[EffectObjectName.nasusWWither]: {
		championSpellObjectKey: 'Characters/Nasus/Spells/NasusWAbility/NasusW',
	},
	/* other */
	[EffectObjectName.ghost]: {
		sharedSpellObjectKey: 'Shared/Spells/SummonerHaste',
		sharedSpellEffectObjectKey: 'Shared/Spells/Haste',
	},
	[EffectObjectName.cleanse]: {
		sharedSpellObjectKey: 'Shared/Spells/SummonerBoost',
		sharedSpellEffectObjectKey: 'Shared/Spells/Cleanse',
	},
	[EffectObjectName.heal]: {
		sharedSpellObjectKey: 'Shared/Spells/SummonerHeal',
	},
	[EffectObjectName.exhaust]: {
		sharedSpellObjectKey: 'Shared/Spells/SummonerExhaust',
		sharedSpellEffectObjectKey: ['Shared/Spells/SummonerExhaustDebuff', 'Shared/Spells/SummonerExhaustSlow'],
	},
	[EffectObjectName.grievousWounds]: {
		sharedSpellObjectKey: 'Shared/Spells/GrievousWound',
	},
	[EffectObjectName.grievousWoundsPercent]: {
		sharedSpellObjectKey: 'Shared/Spells/GrievousWound',
	},
	[EffectObjectName.stun]: {
		description: 'This unit is <keyword>stunned</keyword>.',
	},
	[EffectObjectName.slowFlat]: {
		description: 'This unit is <keyword>slowed</keyword> by a flat amount.',
	},
	[EffectObjectName.slowPercent]: {
		description: 'This unit is <keyword>slowed</keyword> by a percentage amount.',
	},
	[EffectObjectName.hextechSoulSlow]: {
		sharedSpellObjectKey: 'Shared/Spells/SRX_DragonSoulBuffHextech_Slow',
	},
};

function defineEffectSpecific<T extends (number | undefined)[]>(config: Omit<IEffectSpecific<T>, 'sourceAbility' | 'label'>): IEffectSpecific<T> {
	return config as IEffectSpecific<T>;
}

type IApplicableEffect = [IEffectAbilityId, IEffectSpecific<any>];

/** map (item id to effect) of all effects that can be applied by toggling item's extra `apply X to target` checkbox */
const EFFECTS_APPLIED_BY_ITEMS_TO_TARGET = Object.fromEntries(EFFECT_SPECIFICS_OBJECT_ENTRIES
	.filter(([, effectSpecific]) => effectSpecific.setupDataFromSourceItem)
	.flatMap(([effectObjectName, effectSpecific]): [string, IApplicableEffect][] => {
		const value: IApplicableEffect = [GameAbilityId.build(AbilityType.effect, effectObjectName), effectSpecific];
		return effectSpecific.appliedByItems
			? effectSpecific.appliedByItems.map(itemAbilityId => [itemAbilityId.id, value])
			: [[effectSpecific.sourceAbility.id, value]];
	})) as Record<string, IApplicableEffect>;

const DRAGON_EFFECTS_APPLICABLE_TO_TARGET = EFFECT_SPECIFICS_OBJECT_ENTRIES
	.filter(([, effectSpecific]) => effectSpecific.setupDataFromDragonData)
	.map(([effectObjectName, effectSpecific]) => [GameAbilityId.build(AbilityType.effect, effectObjectName), effectSpecific] as IApplicableEffect);

const EFFECTS_APPLIED_BY_CHAMPIONS_TO_TARGET = EFFECT_SPECIFICS_OBJECT_ENTRIES
	.filter(([, effectSpecific]) => effectSpecific.setupDataFromInternalData)
	.reduce((acc, [effectObjectName, effectSpecific]) => {
		if (effectSpecific.sourceAbility.type !== AbilityType.champion) {
			console.error('[specifics/effect] setupDataFromInternalData found on non-champion effect', effectObjectName, effectSpecific);
			return acc;
		}

		const value: IApplicableEffect = [GameAbilityId.build(AbilityType.effect, effectObjectName), effectSpecific];
		if (acc[effectSpecific.sourceAbility.id]) {
			acc[effectSpecific.sourceAbility.id]!.push(value);
		} else {
			acc[effectSpecific.sourceAbility.id] = [value];
		}
		return acc;
	}, {} as Partial<Record<IChampionId, IApplicableEffect[]>>);

/** get all effects a damage source applies to its target */
export function effectsAppliedBy(source: DamageSource): IApplicableEffect[] {
	const rv: IApplicableEffect[] = [];

	for (const item of source.items.value) {
		if (item) {
			const itemEffect = EFFECTS_APPLIED_BY_ITEMS_TO_TARGET[item.id];
			itemEffect && rv.push(itemEffect);
		}
	}

	for (const dragonApplicableEffect of DRAGON_EFFECTS_APPLICABLE_TO_TARGET) {
		if (source.dragonSoul.value === dragonApplicableEffect[1].sourceAbility.id) {
			rv.push(dragonApplicableEffect);
		}
	}

	const championApplicableEffects = source.champion.value?.id && EFFECTS_APPLIED_BY_CHAMPIONS_TO_TARGET[source.champion.value.id];
	if (championApplicableEffects) {
		for (const championEffect of championApplicableEffects) {
			rv.push(championEffect);
		}
	}

	return rv;
}

export function applyEffectsFromTo(source: DamageSource, target: DamageSource): DamageSource {
	for (const [effectAbilityId, effectSpecific] of source.effectsAppliedToTarget.value) {
		let effectData;
		let champion;

		if (effectSpecific.setupDataFromSourceItem) {
			effectData = effectSpecific.setupDataFromSourceItem!(source, target);
		} else if (effectSpecific.setupDataFromDragonData) {
			effectData = effectSpecific.setupDataFromDragonData!(source, target);
		} else if (effectSpecific.setupDataFromInternalData) {
			effectData = effectSpecific.setupDataFromInternalData!(source, target);
			champion = source.champion.value;
		}

		effectData && target.addEffect(effectAbilityId, effectData as any, true, source, champion, true);
	}
	return target;
}

export function defaultEffectIsActive(data: (number | undefined)[]): number | boolean | undefined {
	return data[0];
}

function simpleSlowEffectVariables(effectVarsKey: keyof IStatsCalculationEffectVars): ISpecificVariables<never, any> {
	return defineVariables<never, any>({
		known: {
			Slow: [],
		},
		calculate(self) {
			return {
				Slow: {
					value: self.stats.value.effectVars[effectVarsKey] ?? 0,
				},
			};
		},
		meta: {
			Slow: {
				type: VariableType.affectedBySlowResist,
				isCustom: true,
				resultsMultiplier: 100,
				resultsIsPercentage: true,
			},
		},
	});
}
