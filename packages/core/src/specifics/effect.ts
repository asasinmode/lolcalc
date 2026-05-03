import type { TItems } from '@lolcalc/data';
import type { IEffectObjectName } from '@lolcalc/shared';
import type { DamageSource, IDamageSourceEffect } from '../DamageSource.ts';
import type { IGameAbilityId } from '../GameAbilityId.ts';
import { ITEMS, useChampion } from '@lolcalc/data';
import { ABILITY_TYPE, EFFECT_OBJECT_NAME, ITEM_NAME_TO_ID } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { GameAbilityId } from '../GameAbilityId.ts';
import { CHAMPION_SPECIFICS } from './champion.ts';

export const EFFECT_SPECIFICS = {
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
	[EFFECT_OBJECT_NAME.stun]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.stun),
		label: 'Stun',
		setupData(data): [isStunned: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [isStunned: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.slowFlat]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.slowFlat),
		label: 'Slow (flat)',
		minValue: 0,
		setupData(data): [slowedBy: number] {
			return [Math.min(0, data?.[0] ?? 0)];
		},
		isActive(data: [slowedBy: number]) {
			return data[0];
		},
		imgText(data: [slowedBy: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.slowPercent]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.slowPercent),
		label: 'Slow (percent)',
		minValue: 0,
		setupData(data): [slowedBy: number] {
			return [Math.min(0, data?.[0] ?? 0)];
		},
		isActive(data: [slowedBy: number]) {
			return data[0];
		},
		imgText(data: [slowedBy: number]) {
			return `${data[0]}%`;
		},
	},
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
		maxValue: (ITEMS as TItems)[ITEM_NAME_TO_ID.bloodlettersCurse].dataValues.MaxStacks,
		label: 'Vile Decay stacks',
		imgText(data: [vDecay: number]) {
			return data[0];
		},
		setupData(data): [vDecay: number] {
			return [
				clamp(0, data?.[0] ?? 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.bloodletterVileDecay].maxValue),
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
				clamp(0, data?.[0] ?? 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.blackCleaverCarve].maxValue!),
			];
		},
		isActive(data: [carve: number]) {
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
	[EFFECT_OBJECT_NAME.nunuPCallOfFreljord]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Nunu', 'passive', 0),
		label: 'Call of the Freljord',
		setupData(data): [callOfFreljord: number] {
			return [clamp(0, data?.[0] ?? 0, 1)];
		},
		isActive(data: [callOfFreljord: number]) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.ornnPLivingForge]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Ornn', 'passive', 0),
		label: 'Masterwork item slot',
		/** this goes from <0,6> as opposed to ornn passive's <1,6> so it can be toggled "off" when decreased to 0 */
		minValue: 0,
		maxValue: 6,
		setupData(data): [masterworkSlotIndex: number] {
			return [clamp(this.minValue!, data?.[0] ?? 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.ornnPLivingForge].maxValue!)];
		},
		isActive(data: [masterworkSlotIndex: number]) {
			return data[0];
		},
		imgText(data) {
			return data[0];
		},
	},
	[EFFECT_OBJECT_NAME.rellPBreakMold]: {
		sourceAbility: GameAbilityId.build(ABILITY_TYPE.champion, 'Rell', 'passive', 0),
		label: 'Break the Mold stacks',
		maxValue: async () => {
			const rell = await useChampion('Rell');
			return CHAMPION_SPECIFICS.Rell.MAX_PASSIVE_STACKS({ champion: { value: rell } } as DamageSource);
		},
		async setupData(data): Promise<[breakMoldStacks: number]> {
			return [clamp(0, data?.[0] ?? 0, await EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.rellPBreakMold].maxValue())];
		},
		isActive(data: [breakMoldStacks: number]) {
			return data[0];
		},
		imgText(data) {
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
	setupData: (data?: IDamageSourceEffect['data']) => Promise<IDamageSourceEffect['data']> | IDamageSourceEffect['data'];
	/** checks if effect's data is not the default value */
	isActive: (data: any) => number | boolean;
	imgText?: (data: any) => number | string;
	/** @default 0 */
	minValue?: number;
	/** @default 1 */
	maxValue?: number | (() => Promise<number> | number);
}

export const EFFECT_SPECIFICS_OBJECT_ENTRIES = Object.entries(EFFECT_SPECIFICS) as [IEffectObjectName, IEffectSpecific][];

export const CUSTOM_EFFECT_IMAGES: Partial<Record<IEffectObjectName, [ path: string, imgSize: number ]>> = {
	[EFFECT_OBJECT_NAME.grievousWounds]: ['game/assets/spells/icons2d/gw_debuff.png', 64],
	[EFFECT_OBJECT_NAME.stun]: ['https://wiki.leagueoflegends.com/en-us/images/Keyword_Stun.svg', 32],
	[EFFECT_OBJECT_NAME.slowFlat]: ['https://wiki.leagueoflegends.com/en-us/images/Slow_icon.png', 65],
	[EFFECT_OBJECT_NAME.slowPercent]: ['https://wiki.leagueoflegends.com/en-us/images/Slow_icon.png', 65],
};
