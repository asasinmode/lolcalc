import type { Component } from 'vue';

export type UnionKeys<T> = T extends T ? keyof T : never;

export interface ITexture {
	spriteSheet: string;
	resWidth: number;
	resHeight: number;
	uv: number[];
}

export interface IShopItem {
	item: IItem;
	/**
	 * -1 = locked (already have item of this group)
	 *	0 = inventory full
	 *	1 = can buy
	 */
	buyability: -1 | 0 | 1;
	calculatedPrice: number;
	isBought?: boolean;
	from?: IShopItem[];
	isLegendary: boolean;
	srStatus: string;
}

/**
 * champions/runes can have dynamic variables, like veigar stacks, current aphelios gun rotation or scaling health rune shard current value
 * possible values for these can be specified in `champion.ts` and `rune.ts` under proper key, these are then used for saving needed stringtable variables when getting game data
 */
export type IWithPossibleDynamicValues = Record<string, {
	POSSIBLE_DYNAMIC_VALUES?: IPossibleDynamicValues;
}>;

/**
 * record containing possible values for a champion/rune-specific variable. The ones under `all` are used first, then overriden by ability specific ones (if they exist)
 */
export type IPossibleDynamicValues = Partial<Record<'all' | keyof IChampion['abilities'], Record<string, (string | number)[]>>>;

/**
 * champions/runes can have dynamic variables, like veigar stacks, current aphelios gun rotation or scaling health rune shard current value
 * possible values for these can be specified in `champion.ts` and `rune.ts` under proper key, these are then used in calculations
 */
export type IWithCalculateDynamicValues = Record<string, { calculateDynamicVariables?: (damageSource: DamageSource) => any }>;

/**
 * same as `IWithPossibleDynamicValues` except for components
 */
export type ISpecificsWithComponents = Record<string, { components?: { extras?: Component } }>;
