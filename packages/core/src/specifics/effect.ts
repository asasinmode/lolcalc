import type { IEffectObjectName, IVariableType } from '@lolcalc/shared';
import type { DamageSource, ICalculateChampionStatsHookSource } from '../DamageSource.ts';
import type { IEffectAbilityId, IGameAbilityId } from '../GameAbilityId.ts';
import type { DetectItemVariables, IReplaceGameVariablesRV } from '../types';
import type { IVariableValueResult } from '../variables/game.ts';
import type { IInternalItemDataOf } from './index.ts';
import { ITEMS_BY_NAME, useChampion } from '@lolcalc/data';
import { ABILITY_TYPE, EFFECT_OBJECT_NAME, ITEM_NAME_TO_ID } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { GameAbilityId } from '../GameAbilityId.ts';
import { itemVariableValue } from '../variables/game.ts';
import { CHAMPION_SPECIFICS } from './champion.ts';
import { ITEM_SPECIFICS } from './item.ts';

/** specific effects' helpers, utils and calculations */
export const EFFECT_SPECIFICS = {
	[EFFECT_OBJECT_NAME.grievousWounds]: defineEffectSpecific<[gWounds: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.grievousWounds),
		label: 'Grievous Wounds',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.stun]: defineEffectSpecific<[isStunned: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.stun),
		label: 'Stun',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.slowFlat]: defineEffectSpecific<[slowedByFlat: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.slowFlat),
		label: 'Slow (flat)',
		minValue: 0,
		setupData(data) {
			return [Math.min(0, data?.[0] ?? 0)];
		},
		isActive(data) {
			return data[0];
		},
		imgText(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.slowPercent]: defineEffectSpecific<[slowedByPercent: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.slowPercent),
		label: 'Slow (percent)',
		minValue: 0,
		setupData(data) {
			return [Math.min(0, data?.[0] ?? 0)];
		},
		isActive(data) {
			return data[0];
		},
		imgText(data) {
			return `${data[0]}%`;
		},
	}),
	[EFFECT_OBJECT_NAME.shurelyaInspiringSpeech]: defineEffectSpecific<[isInspired: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.shurelya),
		label: 'Inspiring speech',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.ardentSanctify]: defineEffectSpecific<[isSanctified: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.ardentCensor),
		label: 'Sanctify',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.flowingWaterRapids]: defineEffectSpecific<[isRapidsed: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.staffOfFlowingWater),
		label: 'Rapids',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.bandlepipesFanfare]: defineEffectSpecific<[isFanfared: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bandlepipes),
		label: 'Fanfare',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.knightsVowSacrifice]: defineEffectSpecific<[hasSacrifice: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.knightsVow),
		label: 'Sacrifice',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.frozenHeartWintersCaress]: defineEffectSpecific<[wCaressed: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.frozenHeart),
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
			postTotal: {
				handler(_self, { totalStats, effectStats }, { calculatedVariables }) {
					const value = totalStats.attackSpeed * ITEMS_BY_NAME.frozenHeart.dataValues.ASPDSlow;
					effectStats.attackSpeed = value;
					calculatedVariables.frozenHeartCaress = value;
				},
			},
		},
		calculateResultVariables(self) {
			console.log('calculating variables');
			return new Map([['attackSpeed', { value: 123, baseValue: 123 }]]);
		},
	}),
	[EFFECT_OBJECT_NAME.serpentsFangVenom]: {
		...defineEffectSpecific<[shieldReavedBy: number]>({
			sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.serpentsFang),
			label: 'Serpent\'s Venom',
			setupData(data): [shieldReavedBy: number] {
				return [clamp(0, data?.[0] ?? 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.serpentsFangVenom].enumOptions.ranged!)];
			},
			isActive(data) {
				return data[0];
			},
			imgText(data) {
				return data[0] === 1 ? 'm' : data[0] === 2 ? 'r' : '';
			},
			setupDataFromSourceItem(damageSource) {
				if ((damageSource.internalItemData.value as IInternalItemDataOf<'serpentsFang'>).sVenom) {
					if (damageSource.isRanged.value) {
						return [2];
					} else {
						return [1];
					}
				}
			},
			modifyVariable: {
				type: 'shield',
				handler(value, effectData) {
					if (typeof value === 'number') {
						const reducePercentage = itemVariableValue(
						'ShieldWoundMeleeRangedSplit' satisfies DetectItemVariables<typeof ITEMS_BY_NAME['serpentsFang']>,
						ITEMS_BY_NAME.serpentsFang,
						undefined,
						effectData[0] === 2,
						);
						value *= 1 - (reducePercentage.value as number / 100);
					}

					return value;
				},
			},
		}),
		enumOptions: {
			none: 0,
			melee: 1,
			ranged: 2,
		},
		maxValue: 2,
	},
	[EFFECT_OBJECT_NAME.rylaisRimefrost]: defineEffectSpecific<[isRimefrosted: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.rylaisScepter),
		label: 'Rimefrost',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.abyssalMaskUnmake]: defineEffectSpecific<[isUnmade: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.abyssalMask),
		label: 'Cursed',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.horizonFocusHypershot]: defineEffectSpecific<[isHypershot: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.horizonFocus),
		label: 'Hypershot',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.bloodletterVileDecay]: {
		...defineEffectSpecific<[vileDecayStacks: number]>({
			sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bloodlettersCurse),
			label: 'Vile Decay stacks',
			setupData(data): [vileDecayStacks: number] {
				return [
					clamp(0, data?.[0] ?? 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.bloodletterVileDecay].maxValue),
				];
			},
			imgText(data) {
				return data[0];
			},
			isActive(data: [vDecay: number]) {
				return data[0];
			},
		}),
		maxValue: ITEM_SPECIFICS[ITEM_NAME_TO_ID.bloodlettersCurse].MAX_STACKS,
	},
	[EFFECT_OBJECT_NAME.blackCleaverCarve]: defineEffectSpecific<[carveStacks: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackCleaver),
		maxValue: ITEM_SPECIFICS[ITEM_NAME_TO_ID.blackCleaver].MAX_STACKS,
		label: 'Carve stacks',
		setupData(data): [carveStacks: number] {
			return [
				clamp(0, data?.[0] ?? 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.blackCleaverCarve].maxValue! as number),
			];
		},
		imgText(data) {
			return data[0];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.amumuPCursedTouch]: defineEffectSpecific<[isCursed: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Amumu', 'passive', 0),
		label: 'Cursed touch',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.jannaPTailwind]: defineEffectSpecific<[isTailwinded: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Janna', 'passive', 0),
		label: 'Tailwind',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.nunuPCallOfFreljord]: defineEffectSpecific<[isCalledByFreljord: number]>({
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Nunu', 'passive', 0),
		label: 'Call of the Freljord',
		setupData(data) {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data) {
			return data[0];
		},
	}),
	[EFFECT_OBJECT_NAME.ornnPLivingForge]: {
		...defineEffectSpecific<[livingForgeItemSlot: number]>({
			sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Ornn', 'passive', 0),
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
	},
	[EFFECT_OBJECT_NAME.rellPBreakMold]: {
		...defineEffectSpecific<[breakTheMoldStacks: number]>({
			sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Rell', 'passive', 0),
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
	},
} satisfies IHypotheticalEffectSpecifics;

export type TEffectSpecifics = typeof EFFECT_SPECIFICS;
export type IHypotheticalEffectSpecifics = Record<string, IEffectSpecific>;

export interface IEffectSpecific<T extends [number] = [number]> {
	sourceAbility: IGameAbilityId;
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
	modifyVariable?: {
		type: IVariableType;
		handler: IEffectModifyVariableFunction<T>;
	};
	/**
	 * calculate any variables that are supposed to be shown in results for this effect
	 * `damageSource` can be undefined so that this can be called in `CalculatorResultsTable` to get the effect section's rows (all the variables effect has)
	 */
	calculateResultVariables?: (damageSource?: DamageSource) => IReplaceGameVariablesRV['variables'];
}

export type IEffectModifyVariableFunctions = Partial<Record<IVariableType, NonNullable<IEffectSpecific['modifyVariable']>['handler'][]>>;

export type IEffectModifyVariableFunction<T extends [number] = [number]> = (value: Exclude<IVariableValueResult['value'], any[]>, effectData: T) => Exclude<IVariableValueResult['value'], any[]>;

export const EFFECT_SPECIFICS_OBJECT_ENTRIES = Object.entries(EFFECT_SPECIFICS) as [IEffectObjectName, IEffectSpecific][];

export const CUSTOM_EFFECT_IMAGES: Partial<Record<IEffectObjectName, [path: string, imgSize: number]>> = {
	[EFFECT_OBJECT_NAME.grievousWounds]: ['game/assets/spells/icons2d/gw_debuff.png', 64],
	[EFFECT_OBJECT_NAME.stun]: ['https://wiki.leagueoflegends.com/en-us/images/Keyword_Stun.svg', 32],
	[EFFECT_OBJECT_NAME.slowFlat]: ['https://wiki.leagueoflegends.com/en-us/images/Slow_icon.png', 65],
	[EFFECT_OBJECT_NAME.slowPercent]: ['https://wiki.leagueoflegends.com/en-us/images/Slow_icon.png', 65],
};

function defineEffectSpecific<T extends [number]>(config: IEffectSpecific<T>): IEffectSpecific<T> {
	return config;
}

/** all effects that can be applied by toggling item's extra `apply X to target` checkbox */
export const EFFECTS_APPLIED_BY_ITEMS_TO_TARGET = Object.fromEntries(EFFECT_SPECIFICS_OBJECT_ENTRIES
	.filter(([, effectSpecific]) => effectSpecific.setupDataFromSourceItem)
	.map(([effectObjectName, effectSpecific]) => {
		return [effectSpecific.sourceAbility.id, [GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName), effectSpecific]];
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
