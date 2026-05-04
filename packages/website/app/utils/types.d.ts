import type { DamageSource, IComputedAbilityDescription } from '@lolcalc/core/DamageSource';
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId, IItemAbilityId } from '@lolcalc/core/GameAbilityId';
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
	isCustomTotal?: boolean;
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
		image?: {
			src: string;
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
	replaceVariablesWithNames?: boolean;
	abilityLevel?: number;
	/** either this or `precomputedDescription` should be provided */
	gameAbilityId?: IChampionAbilityId;
	/** either this or `gameAbilityId` should be provided */
	precomputedDescription?: IComputedAbilityDescription;
}

export interface IEffectHoverTooltipProps {
	abilityId?: IEffectAbilityId;
	damageSource?: DamageSource;
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
	/** either this or `precomputedDescription` should be provided */
	item?: IItem;
	hoverTooltip?: boolean;
	source: IItemHoverTooltipView;
}

export interface IExtraComponentProps<Type extends TAbilityType> {
	damageSource: DamageSource;
	idPrefix: string;
	abilityId: Type extends 'champion' ? IChampionAbilityId : IItemAbilityId;
	/*
	 * declared both here and in emits to override the listener attaching onto actual extra component
	 * as in without it 2 `@img-mouseenter` events happen, one from something like `VExtraBoolean.vue`, other from `booleanExtra()` wrapper
	 */
	onImgMouseenter?: (...args: IExtraComponentEmits['imgMouseenter']) => void;
}

export interface IExtraComponentEmits {
	imgMouseenter: [event: MouseEvent, abilityId: IGameAbilityId];
}

export interface ISpecificComponents {
	extras?: Component | Component[];
	effects?: Component | Component[];
}
