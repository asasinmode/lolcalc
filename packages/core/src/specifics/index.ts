import type { IChampionId } from '@lolcalc/data/types';
import type { IChampionStatName, TItemNameToId } from '@lolcalc/shared';
import type { DamageSource, ICalculateChampionStatsHookSource } from '../DamageSource';
import type { IChampionAbilityId, IDragonAbilityId, IEffectAbilityId, IGameAbilityId, IItemAbilityId } from '../GameAbilityId';
import type { IDynamicVariables, IGameVariableType, IGameVariableValueParameters, IVariableMeta } from '../variables/game.ts';
import type { TChampionSpecifics } from './champion';
import type { CHAMPION_SPECIFICS } from './champion.ts';
import type { TDragonSpecifics } from './dragon.ts';
import type { TEffectSpecifics } from './effect';
import type { TItemSpecifics } from './item';
import type { ITEM_SPECIFICS } from './item.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { ITEM_NAME_TO_ID } from '@lolcalc/shared';

export const HOOK_PRIORITIES = {
	preItemTotal: {
		[ITEM_NAME_TO_ID.guinsoo]: 10,
		[ITEM_NAME_TO_ID.overlordsBloodmail]: 10,
		[ITEM_NAME_TO_ID.riftmaker]: 20,
	},
	preBonus: {
		[ITEM_NAME_TO_ID.overlordsBloodmail]: 10,
	},
	onTotalPreMultipliers: {
		[ITEM_NAME_TO_ID.overlordsBloodmail]: 10,
		/** should be TODO after overlord's bloodmail */
		[ITEM_NAME_TO_ID.endlessHunger]: 20,
	},
	postTotal: {
		Ryze: 1,
	},
} satisfies Partial<Record<keyof ICalculateChampionStatsHookSource, Partial<Record<IChampionId | (string & {}), number>>>>;

export const ITEM_SPECIFICS_SHARED = {
	[ITEM_NAME_TO_ID.archangelsStaff]: {
		AP_FROM_MANA: ITEMS_BY_NAME.archangelsStaff?.dataValues.APFromMana,
	},
	[ITEM_NAME_TO_ID.seraphsEmbrace]: {
		AP_FROM_MANA: ITEMS_BY_NAME.seraphsEmbrace?.dataValues.APFromMana,
	},
	[ITEM_NAME_TO_ID.wintersApproach]: {
		HP_FROM_MANA: ITEMS_BY_NAME.wintersApproach?.itemCalculations.BonusHPFromMana.mFormulaParts[0]!.mCoefficient,
	},
	[ITEM_NAME_TO_ID.fimbulwinter]: {
		HP_FROM_MANA: ITEMS_BY_NAME.fimbulwinter?.itemCalculations.BonusHPFromMana.mFormulaParts[0]!.mCoefficient,
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		HP_TO_AP: ITEMS_BY_NAME.riftmaker?.dataValues.HealthToAPConversionPercent,
	},
};

// for getting specific ability's specific, maybe will be useful
// ? T['id'] extends keyof TChampionSpecifics
// 	? T['abilityKey'] extends keyof TChampionSpecifics[T['id']]
// 		? T['abilityVariantIndex'] extends keyof TChampionSpecifics[T['id']][T['abilityKey']]
// 			? TChampionSpecifics[T['id']][T['abilityKey']][T['abilityVariantIndex']]
// 			: never
// 		: never
// 	: never

export type IGameAbilitySpecific<T extends IGameAbilityId> = T extends IChampionAbilityId
	? T['id'] extends keyof TChampionSpecifics
		? TChampionSpecifics[T['id']]
		: never
	: T extends IEffectAbilityId
		? T['id'] extends keyof TEffectSpecifics
			? TEffectSpecifics[T['id']]
			: never
		: T extends IDragonAbilityId
			? T['id'] extends keyof TDragonSpecifics
				? T['subtype'] extends keyof TDragonSpecifics[T['id']]
					? TDragonSpecifics[T['id']][T['subtype']]
					: never
				: never
			: T extends IItemAbilityId
				? T['id'] extends keyof TItemSpecifics
					? TItemSpecifics[T['id']]
					: never
				: never;

export type IGameAbilityData<T extends IGameAbilityId, Specific = IGameAbilitySpecific<T>>
	= Specific extends { setupData: (...args: any) => any }
		? UnwrapPromise<ReturnType<Specific['setupData']>>
		: never;

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type IInternalDataOf<Champion extends keyof TChampionSpecifics> = IGameAbilityData<any, (typeof CHAMPION_SPECIFICS)[Champion]>;

export type IInternalItemDataOf<K extends keyof TItemNameToId>
	= K extends any
		? IGameAbilityData<any, (typeof ITEM_SPECIFICS)[TItemNameToId[K] & keyof typeof ITEM_SPECIFICS]>
		: never;

export interface ICalculatesFromPart {
	stat?: 'const' | 'level' | Exclude<IChampionStatName, 'slowResist'>;
	/** technically `base` is not the actual `stats.base` but some items, like dawncore, show "x% base", by which it means "item" so when it's set to `base`, that will be appended to the value */
	type?: 'base' | 'baseOnLevel' | 'bonus' | 'total';
	/** when array, expected to be for melee/ranged values */
	value: number | { min: number; max: number } | [number, number] | [{ min: number; max: number }, { min: number; max: number }];
	isPercentage?: boolean;
}

export interface IVariableValueResult<T = string | number | [number | string | undefined, number | string | undefined]> {
	/** if not found, `undefined`. Otherwise a `number` if value is the same regardless of range or `[number, number]` for melee and ranged champions respectively */
	value?: T;
	/**
	 * if `true`, the variable is different for melee and ranged champions and the calculation target's range is unknown
	 * if `0`, same as `true` except the target is melee
	 * if `1`, same as `true` except the target is ranged
	 */
	isMeleeRanged?: true | 0 | 1;
	/** returns the variable name stripped of any dot path (`AdditionalUltAH.0` -> `AdditionalUltAH`) or `undefined` if same as provided */
	actualVariableName?: string;
	/** all values the variable lists, like champion Q levels 0-6 */
	allValues?: number[];
	meta?: IVariableMeta;
	/**
	 * usually when value was calculated in some way and might have floating points that should be rounded in description
	 * if `number`, assumed to be `roundVariable`'s `precision` parameter
	 */
	roundReplaced?: boolean | number;
	isPercentage?: boolean;
	multiplier?: number;
	/** whether `ISpecificVariables.uninteresting` includes it */
	isUninteresting?: boolean;
	/** components the variable was calculated from, used for creating `extendedEquals` */
	calculatesFrom?: ICalculatesFromPart[];
}

/** the related calculations and meta of a game specific's (item/champion/rune/...) variables */
export interface ISpecificVariables<
	DetectedVariables extends string = string,
	T extends string = DetectedVariables,
	Id extends IChampionId | undefined = IChampionId,
	VariableType extends IGameVariableType = IGameVariableType,
> {
	/**
	 * record containing possible dynamic values for an ability variable (all values the variable is expected to resolve to)
	 * used for stringtable variables like `{{ Spell_ApheliosQ_Tooltip_@f3@ }}`
	 * but also for reporting unresolved description variables (if not found during `updateData`, will be reported as unknown)
	 * the values here are used to generate `default` values (with `defineVariables`) and they must be calculated in `calculate`
	 *
	 * if empty `[]`, variable is used like `&lt;scaleAP&gt;Ability Power by \@APAmp*100\@%&lt;/scaleAP&gt;`
	 *
	 * if not empty, it's either used for resolving a stringtable variable like `{{ game_spell_Kayn_Q_main_@f1@ }}` or the specified values should be displayed in the replaced description instead of the default `0`, for example `f6: [ITEMS_BY_NAME.bloodsong?.dataValues.StealthWardCap]`
	 */
	known?: NoInfer<Partial<Record<DetectedVariables, (number | string)[]>>> & Record<T, (number | string)[]>;
	/**
	 * the first value of each `known` variable, computed from `known` by the `defineVariables` function
	 * used for game descriptions created without damage source like the ones for effects or in results
	 * if `known` is empty `[]`, the value will be `0`
	 * if variable is named `lolcalcChampRange`, value will be `[value[0] ?? 0, value[1] ?? 0]` so it's detected as a melee/ranged variable in `replaceGameVariables`
	 */
	default?: NoInfer<Partial<Record<DetectedVariables, Pick<IVariableValueResult, 'value'>>> & Record<T, Pick<IVariableValueResult, 'value'>>>;
	/**
	 * calculate any dynamic variables used in the ability's description
	 *
	 * note that while variables can rely on already calculated stats like `damageSource.stats.value.variables.manaMuraAwe`, the should still fallback to actual calculation since these variables on stats are only calculated when the damage source actually has that item. When the item is hovered in item shop, before being bought, the values need to be calculated from scratch
	 *
	 * @example
	 * ```ts
	 * calculate(self) {
	 *   return {
	 *     f1: {
	 *       value: self.stats.value.variables.riftmakerVoidInfusion
	 *				 ?? (self.stats.value.bonus.hp * ITEMS_BY_NAME.riftmaker.dataValues.HealthToAPConversionPercent),
	 *     }
	 *   }
	 * }
	 * ```
	 */
	calculate?: (self: DamageSource<Id>, damageTarget?: DamageSource) => NoInfer<Partial<Record<
		DetectedVariables,
		IVariableValueResult | [IVariableValueResult, IVariableValueResult]
	>>> & Record<
		T,
		IVariableValueResult | [IVariableValueResult, IVariableValueResult]
	>;
	/** any dynamic variables' meta information like icon of the stat they scale from. */
	meta?: NoInfer<Partial<Record<T | DetectedVariables, IVariableMeta<IGameVariableValueParameters[VariableType]>>>>;
	/**
	 * variables listed here won't be shown in results, as well as have their actual values resolved regardless of the `replaceWithName` option of `replaceGameVariables`
	 * the type works almost perfectly except that when no other keys (known/calculate/meta) is provided, then it resolves to `string[]` but at the moment I can't find a fix for it
	 */
	// TODO 'Cooldown' to be resolved in future features
	uninteresting?: NoInfer<(DetectedVariables | T | 'Cooldown')>[];
}

export function defineVariables<
	DetectedVariables extends string = string,
	T extends string = string,
	Id extends IChampionId | undefined = IChampionId,
	U extends IGameVariableType = IGameVariableType,
>(
	config: Omit<ISpecificVariables<DetectedVariables, T, Id, U>, 'default'>,
): ISpecificVariables<DetectedVariables, T, Id, U> {
	return Object.assign(config, {
		default: config.known && Object.fromEntries(Object.entries(config.known).map(([key, value]) => {
			return [key, { value: key === 'lolcalcChampRange'
				? [(value as number[])[0] ?? 0, (value as number[])[1] ?? 0]
				: ((value as (string | number)[])[0] ?? 0) }];
		},
		)) as ISpecificVariables<DetectedVariables, T, Id, U>['default'],
	});
}

export function calculateDynamicVariables(self: DamageSource, damageTarget?: DamageSource, config?: ISpecificVariables<string, string, IChampionId, any>): IDynamicVariables | undefined {
	return config && {
		values: config.calculate?.(self, damageTarget),
		meta: config.meta,
		uninteresting: config.uninteresting,
	};
}

/* `known` array values are used during `updateData` to find all used stringtable variables, while here they have to be resolved so that they can be used for descriptions without underlying damage source, like champion's ability effect */
export function specificKnownVariables(config?: ISpecificVariables<any, any, any, any>): IDynamicVariables | undefined {
	return config && {
		values: config.default,
		meta: config.meta,
		uninteresting: config.uninteresting,
	};
}
