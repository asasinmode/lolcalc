import type { IItemCategory } from '@lolcalc/shared';
import type { IChampionRole, ITexture } from '@lolcalc/shared/types';
import type { IItemShopStatFilter } from './meta';
import type { IChampion, IChampionId, IDragonName, IItem, IListedChampion, IRunes, IRuneSlotName } from './types';
import { markRaw } from 'vue';
import championData from '../files/champion.json' with { type: 'json' };
import effectData from '../files/effect.json' with { type: 'json' };
import itemData from '../files/item.json' with { type: 'json' };
import miscData from '../files/misc.json' with { type: 'json' };
import runeData from '../files/rune.json' with { type: 'json' };
import textData from '../files/text.json' with { type: 'json' };
import uiData from '../files/ui.json' with { type: 'json' };
import { STAT_ICON } from './meta.ts';

export const PATCH_VERSION = {
	vSemver: championData.version as string,
	/** semver up without patch */
	vMinor: championData.version.slice(0, championData.version.lastIndexOf('.')) as string,
};

export const CHAMPIONS = championData.data satisfies Record<IChampionId, IListedChampion> as IChampionData;

type IChampionData = { [Id in IChampionId]: IListedChampion<Id> };

export const CHAMPION_KEY_TO_ID: Record<string, IChampionId> = Object.fromEntries(
	Object.entries(championData.data).map(([id, { key }]) => [key, id as IChampionId]),
);

export const CHAMPION_ID_TO_KEY: Record<IChampionId, string> = Object.fromEntries(
	Object.entries(CHAMPION_KEY_TO_ID).map(([key, id]) => [id as IChampionId, key]),
) as Record<IChampionId, string>;

const championCache = new Map<IChampionId, Promise<IChampion>>();

export function useChampion(id: IChampionId | (string & {})): Promise<IChampion> {
	const cacheHit = championCache.get(id as IChampionId);
	if (cacheHit) {
		return cacheHit;
	}
	/** conditional parse because raw node imports it properly as json and nuxt imports a string */
	const promise = import(/* @vite-ignore */ `../files/champion/${id}.json?raw`, { with: { type: 'json' } }).then(module => typeof module.default === 'string' ? JSON.parse(module.default) : module.default);
	championCache.set(id as IChampionId, promise);
	return promise;
}

for (const item of Object.values(itemData.data)) {
	markRaw(item);
}

export const ITEMS = itemData.data satisfies Record<string, IItem> as Record<string, IItem>;

/**
 * the const type of the `item.json` file for accessing specific things without losing the types from `ITEMS` having its own, looser type
 * @example
 * ```ts
 * const maxDarkSealStacks = (ITEMS as TItems)[ITEM_NAME_TO_ID.darkSeal].dataValues.MaxGloryStacks;
 * ```
 */
export type TItems = typeof itemData['data'];

export const RUNES = runeData.data as IRunes;

/**
 * the const type of the `rune.json` file for accessing specific things without losing the types from `RUNES` having its own, looser type
 * @example
 * ```ts
 * const adaptiveForceAD = (RUNES as TRunes).shards.offensive.adaptive.effectAmount.StatGain1;
 * ```
 */
export type TRunes = typeof runeData['data'];

export const RUNE_SLOT_NAME_TO_NUMBER = Object.fromEntries(Object.entries(runeData.data.paths)
	.flatMap(([, { slots }]) =>
		slots.flatMap((slot, slotIndex) => Object.keys(slot).map(slotName => [slotName, slotIndex])),
	),
) as Record<IRuneSlotName, number>;

export const EFFECTS: IEffectData = effectData.data;

export type TEffects = typeof effectData['data'];

export const EFFECTS_STRINGTABLE = effectData.stringtable as Record<string, string>;

export interface IEffectData extends Record<string, {
	description: string;
	dataKey: string;
}> {};

export const TEXT = textData.data satisfies ITextData as ITextData;

export interface ITextData {
	items: Record<string, {
		subtitleLeft?: string;
		subtitleRight?: string;
		/** the extra text that's below the stats when hovering item in shop */
		tooltipShop?: string[][];
		/**
		 * same as `extrasShop` but in inventory
		 * present if source has it and is different from the shop one
		 * differs in for example using the computed variables for the champion like AD gained from Overlord's Bloodmail
		 */
		tooltipInventory?: string[][];
		/** the additional, usually gray, text shown below the stats and any descripiton */
		extended?: string;
		/** text in the footer, same spot as `Press [Shift] to...`, usually showing the value of a dynamic variable like `Giant Slayer Bonus Damage: \@f1\@` */
		footerLeft?: string;
		/** keyword definition like `Wounds: Reduces the effectiveness...` */
		keywordDefinitions?: string;
	}>;
	runes: {
		paths: Record<string, { name: string; tooltip: string }>;
		slots: Record<string, {
			name: string;
			/** champ select rune dialog hover */
			tooltipShort: string;
			/** champ select rune dialog hover + shift */
			tooltipLong: string;
			/** the tooltip displayed when hovering over the in game stats panel */
			tooltipStats: string;
		}>;
		shards: {
			slotNames: Record<string, { name: string }>;
			slotValues: Record<string, {
				name: string;
				/** champ select rune dialog hover */
				tooltip: string;
				/** the tooltip displayed when hovering over in game stats panel */
				tooltipStats: string;
			}>;
		};
	};
	dragons: Record<IDragonName, {
		stack: string;
		soul: string;
	}>;
	roleQuests: Record<IChampionRole, string[]>;
	stringtable: Record<string, string>;
}

export const MISC: IMiscData = miscData.data;

export const ALL_DRAGON_NAMES = Object.keys(MISC.dragons) as IDragonName[];

interface IMiscData {
	dragons: Record<IDragonName, {
		name: string;
		stack: {
			objectName: string;
			dataValues: any;
		};
		soul: {
			objectName: string;
			dataValues: any;
		};
	}>;
}

export const UI: IUiData = uiData.data;

interface IUiData {
	shop: {
		categories: Record<IItemCategory | 'all', ITexture>;
		stats: Record<IItemShopStatFilter, { default: ITexture; selected: Pick<ITexture, 'uv'> }>;
		clearFilters: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
		};
		swapItemOrder: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
		};
		pin: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
			slcHover: Pick<ITexture, 'uv'>;
		};
	};
	playerStats: Record<string, ITexture>;
	dragons: Record<IDragonName, {
		stack: ITexture;
		soulActive: ITexture;
	}>;
	practiceTool: {
		statusEffect: ITexture;
	};
}

export const CHAMPION_IMAGES = {
	championImage(image: string, championId: IChampionId): string {
		return championId === 'TargetDummy'
			? `https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/game/${image}`
			: `https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION.vSemver}/img/champion/${image}`;
	},
	abilityImage(path: string, championId: IChampionId, group: 'sources' | 'targets' = 'sources'): string {
		path = championId === 'TargetDummy'
			? path
					.replace('%s1', group === 'sources' ? 'order' : 'chaos')
					.replace('%s2', group === 'sources' ? 'blue' : 'red')
			: path;
		return `https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/game/${path}`;
	},
	championImageSize(championId: IChampionId): number {
		return championId === 'TargetDummy' ? 64 : 128;
	},
	abilityImageSize(championId: IChampionId): number {
		return championId === 'TargetDummy' ? 128 : 64;
	},
};

export const ICON_COOLDOWN_IMG: string = `<img src="https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png" width="20" height="20" aria-hidden="true">`;

export const ICON_ON_HIT_IMG: string = `<img src="https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${STAT_ICON.OnHit}.png" width="20" height="20" aria-hidden="true">`;

export const ICON_RUNE_SRC: string = `https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`;
