import type { IGameAbilityId } from './types';
import { GameAbilityId } from './GameAbilityId.ts';
import { ABILITY_TYPE, EFFECT_OBJECT_NAME, ITEM_NAME_TO_ID } from './meta.ts';

export const EFFECT_SPECIFICS = {
	[EFFECT_OBJECT_NAME.amumuPCursedTouch]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Amumu', 'passive', 0),
		label: 'Cursed touch',
		setupData(data): [cursedTouch: number] {
			return [Math.min(0, Math.max(1, data?.[0] ?? 0))];
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
			console.log('setting up bc', data, this);
			return [
				// Math.max(0, Math.min(EFFECT_SPECIFICS[EFFECT_NAME_TO_OBJECTNAME.blackCleaverCarve].maxValue, data?.[0] ?? 0)),
				Math.max(0, Math.min(this.maxValue!, data?.[0] ?? 0)),
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
			return [Math.max(0, Math.min(1, data?.[0] ?? 0))];
		},
		isActive(data: [inspiringSpeech: number]) {
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
