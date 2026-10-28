import type { DamageSource, IComputedAbilityDescription, IComputedDragonAbilityDescription, IComputedItemDescription } from '@lolcalc/core/DamageSource';
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IGameImageData } from '@lolcalc/core/misc';
import type { IReplacedGameVariable, IVariableMeta } from '@lolcalc/core/variables/game';
import type { IItem } from '@lolcalc/data/types';
import type { IChampionAbilityKey, VariableType } from '@lolcalc/shared/index';

export interface IDamageResultTableSection {
	/** stringified `GameAbilityId` or freestyled for `all` */
	id: string;
	abilityId: { id: string; type: 'all' } | IGameAbilityId;
	/** when the underlying ability is not implemented. Currently for most non-passive champion abilities, using `IMPLEMENTED_CHAMPION_IDS` to set the finished ones */
	notImplemented?: boolean;
	/** stats and basic attack cannot be removed */
	isPermanent?: boolean;
	/* section is the custom total section */
	isCustomTotal?: boolean;
	/* section is the custom value section */
	isCustomValue?: boolean;
	/* remove will be erase instead */
	clearable?: ComputedRef<boolean | number | undefined>;
	/** `${champion.name} [${abilityHotkey}] - ${abilityVariant.name}` */
	name: string;
	/** technically should always be present but it can be undefined while async stuff is resolving */
	image: ShallowRef<IGameImageData | undefined>;
	/** expected to be undefined only when loading */
	getCellValue?: (
		section: IDamageResultTableSection,
		rowId: string,
		source?: DamageSource,
		target?: DamageTarget,
	) =>
		| {
				/** formatted `numberValue` */
				value: string | number;
				numberValue?: number;
				isUnknown?: boolean;
				isPercentage?: boolean;
				meta?: IReplacedGameVariable['meta'];
		  }
		| undefined;
	/** when present, the row will have a select to choose from provided options used for setting `selectValue` */
	selectOptions?: Raw<[value: string, text: string][]>;
	/** use with selectOptions */
	selectValue?: string;
	/** use with selectOptions */
	selectLabel?: string;
	hoverTooltipData: ShallowRef<string | IChampionAbilityHoverTooltipProps | Pick<IItemDescriptionProps, 'precomputedDescription'> | IEffectHoverTooltipProps | Pick<IDragonHoverTooltipProps, 'precomputedDescription'> | undefined>;
	rows: ShallowRef<IDamageResultTableSectionRow[]>;
}

export interface IDamageResultTableColumn {
	id: string;
	source?: DamageSource;
	target?: DamageSource;
	/**
	 * column's `target` but with effects applied by source (usually steming from items, like Serpent's Fang's "apply Shield Reave on target")
	 * it's supposed to be made by cloning the target in CalculatorResultsTable's `recalculateColumn`, then adding all effects got from `@lolcalc/core/specifics/effects`' `effectsAppliedBy(column.target)`
	 *
	 * note that while the table results can be flipped, this is only for the `column.target`. It doesn't get recomputed to `column.source`, despite it being shown as "target" when table is flipped. Applying effects from items/runes/abilites works only from source -> target, not the other way around. To apply effects on the source, add them directly through `.addEffect()`
	 *
	 * @note calculations should probably be refactored to avoid having `_computedTarget` and `_computedSource` being duplicates of original sources, like extract calculations somewhere outside for results then take in source & target
	 */
	_computedTarget?: DamageSource;
	/** same as _computedTarget */
	_computedSource?: DamageSource;
}

export interface IDamageResultTableSectionRow {
	name: string;
	/** ability variable, like `physicalDamage` for `basicAttack` or `QDamage` */
	id: string;
	isUnknown?: boolean;
	isCustom?: IVariableMeta['isCustom'];
	additionalInfo?: IVariableMeta['additionalInfo'];
	image?: IGameImageData;
}

export interface ICustomTotalSectionRow extends IDamageResultTableSectionRow {
	sectionId: string;
	section: IDamageResultTableSection;
	/** the index the target row is at in its section */
	rowIndex: number;
}

export interface ICustomValueSectionRow extends IDamageResultTableSectionRow {
	type: VariableType;
	value?: number;
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
	overrideDamageSource?: DamageSource;
}

export interface IDragonHoverTooltipProps {
	idSuffix?: string;
	/** either this and `type` or `precomputedDescription` should be provided */
	dragon?: IDragonName;
	/** either this and `dragon` or `precomputedDescription` should be provided */
	type?: 'stack' | 'soul';
	checkIfValid?: boolean;
	damageSource?: DamageSource;
	/** either this or `dragon` and `type` should be provided */
	precomputedDescription?: IComputedDragonAbilityDescription;
}

export interface IItemDescriptionProps {
	gold?: number;
	headerTag?: string;
	headerButton?: boolean;
	headerSubtitles?: boolean;
	damageSource?: DamageSource;
	replaceVariablesWithNames?: boolean;
	/** either this or `item` should be provided */
	precomputedDescription?: IComputedItemDescription;
	/** either this or `precomputedDescription` should be provided */
	item?: IItem;
	hoverTooltip?: boolean;
	source: IItemHoverTooltipView;
	showMasterwork?: boolean;
}

export interface IExtraComponentProps<BindData = unknown> {
	damageSource: DamageSource;
	/** if present, will be passed to `onImgMouseEnter` args emit, very few components use it at the moment. Currently used for Aphelios gravitum slow */
	overrideDamageSource?: DamageSource;
	idSuffix: string;
	/** it's not consistently provided and shouldn't really be relied upon. It's mostly declared so that there's no `ability-id="[Object object]"` in the dom. Used by tear item extra, provided in scoreboard item */
	abilityId?: IGameAbilityId;
	/** either the return value of `useHoverTooltip().bind` or a function that will call it */
	tooltipTriggerAttrs?:
		| Record<string, never>
		| ((
				abilityId: IGameAbilityId,
				/** any data the component wants to pass to `useHoverTooltip().show`, in addition to whatever parent decides to pass */
				additionalData?: MaybeRefOrGetter<Partial<BindData>>,
		  ) => any);
}

export interface ISpecificComponents {
	extras?: Component | Component[];
	effects?: Component | Component[];
}

export interface IScoreboardItemChampionAbilityTooltipShowData {
	key: IChampionAbilityKey;
	variantIndex?: number;
	fromExtras?: boolean;
	damageSource?: DamageSource;
}
