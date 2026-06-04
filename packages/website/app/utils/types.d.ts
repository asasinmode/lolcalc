import type { DamageSource, IComputedAbilityDescription, IComputedItemDescription } from '@lolcalc/core/DamageSource';
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId, IItemAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IReplacedGameVariable } from '@lolcalc/core/types';
import type { IItem } from '@lolcalc/data/types';

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
		/** formatted `numberValue` */
		value: string | number;
		numberValue?: number;
		isUnknown?: boolean;
		meta?: IReplacedGameVariable['meta'];
	} | undefined;
	/** when present, the row will have a select to choose from provided options used for setting `selectValue` */
	selectOptions?: Raw<[value: string, text: string][]>;
	/** use with selectOptions */
	selectValue?: string;
	/** use with selectOptions */
	selectLabel?: string;
	hoverTooltipData?: IChampionAbilityHoverTooltipProps | Pick<IItemDescriptionProps, 'precomputedDescription'> | IEffectHoverTooltipProps;
	rows: {
		name: string;
		/** ability variable, like `physicalDamage` for `basicAttack` or `QDamage` */
		id: string;
		isUnknown?: boolean;
		isCustom?: boolean;
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
