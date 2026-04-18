import type { IChampionAbilityId, IItemAbilityId } from './types';
import { GameAbilityId } from './GameAbilityId.ts';
import { ABILITY_TYPE, EFFECT_OBJECT_NAME, ITEM_NAME_TO_ID } from './meta.ts';

export const EFFECT_SPECIFICS = {
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
	[EFFECT_OBJECT_NAME.shurelyaInspiringSpeech]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.shurelya),
		label: 'Inspiring speech',
		setupData(data): [inspiringSpeech: number] {
			return [clamp(0, data?.[0], 1)];
		},
		isActive(data: [inspiringSpeech: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.ardentSanctify]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.ardentCensor),
		label: 'Sanctify',
		setupData(data): [sanctify: number] {
			return [clamp(0, data?.[0], 1)];
		},
		isActive(data: [sanctify: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.flowingWaterRapids]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.staffOfFlowingWater),
		label: 'Rapids',
		setupData(data): [rapids: number] {
			return [clamp(0, data?.[0], 1)];
		},
		isActive(data: [rapids: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.bandlepipesFanfare]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bandlepipes),
		label: 'Fanfare',
		setupData(data): [fanfare: number] {
			return [clamp(0, data?.[0], 1)];
		},
		isActive(data: [fanfare: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.knightsVowSacrifice]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.knightsVow),
		label: 'Sacrifice',
		setupData(data): [sacrifice: number] {
			return [clamp(0, data?.[0], 1)];
		},
		isActive(data: [sacrifice: number]) {
			return data[0];
		},
	},
} satisfies IHypotheticalEffectSpecifics;

export type TEffectSpecifics = typeof EFFECT_SPECIFICS;
export type IHypotheticalEffectSpecifics = Record<string, IEffectSpecific>;

export interface IEffectSpecific {
	sourceAbility: IChampionAbilityId | IItemAbilityId;
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
