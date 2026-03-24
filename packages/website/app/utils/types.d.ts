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
export type IPossibleDynamicValues = Partial<Record<'all' | IChampionAbilityKey, Record<string, (string | number)[]>>>;

/**
 * champions/runes can have dynamic variables, like veigar stacks, current aphelios gun rotation or scaling health rune shard current value
 * possible values for these can be specified in `champion.ts` and `rune.ts` under proper key, these are then used in calculations
 */
export type IWithCalculateDynamicValues = Record<string, { calculateDynamicVariables?: (damageSource: DamageSource) => any }>;

export interface IDamageResultTableSection {
	id: string;
	additionalId: IChampionId | 'all' | 'item';
	/** stats and basic attack cannot be removed */
	permanent?: boolean;
	/** `${champion.name} [${abilityHotkey}] - ${abilityVariant.name}` */
	name: string;
	image: string;
	// TODO shouldn't be optional
	getCellValue?: (section: IDamageResultTableSection, rowId: string, source: DamageSource, target?: DamageTarget) => {
		value: string | number;
		numberValue?: number;
		isUnknown?: boolean;
	} | undefined;
	/** when present, the row will have a select to choose from provided options used for setting `selectValue` */
	selectOptions?: [value: string, text: string][];
	/** use with selectOptions */
	selectValue?: string;
	/** use with selectOptions */
	selectLabel?: string;
	hoverTooltipData?: IChampionAbilityHoverTooltipProps;
	rows: {
		name: string;
		/** ability variable, like `physicalDamage` for `basicAttack` or `QDamage` */
		id: string;
		isUnknown?: boolean;
		icon?: {
			path: string;
			width: number;
			height: number;
		};
	}[];
}

export interface IDamageResultTableColumn {
	id: string;
	source?: DamageSource;
	target?: DamageSource;
}

export interface IChampionAbilityHoverTooltipProps {
	championId?: IChampionId;
	abilityKey?: IChampionAbilityKey;
	abilityVariant?: number;
	abilityLevel?: number;
	replaceVariablesWithNames?: boolean;
}
