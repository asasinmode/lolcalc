import type { IEffectObjectName } from './meta.ts';
import type { IGameAbilityId } from './types';
import itemsData from '../assets/item.json' with { type: 'json' };
import { GameAbilityId } from './GameAbilityId.ts';
import { ABILITY_TYPE, EFFECT_OBJECT_NAME, ITEM_NAME_TO_ID } from './meta.ts';

const { data: items } = itemsData;

export const EFFECT_SPECIFICS = {
	[EFFECT_OBJECT_NAME.shurelyaInspiringSpeech]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.shurelya),
		label: 'Inspiring speech',
		setupData(data): [inspiringSpeech: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [inspiringSpeech: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.ardentSanctify]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.ardentCensor),
		label: 'Sanctify',
		setupData(data): [sanctify: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [sanctify: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.flowingWaterRapids]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.staffOfFlowingWater),
		label: 'Rapids',
		setupData(data): [rapids: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [rapids: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.bandlepipesFanfare]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bandlepipes),
		label: 'Fanfare',
		setupData(data): [fanfare: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [fanfare: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.knightsVowSacrifice]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.knightsVow),
		label: 'Sacrifice',
		setupData(data): [sacrifice: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [sacrifice: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.frozenHeartWintersCaress]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.frozenHeart),
		label: 'Winter\'s Caress',
		setupData(data): [wCaress: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [wCaress: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.serpentsFangVenom]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.serpentsFang),
		label: 'Serpent\'s Venom',
		setupData(data): [sVenom: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [sVenom: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.rylaisRimefrost]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.rylaisScepter),
		label: 'Rimefrost',
		setupData(data): [rimefrost: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [rimefrost: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.abyssalMaskUnmake]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.abyssalMask),
		label: 'Cursed',
		setupData(data): [cursed: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [cursed: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.horizonFocusHypershot]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.horizonFocus),
		label: 'Hypershot',
		setupData(data): [hypershot: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [hypershot: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.bloodletterVileDecay]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bloodlettersCurse),
		maxValue: items[ITEM_NAME_TO_ID.bloodlettersCurse].dataValues.MaxStacks,
		label: 'Vile Decay stacks',
		imgText(data: [vDecay: number]) {
			return data[0];
		},
		setupData(data): [vDecay: number] {
			return [
				clamp(0, data?.[0] ?? 0, this.maxValue!),
			];
		},
		isActive(data: [vDecay: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.blackCleaverCarve]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackCleaver),
		maxValue: 5,
		label: 'Carve stacks',
		imgText(data: [carve: number]) {
			return data[0];
		},
		setupData(data): [carve: number] {
			return [
				clamp(0, data?.[0] ?? 0, this.maxValue!),
			];
		},
		isActive(data: [carve: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.grievousWounds]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.grievousWounds),
		label: 'Grievous Wounds',
		setupData(data): [gWounds: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [gWounds: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.amumuPCursedTouch]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Amumu', 'passive', 0),
		label: 'Cursed touch',
		setupData(data): [cursedTouch: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [cursedTouch: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.jannaPTailwind]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Janna', 'passive', 0),
		label: 'Tailwind',
		setupData(data): [tailwind: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [tailwind: number]) {
			return data[0];
		},
	},
} satisfies IHypotheticalEffectSpecifics;

export type TEffectSpecifics = typeof EFFECT_SPECIFICS;
export type IHypotheticalEffectSpecifics = Record<string, IEffectSpecific>;

export interface IEffectSpecific {
	sourceAbility: IGameAbilityId;
	label: string;
	/**
	 * same as `IDamageSourceInternalDataProvider.setupData` for `DamageSource.appliedEffects[number].data`
	 * @param data the existing effect's data for cloning
	 */
	setupData: (data?: IDamageSourceEffect['data']) => IDamageSourceEffect['data'];
	/** checks if effect's data is not the default value */
	isActive: (data: any) => number | boolean;
	imgText?: (data: any) => number | string;
	/** @default 0 */
	minValue?: number;
	/** @default 1 */
	maxValue?: number;
}

export const EFFECT_SPECIFICS_OBJECT_ENTRIES = Object.entries(EFFECT_SPECIFICS) as [IEffectObjectName, IEffectSpecific][];

export const CUSTOM_EFFECT_IMAGES: Partial<Record<IEffectObjectName, [ path: string, imgSize: number ]>> = {
	[EFFECT_OBJECT_NAME.grievousWounds]: ['game/assets/spells/icons2d/gw_debuff.png', 64],
};
