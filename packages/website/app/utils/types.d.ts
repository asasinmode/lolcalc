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
 * record containing possible dynamic values for a variable (all values the variable is expected to resolve to)
 * used for stringtable variables like `{{ Spell_ApheliosQ_Tooltip_@f3@ }}`
 */
export type IPossibleDynamicValues = Record<string, (string | number)[]>;

/**
 * champions/runes can have dynamic variables, like veigar stacks, current aphelios gun rotation or scaling health rune shard current value
 * possible values for these can be specified in `champion.ts` and `rune.ts` under proper key, these are then used in calculations
 */
export type IWithCalculateDynamicValues = Record<string, { calculateDynamicVariables?: (damageSource: DamageSource) => any }>;

export interface IDamageResultTableSection {
	/** stringified `GameAbilityId` or freestyled for `all` */
	id: string;
	abilityId: { id: string; type: 'all' } | IGameAbilityId;
	/** stats and basic attack cannot be removed */
	isPermanent?: boolean;
	/** `${champion.name} [${abilityHotkey}] - ${abilityVariant.name}` */
	name: string;
	image?: string;
	imageSize: number;
	/** expected to be undefined only when loading */
	getCellValue?: (section: IDamageResultTableSection, rowId: string, source?: DamageSource, target?: DamageTarget) => {
		value: string | number;
		numberValue?: number;
		isUnknown?: boolean;
	} | undefined;
	/** when present, the row will have a select to choose from provided options used for setting `selectValue` */
	selectOptions?: Raw<[value: string, text: string][]>;
	/** use with selectOptions */
	selectValue?: string;
	/** use with selectOptions */
	selectLabel?: string;
	hoverTooltipData?: IChampionAbilityHoverTooltipProps | Pick<IItemDescriptionProps, 'precomputedDescription'>;
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
	/** used for target dummy's abilities */
	group?: 'sources' | 'targets';
	/** required for tooltip component to work really TODO try to make it make sense */
	championId?: IChampionId;
	/** required for tooltip component to work really TODO try to make it make sense */
	abilityKey?: IChampionAbilityKey;
	/** required for tooltip component to work really TODO try to make it make sense */
	abilityVariantIndex?: number;
	abilityLevel?: number;
	replaceVariablesWithNames?: boolean;
	precomputedDescription?: IComputedAbilityDescription;
}

export interface IItemDescriptionProps {
	gold?: number;
	headerTag?: string;
	headerButton?: boolean;
	headerClass?: string;
	descriptionClass?: string;
	headerSubtitles?: boolean;
	damageSource?: DamageSource;
	replaceVariablesWithNames?: boolean;
	/** either this or `item` should be provided */
	precomputedDescription?: IComputedItemDescription;
	/** either this or `item` should be provided */
	item?: IItem;
	hoverTooltip?: boolean;
	source: IItemHoverTooltipView;
}

export interface IExtraComponentProps<Type extends TAbilityType> {
	damageSource: DamageSource;
	idPrefix: string;
	abilityId: Type extends 'champion' ? IChampionAbilityId : IItemAbilityId;
}

export interface IExtraComponentEmits {
	imgMouseenter: [event: MouseEvent, abilityId: IGameAbilityId];
}

export interface ISpecificComponents {
	extras?: Component;
	effects?: Component;
}

export interface IChampionAbilityId<
	Id extends IChampionId = IChampionId,
	Source extends TAbilityDataSource = TAbilityDataSource,
	AbilityKey extends IChampionAbilityKey = IChampionAbilityKey,
	AbilityVariantIndex extends number = number,
> {
	type: typeof ABILITY_TYPE['champion'];
	id: Id;
	dataSource: Source;
	abilityKey: AbilityKey;
	abilityVariantIndex: AbilityVariantIndex;
}

export interface IItemAbilityId<Id extends string = string, Source extends TAbilityDataSource = TAbilityDataSource> {
	type: typeof ABILITY_TYPE['item'];
	/** item id */
	id: Id;
	dataSource: Source;
}

export type IGameAbilityId = IChampionAbilityId | IItemAbilityId;

export type IProviderGroupEffect = {
	setupEffectData?: never;
	isEffectActive?: never;
} | IDamageSourceEffectProvider;

export type IProviderGroupInternalData = { setupInternalData?: never } | IDamageSourceInternalDataProvider;

export type IProviderGroupInternalItemData = {
	setupInternalData?: never;
	internalDataProperties?: never;
} | IDamageSourceInternalItemDataProvider;

export type IProviderGroupImageText = {
	itemImageText?: never;
	itemImageTextLabel?: string;
} | {
	/**
	 * text on the item's image, like current heartsteel/mejai stacks
	 * must return data for `internalItemData` or `appliedEffects` based on the passed `abilitySource`
	 * `property` is the key/index based the text is expected for
	 */
	itemImageText: (damageSource: DamageSource, abilityId: IGameAbilityId, property?: any) => string | number;
	/** sr only label for the shown image text */
	itemImageTextLabel: string;
};
