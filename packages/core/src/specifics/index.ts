import type { IChampionId } from '@lolcalc/data/types';
import type { TItemNameToId } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource';
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId } from '../GameAbilityId';
import type { IVariableMeta } from '../types';
import type { IDynamicVariables } from '../variables/game';
import type { IHypotheticalChampionSpecifics, TChampionSpecifics } from './champion';
import type { TEffectSpecifics } from './effect';
import type { TItemSpecifics } from './item';
import { ABILITY_TYPE } from '@lolcalc/shared';
import { CHAMPION_SPECIFICS } from './champion.ts';
import { EFFECT_SPECIFICS } from './effect.ts';
import { ITEM_SPECIFICS } from './item.ts';

export function resolveAbilitySpecific<T extends IGameAbilityId>(abilityId: T, warnPrefix?: string): IGameAbilitySpecific<T> | undefined {
	const specific = abilityId.type === ABILITY_TYPE.item
		? ITEM_SPECIFICS[abilityId.id as keyof TItemSpecifics] as IGameAbilitySpecific<T>
		: abilityId.type === ABILITY_TYPE.champion
			? (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[abilityId.id]?.[abilityId.abilityKey]?.[abilityId.abilityVariantIndex] as IGameAbilitySpecific<T>
			: abilityId.type === ABILITY_TYPE.effect
				? EFFECT_SPECIFICS[abilityId.id] as IGameAbilitySpecific<T>
				: undefined;

	if (!specific && warnPrefix) {
		console.warn(`[${warnPrefix}] failed to resolve specific for`, abilityId);
	}

	return specific;
}

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
		: T['id'] extends keyof TItemSpecifics
			? TItemSpecifics[T['id']]
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

export interface ICalculatedDynamicVariable {
	value: string | number | [number | undefined, number | undefined];
}

export type ICalculatedDynamicVariables<T extends string = string> = Record<T, ICalculatedDynamicVariable>;

/** the related calculations and meta of a game specific's (item/champion/rune/...) variables */
export interface ISpecificVariables<
	DetectedVariables extends string = string,
	T extends string = DetectedVariables,
	Id extends IChampionId | undefined = IChampionId,
> {
	/**
	 * record containing possible dynamic values for an ability variable (all values the variable is expected to resolve to)
	 * used for stringtable variables like `{{ Spell_ApheliosQ_Tooltip_@f3@ }}`
	 * but also for reporting unresolved description variables (if not found during `updateData`, will be reported as unknown)
	 * they should be calculated in `calculate`
	 *
	 * if empty `[]`, variable is not expected to be used for resolving a stringtable value like `{{ game_spell_Kayn_Q_main_@f1@ }}` and is used like `&lt;scaleAP&gt;Ability Power by \@APAmp*100\@%&lt;/scaleAP&gt;`
	 */
	known?: NoInfer<Partial<Record<DetectedVariables, (number | string)[]>>> & Record<T, (number | string)[]>;
	/**
	 * the first value of each `known` variable, computed from `known` by the `defineVariables` function
	 * used for game descriptions created without damage source like the ones for effects or in results
	 * if `known` is empty `[]`, the value will be `0`
	 * if variable is named `lolcalcChampRange`, value will be `[value[0] ?? 0, value[1] ?? 0]` so it's detected as a melee/ranged variable in `replaceGameVariables`
	 */
	default?: NoInfer<Partial<Record<DetectedVariables, Pick<ICalculatedDynamicVariable, 'value'>>> & Record<T, Pick<ICalculatedDynamicVariable, 'value'>>>;
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
	calculate?: (self: DamageSource<Id>) => NoInfer<Partial<Record<DetectedVariables, ICalculatedDynamicVariable>>> & Record<T, ICalculatedDynamicVariable>;
	/** any dynamic variables' meta information like icon of the stat they scale from. */
	meta?: Partial<Record<T, IVariableMeta>>;
	/**
	 * variables listed here won't be shown in results, as well as have their actual values resolved regardless of the `replaceWithName` option of `replaceGameVariables`
	 * the type works almost perfectly except that when no other keys (known/calculate/meta) is provided, then it resolves to `string[]` but at the moment I can't find a fix for it
	 */
	uninteresting?: NoInfer<(DetectedVariables | T)>[];
}

export function defineVariables<
	DetectedVariables extends string = string,
	T extends string = DetectedVariables,
	Id extends IChampionId | undefined = IChampionId,
>(
	config: Omit<ISpecificVariables<DetectedVariables, T, Id>, 'default'>,
): ISpecificVariables<DetectedVariables, T, Id> {
	return Object.assign(config, {
		default: config.known && Object.fromEntries(Object.entries(config.known).map(([key, value]) => {
			return [key, { value: key === 'lolcalcChampRange'
				? [(value as number[])[0] ?? 0, (value as number[])[1] ?? 0]
				: ((value as (string | number)[])[0] ?? 0) }];
		},
		)) as ISpecificVariables<DetectedVariables, T, Id>['default'],
	});
}

export function calculateDynamicVariables(self: DamageSource, config?: ISpecificVariables): IDynamicVariables | undefined {
	return config && {
		values: config.calculate?.(self),
		meta: config.meta,
		uninteresting: config.uninteresting,
	};
}

/* `known` array values are used during `updateData` to find all used stringtable variables, while here they have to be resolved so that they can be used for descriptions without underlying damage source, like champion's ability effect */
export function specificKnownVariables(config?: ISpecificVariables): IDynamicVariables | undefined {
	return config && {
		values: config.default,
		meta: config.meta,
		uninteresting: config.uninteresting,
	};
}
