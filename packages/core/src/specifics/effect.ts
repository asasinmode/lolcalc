import type { IEffectData, TEffects } from '@lolcalc/data';
import type { IEffectObjectName, IVariableType } from '@lolcalc/shared';
import type { DamageSource, ICalculateChampionStatsHookSource } from '../DamageSource.ts';
import type { IEffectAbilityId, IGameAbilityId } from '../GameAbilityId.ts';
import type { DetectItemVariables } from '../types';
import type { IReplacedGameVariable } from '../variables/game.ts';
import type { IInternalItemDataOf, IVariableValueResult } from './index.ts';
import { EFFECTS, ITEMS_BY_NAME, useChampion } from '@lolcalc/data';
import { AbilityType, EFFECT_OBJECT_NAME, GRIEVOUS_WOUND_ITEMS, ITEM_NAME_TO_ID } from '@lolcalc/shared';

import { clamp } from '@lolcalc/shared/utils.ts';
import { GameAbilityId } from '../GameAbilityId.ts';
import { championAbilityVariableValue, itemVariableValue } from '../variables/game.ts';
import { CHAMPION_SPECIFICS } from './champion.ts';
import { ITEM_SPECIFICS } from './item.ts';

const PLACEHOLDER_REPLACED_GAME_VARIABLE: IReplacedGameVariable = { baseValue: 0, value: 0 };

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
	[EFFECT_OBJECT_NAME.ghost]: defineEffectSpecific<[ghost: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ghost),
		label: 'Ghost',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, _stats, { calculatedVariables }) {
					const bonusMs = championAbilityVariableValue('MovespeedMod', { abilityVariant: (EFFECTS as TEffects)[EFFECT_OBJECT_NAME.ghost], allAbilitiesVariants: [], damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof bonusMs.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += bonusMs.value;
					} else {
						console.warn('[EFFECT_SPECIFICS ghost] failed to calculate bonus ms');
					}
				},
			},
		},
	}),
	[EFFECT_OBJECT_NAME.cleanse]: defineEffectSpecific<[cleanse: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.cleanse),
		label: 'Cleanse',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, _stats, { calculatedVariables }) {
					// TODO
				},
			},
		},
	}),
	[EFFECT_OBJECT_NAME.heal]: defineEffectSpecific<[heal: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.heal),
		label: 'Heal',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, _stats, { calculatedVariables }) {
					// TODO
				},
			},
		},
	}),
	[EFFECT_OBJECT_NAME.exhaust]: defineEffectSpecific<[exhaust: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.exhaust),
		label: 'Exhaust',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, _stats, { calculatedVariables }) {
					// TODO
				},
			},
		},
	}),
	[EFFECT_OBJECT_NAME.grievousWounds]: defineEffectSpecific<[gWounds: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.grievousWounds),
		label: 'Grievous Wounds',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 100)];
		},
		isActive(data) {
			return data[0];
		},
		appliedByItems: GRIEVOUS_WOUND_ITEMS.map(itemId => GameAbilityId.build(AbilityType.item, itemId)),
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'brambleVest'>).gWounds) {
				const item = damageSource.items.value.find(item => item && (GRIEVOUS_WOUND_ITEMS as string[]).includes(item.id));
				const strength = item?.dataValues?.GrievousAmount;
				if (!strength) {
					console.warn('[EFFECT_SPECIFICS] detected a grievous wounds item but it has no GrievousAmount dataValue', item);
				}
				return [strength ? strength * 100 : 40];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.grievousWoundsPercent]: defineEffectSpecific<[gWounds: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.grievousWoundsPercent),
		label: 'Grievous Wounds (percent)',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 100)];
		},
		isActive(data) {
			return data[0];
		},
		imgText(data) {
			return `${data[0]}%`;
		},
		maxValue: 100,
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.stun]: defineEffectSpecific<[isStunned: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.stun),
		label: 'Stun',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.slowFlat]: defineEffectSpecific<[slowedByFlat: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.slowFlat),
		label: 'Slow (flat)',
		minValue: 0,
		maxValue: Number.POSITIVE_INFINITY,
		setupData(data) {
			return [Math.max(0, data?.[0] ?? 0)];
		},
		isActive(data) {
			return data[0];
		},
		imgText(data) {
			return data[0];
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.slowPercent]: defineEffectSpecific<[slowedByPercent: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.slowPercent),
		label: 'Slow (percent)',
		minValue: 0,
		maxValue: Number.POSITIVE_INFINITY,
		setupData(data) {
			return [Math.max(0, data?.[0] ?? 0)];
		},
		isActive(data) {
			return data[0];
		},
		imgText(data) {
			return `${data[0]}%`;
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.shurelyaInspiringSpeech]: defineEffectSpecific<[isInspired: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.shurelya),
		label: 'Inspiring speech',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, _args, { calculatedVariables }) {
					/* checked and it doesn't stack */
					if ((self.internalItemData.value as IInternalItemDataOf<'shurelya'>).iSpeech) {
						return;
					}

					calculatedVariables.totalBonusPercentMoveSpeed += ITEMS_BY_NAME.shurelya?.dataValues.ActiveMoveSpeed;
				},
			},
		},
	}),
	[EFFECT_OBJECT_NAME.ardentSanctify]: defineEffectSpecific<[isSanctified: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.ardentCenser),
		label: 'Sanctify',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
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
	[EFFECT_OBJECT_NAME.flowingWaterRapids]: defineEffectSpecific<[isRapidsed: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.staffOfFlowingWater),
		label: 'Rapids',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					if (!(self.internalItemData.value as IInternalItemDataOf<'staffOfFlowingWater'>).rapids) {
						ITEM_SPECIFICS[ITEM_NAME_TO_ID.staffOfFlowingWater].calculatePassive(itemPassivesStats, calculatedVariables);
					}
				},
			},
		},
	}),
	[EFFECT_OBJECT_NAME.bandlepipesFanfare]: defineEffectSpecific<[fanfare: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bandlepipes),
		label: 'Fanfare',
		setupData(data): [fanfare: number] {
			return [clamp(0, data?.[0] ?? 0, MeleeRangedEnumOptions.ranged)];
		},
		isActive(data) {
			return data[0];
		},
		imgText(data) {
			return data[0] === MeleeRangedEnumOptions.melee ? 'm' : data[0] === MeleeRangedEnumOptions.ranged ? 'r' : '';
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats, effectStats }) {
					/* checked and it doesn't stack */
					if ((self.internalItemData.value as IInternalItemDataOf<'bandlepipes'>).fanfare) {
						return;
					}

					const effect = self.getEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.bandlepipesFanfare));
					const attackSpeed = itemVariableValue('AuraAttackSpeed', { item: ITEMS_BY_NAME.bandlepipes, isRanged: effect?.[0].data[0] === MeleeRangedEnumOptions.ranged });
					if (typeof attackSpeed.value === 'number') {
						itemPassivesStats.bonusAttackSpeedPercent += attackSpeed.value;
						effectStats.bonusAttackSpeedPercent = (effectStats.bonusAttackSpeedPercent ?? 0) + attackSpeed.value;
					} else {
						console.warn('[EFFECT_SPECIFICS Bandlepipes] failed to calculate bonus attack speed');
					}
				},
			},
		},
		enumOptions: MeleeRangedEnumOptions,
		maxValue: MeleeRangedEnumOptions.ranged,
	}),
	[EFFECT_OBJECT_NAME.knightsVowSacrifice]: defineEffectSpecific<[hasSacrifice: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.knightsVow),
		label: 'Sacrifice',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.frozenHeartWintersCaress]: defineEffectSpecific<[wCaressed: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.frozenHeart),
		label: 'Winter\'s Caress',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'frozenHeart'>).wCaress) {
				return [1];
			}
		},
		calculateHooks: {
			onTotalPreMultipliers: {
				handler(_self, { totalPreMultipliersStats, totalMultipliersStats, effectStats }, { calculatedVariables }) {
					const value = totalPreMultipliersStats.attackSpeed * ITEMS_BY_NAME.frozenHeart?.dataValues.ASPDSlow;
					effectStats.attackSpeed = (effectStats.attackSpeed ?? 0) + value;
					totalMultipliersStats.attackSpeed += value;
					calculatedVariables.frozenHeartCaress = value;
				},
			},
		},
		variables: defineEffectSpecificVariables(
			['attack speed reduction', 'attack speed % reduction'],
			(damageSource) => {
				if (damageSource.stats.value.variables.frozenHeartCaress !== undefined) {
					const value = -damageSource.stats.value.variables.frozenHeartCaress;
					const percentValue = value / (damageSource.stats.value.base.attackSpeedRatio || 1) * 100;
					return new Map([
						['attack speed reduction', { baseValue: value, value }],
						['attack speed % reduction', { baseValue: percentValue, value: percentValue, meta: { resultsIsPercentage: true } }],
					]);
				}
			},
		),
	}),
	[EFFECT_OBJECT_NAME.serpentsFangVenom]: defineEffectSpecific<[shieldReavedBy: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.serpentsFang),
		label: 'Serpent\'s Venom',
		setupData(data): [shieldReavedBy: number] {
			return [clamp(0, data?.[0] ?? 0, MeleeRangedEnumOptions.ranged)];
		},
		isActive(data) {
			return data[0];
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
			type: 'shield',
			handler(value, effectData) {
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
	[EFFECT_OBJECT_NAME.rylaisRimefrost]: defineEffectSpecific<[isRimefrosted: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.rylaisScepter),
		label: 'Rimefrost',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'rylaisScepter'>).rimefrost) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.abyssalMaskUnmake]: defineEffectSpecific<[isUnmade: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.abyssalMask),
		label: 'Cursed',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'abyssalMask'>).unmake) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.horizonFocusHypershot]: defineEffectSpecific<[isHypershot: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.horizonFocus),
		label: 'Hypershot',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'horizonFocus'>).hypershot) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.bloodletterVileDecay]: {
		...defineEffectSpecific<[vileDecayStacks: number]>({
			sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bloodlettersCurse),
			label: 'Vile Decay stacks',
			setupData(data): [vileDecayStacks: number] {
				return [
					clamp(0, data?.[0] ?? 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.bloodletterVileDecay].maxValue()),
				];
			},
			imgText(data) {
				return data[0];
			},
			isActive(data: [vDecay: number]) {
				return data[0];
			},
		}),
		maxValue: () => ITEM_SPECIFICS[ITEM_NAME_TO_ID.bloodlettersCurse].MAX_STACKS,
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'bloodlettersCurse'>).vDecay) {
				return [(damageSource.internalItemData.value as IInternalItemDataOf<'bloodlettersCurse'>).vDecay];
			}
		},
		// TODO calculate
	},
	[EFFECT_OBJECT_NAME.blackCleaverCarve]: defineEffectSpecific<[carveStacks: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.blackCleaver),
		maxValue: () => ITEM_SPECIFICS[ITEM_NAME_TO_ID.blackCleaver].MAX_STACKS,
		label: 'Carve stacks',
		setupData(data): [carveStacks: number] {
			return [
				clamp(0, data?.[0] ?? 0, (EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.blackCleaverCarve].maxValue! as () => number)()),
			];
		},
		imgText(data) {
			return data[0];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'blackCleaver'>).carve) {
				return [(damageSource.internalItemData.value as IInternalItemDataOf<'blackCleaver'>).carve];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.botrkClawingShadows]: defineEffectSpecific<[isClawed: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.botrk),
		label: 'Clawing Shadows',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'botrk'>).cShadows) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.zekesConvergenceFrostfireTempest]: defineEffectSpecific<[fTempested: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.zekesConvergence),
		label: 'Frostfire Tempest',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'zekesConvergence'>).fTempest) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.celestialOppositionBlessingShattered]: defineEffectSpecific<[mBlessingShattered: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.celestialOpposition),
		label: 'Mountain Blessing',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'celestialOpposition'>).mbSlow) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.randuinsHumility]: defineEffectSpecific<[humiliated: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.randuinsOmen),
		label: 'Humility',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'randuinsOmen'>).humility) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.malignanceHatefog]: defineEffectSpecific<[hatefogged: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.malignance),
		label: 'Hatefog',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'malignance'>).hatefog) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.imperialMandateCommand]: defineEffectSpecific<[commanded: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.imperialMandate),
		label: 'Command',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'imperialMandate'>).command) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.stridebreakerBShockwaveSlow]: defineEffectSpecific<[bShockwaved: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.stridebreaker),
		label: 'Breaking Shockwave',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'stridebreaker'>).tBShockwave) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.icebornGauntletFrostField]: defineEffectSpecific<[frostField: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.icebornGauntlet),
		label: 'Frost Field',
		setupData(data): [frostField: number] {
			return [clamp(0, data?.[0] ?? 0, MeleeRangedEnumOptions.ranged)];
		},
		isActive(data) {
			return data[0];
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
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.bloodsongSpellbladed]: defineEffectSpecific<[bloodsonged: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bloodsong),
		label: 'Bloodsong',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'bloodsong'>).bloodsonged) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.seryldaBitterCold]: defineEffectSpecific<[bitterCold: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.seryldasGrudge),
		label: 'Bitter Cold',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'seryldasGrudge'>).bitterCold) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.gunbladeLightningBolt]: defineEffectSpecific<[lightningBolt: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.hextechGunblade),
		label: 'Lightning Bolt',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		setupDataFromSourceItem(damageSource) {
			if ((damageSource.internalItemData.value as IInternalItemDataOf<'hextechGunblade'>).lBolt) {
				return [1];
			}
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.amumuPCursedTouch]: defineEffectSpecific<[isCursed: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Amumu', 'passive', 0),
		label: 'Cursed touch',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.jannaPTailwind]: defineEffectSpecific<[isTailwinded: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Janna', 'passive', 0),
		label: 'Tailwind',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.ashePFrostShot]: defineEffectSpecific<[frostShot: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Ashe', 'passive', 0),
		label: 'Frost Shot',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.nunuPCallOfFreljord]: defineEffectSpecific<[isCalledByFreljord: number]>({
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Nunu', 'passive', 0),
		label: 'Call of the Freljord',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
		// TODO calculate
	}),
	[EFFECT_OBJECT_NAME.ornnPLivingForge]: {
		...defineEffectSpecific<[livingForgeItemSlot: number]>({
			sourceAbility: GameAbilityId.build(AbilityType.champion, 'Ornn', 'passive', 0),
			label: 'Masterwork item slot',
			setupData(data): [livingForgeItemSlot: number] {
				return [clamp(this.minValue!, data?.[0] ?? 1, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.ornnPLivingForge].maxValue!)];
			},
			isActive(data) {
				return data[0];
			},
			imgText(data) {
				return data[0];
			},
		}),
		/** this goes from <0,6> as opposed to ornn passive's <1,6> so it can be toggled "off" when decreased to 0 */
		minValue: 0,
		maxValue: 6,
		// TODO calculate
	},
	[EFFECT_OBJECT_NAME.rellPBreakMold]: {
		...defineEffectSpecific<[breakTheMoldStacks: number]>({
			sourceAbility: GameAbilityId.build(AbilityType.champion, 'Rell', 'passive', 0),
			label: 'Break the Mold stacks',
			async setupData(data): Promise<[breakTheMoldStacks: number]> {
				return [clamp(0, data?.[0] ?? 0, await EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.rellPBreakMold].maxValue())];
			},
			isActive(data) {
				return data[0];
			},
			imgText(data) {
				return data[0];
			},
		}),
		maxValue: async (): Promise<number> => {
			const rell = await useChampion('Rell');
			return CHAMPION_SPECIFICS.Rell.MAX_PASSIVE_STACKS({ champion: { value: rell } } as DamageSource);
		},
		// TODO calculate
	},
} satisfies IHypotheticalEffectSpecifics;

export type TEffectSpecifics = typeof EFFECT_SPECIFICS;
export type IHypotheticalEffectSpecifics = Record<string, IEffectSpecific>;

export interface IEffectSpecific<T extends [number] = [number]> {
	sourceAbility: IGameAbilityId;
	/** used when an effect is applied by multiple items, overrides `sourceAbility` when creating EFFECTS_APPLIED_BY_ITEMS_TO_TARGET */
	appliedByItems?: IGameAbilityId[];
	label: string;
	/**
	 * same as `IDamageSourceInternalDataProvider.setupData` for `DamageSource.appliedEffects[number].data`
	 * @param data the existing effect's data for cloning
	 */
	setupData: (data?: T) => Promise<T> | T;
	/** checks if effect's data is not the default value */
	isActive: (data: T) => number | boolean;
	imgText?: (data: T) => number | string;
	/**
	 * used for getting the `appliedEffect`'s data that's being added (`applyEffectsFromTo`) because a source has an item which applies its effect on target
	 * for example, if `damageSource` has Serpent's Fang, there's a checkbox for applying it's effect, Shield Reave, to all targets used in calculations. This sets `internalItemData.sVenom` to `1`. Based on that, this function (which is expected to be found on all effect specifics that can be applied by items found on source to target) creates the data for appliedEffect of `EFFECT_OBJECT_NAME.serpentsFangVenom`
	 * in this case it would be
	 *	- `0` when `internalItemData.sVenom` is `0`
	 *	- `1` when `internalItemData.sVenom` is `1` **AND** `damageSource.isRanged` is `false`
	 *	- `2` when `internalItemData.sVenom` is `1` **AND** `damageSource.isRanged` is `true`
	 */
	setupDataFromSourceItem?: (damageSource: DamageSource) => T | undefined;
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
	calculateHooks?: ICalculateChampionStatsHookSource;
	/** function that will be called on a resolved `gameVariable` with a matching type, for example Serpent's Fang passive shield reave effect will reduce all `VARIABLE_TYPE.shield` */
	modifyVariable?: {
		type: IVariableType;
		handler: IEffectModifyVariableFunction<T>;
	};
	/** variables to be showned in results */
	variables?: {
		/** calculate any variables that are supposed to be shown in results for this effect. Result is converted to a map in `CalculatorResultsTable` to match `IReplaceGameVariablesRV['variables']` */
		calculate: (damageSource: DamageSource) => (Map<string, IReplacedGameVariable> | undefined);
		/** the variables that will be returned from `calculate` with any values. Used for getting the list of them to show as result section rows */
		known: Map<string, IReplacedGameVariable>;
	};
}

export type IEffectModifyVariableFunctions = Partial<Record<IVariableType, NonNullable<IEffectSpecific['modifyVariable']>['handler'][]>>;

export type IEffectModifyVariableFunction<T extends [number] = [number]> = (value: Exclude<IVariableValueResult['value'], any[]>, effectData: T) => Exclude<IVariableValueResult['value'], any[]>;

export const EFFECT_SPECIFICS_OBJECT_ENTRIES = Object.entries(EFFECT_SPECIFICS) as [IEffectObjectName, IEffectSpecific][];

export const CUSTOM_EFFECT_IMAGES: Partial<Record<IEffectObjectName, [path: string, imgSize: number]>> = {
	[EFFECT_OBJECT_NAME.cleanse]: ['game/assets/spells/icons2d/summoner_boost.png', 64],
	[EFFECT_OBJECT_NAME.heal]: ['game/assets/spells/icons2d/summoner_heal.png', 64],
	[EFFECT_OBJECT_NAME.grievousWounds]: ['game/assets/spells/icons2d/gw_debuff.png', 64],
	[EFFECT_OBJECT_NAME.grievousWoundsPercent]: ['game/assets/spells/icons2d/gw_debuff.png', 64],
	[EFFECT_OBJECT_NAME.stun]: ['https://wiki.leagueoflegends.com/en-us/images/Keyword_Stun.svg', 32],
	[EFFECT_OBJECT_NAME.slowFlat]: ['https://wiki.leagueoflegends.com/en-us/images/Slow_icon.png', 65],
	[EFFECT_OBJECT_NAME.slowPercent]: ['https://wiki.leagueoflegends.com/en-us/images/Slow_icon.png', 65],
};

const slowEffectDescriptionObj = {
	stringtable: 'game_buff_tooltip_slow',
};

/** `effect.json` values for purely custom effects - if an effectObjectName has this specified, it will be put in `effect.json` during `scripts/updateData` */
export const CUSTOM_EFFECTS: Partial<Record<IEffectObjectName, Omit<IEffectData[string], 'dataKey'> | { objectName: string } | { sharedSpellObjectKey: string } | { championSpellObjectKey: string } | string>> = {
	/* items */
	[EFFECT_OBJECT_NAME.knightsVowSacrifice]: {
		description: 'This unit takes reduced damage thanks to a nearby ally\'s sacrifice.',
	},
	[EFFECT_OBJECT_NAME.celestialOppositionBlessingShattered]: slowEffectDescriptionObj,
	[EFFECT_OBJECT_NAME.randuinsHumility]: slowEffectDescriptionObj,
	[EFFECT_OBJECT_NAME.stridebreakerBShockwaveSlow]: slowEffectDescriptionObj,
	[EFFECT_OBJECT_NAME.icebornGauntletFrostField]: slowEffectDescriptionObj,
	[EFFECT_OBJECT_NAME.seryldaBitterCold]: {
		/* effect seems to have identical text to rylai  */
		objectName: EFFECT_OBJECT_NAME.rylaisRimefrost,
	},
	[EFFECT_OBJECT_NAME.bloodsongSpellbladed]: {
		description: 'This unit takes increased damage.',
	},
	[EFFECT_OBJECT_NAME.gunbladeLightningBolt]: {
		/* effect seems to have identical text to botrk  */
		objectName: EFFECT_OBJECT_NAME.botrkClawingShadows,
	},
	/* champion passives */
	[EFFECT_OBJECT_NAME.ashePFrostShot]: {
		championSpellObjectKey: 'Characters/Ashe/Spells/AshePassiveAbility/AshePassiveSlow',
	},
	[EFFECT_OBJECT_NAME.nunuPCallOfFreljord]: 'game_buff_tooltip_nunup',
	[EFFECT_OBJECT_NAME.ornnPLivingForge]: {
		description: 'This unit\'s item is upgraded thanks to ally Ornn.',
	},
	/* other */
	[EFFECT_OBJECT_NAME.ghost]: {
		sharedSpellObjectKey: 'Shared/Spells/SummonerHaste',
	},
	[EFFECT_OBJECT_NAME.cleanse]: {
		sharedSpellObjectKey: 'Shared/Spells/Cleanse',
	},
	[EFFECT_OBJECT_NAME.heal]: {
		sharedSpellObjectKey: 'Shared/Spells/SummonerHeal',
	},
	[EFFECT_OBJECT_NAME.exhaust]: {
		sharedSpellObjectKey: 'Shared/Spells/SummonerExhaust',
	},
	[EFFECT_OBJECT_NAME.grievousWounds]: {
		sharedSpellObjectKey: 'Shared/Spells/GrievousWound',
	},
	[EFFECT_OBJECT_NAME.grievousWoundsPercent]: {
		sharedSpellObjectKey: 'Shared/Spells/GrievousWound',
	},
	[EFFECT_OBJECT_NAME.stun]: {
		description: 'This unit is <keyword>stunned</keyword>.',
	},
	[EFFECT_OBJECT_NAME.slowFlat]: {
		description: 'This unit is <keyword>slowed</keyword> by a flat amount.',
	},
	[EFFECT_OBJECT_NAME.slowPercent]: {
		description: 'This unit is <keyword>slowed</keyword> by a percentage amount.',
	},
};

function defineEffectSpecific<T extends [number]>(config: IEffectSpecific<T>): IEffectSpecific<T> {
	return config;
}

function defineEffectSpecificVariables<K extends string>(
	keys: K[],
	calculate: (damageSource: DamageSource) => (Map<K, IReplacedGameVariable> | undefined),
): IEffectSpecific['variables'] {
	return {
		known: new Map(keys.map(k => [k, PLACEHOLDER_REPLACED_GAME_VARIABLE])),
		calculate,
	};
}

/** map (item id to effect) of all effects that can be applied by toggling item's extra `apply X to target` checkbox */
export const EFFECTS_APPLIED_BY_ITEMS_TO_TARGET = Object.fromEntries(EFFECT_SPECIFICS_OBJECT_ENTRIES
	.filter(([, effectSpecific]) => effectSpecific.setupDataFromSourceItem)
	.flatMap(([effectObjectName, effectSpecific]): [string, [IEffectAbilityId, IEffectSpecific]][] => {
		const value: [IEffectAbilityId, IEffectSpecific] = [GameAbilityId.build(AbilityType.effect, effectObjectName), effectSpecific];
		return effectSpecific.appliedByItems
			? effectSpecific.appliedByItems.map(itemAbilityId => [itemAbilityId.id, value])
			: [[effectSpecific.sourceAbility.id, value]];
	})) as Record<string, [IEffectAbilityId, IEffectSpecific]>;

/** get all effects a damage source applies to its target */
export function effectsAppliedBy(source: DamageSource): [effectAbilityId: IEffectAbilityId, effectSpecific: IEffectSpecific][] {
	const itemEffects = source.items.value.map(item => item && EFFECTS_APPLIED_BY_ITEMS_TO_TARGET[item.id]).filter(Boolean) as (typeof EFFECTS_APPLIED_BY_ITEMS_TO_TARGET)[string][];

	return itemEffects;
}

export function applyEffectsFromTo(source: DamageSource, target: DamageSource): DamageSource {
	for (const [effectAbilityId, effectSpecific] of source.effectsAppliedToTarget.value) {
		const effectData = effectSpecific.setupDataFromSourceItem!(source);
		effectData && target.addEffect(effectAbilityId, effectData as any, true);
	}
	return target;
}
