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
	T extends string = string,
	Id extends IChampionId | undefined = undefined,
	PossibleUninterestingVariables extends string = string,
> {
	/**
	 * record containing possible dynamic values for an ability variable (all values the variable is expected to resolve to)
	 * used for stringtable variables like `{{ Spell_ApheliosQ_Tooltip_@f3@ }}`
	 * but also for reporting unresolved description variables (if not found during `updateData`, will be reported as unknown)
	 * they should be calculated in `calculate`
	 *
	 * if empty `[]`, variable is not expected to be used for resolving a stringtable value like `{{ game_spell_Kayn_Q_main_@f1@ }}` and is used like `&lt;scaleAP&gt;Ability Power by \@APAmp*100\@%&lt;/scaleAP&gt;`
	 */
	known?: Record<T, (string | number)[]>;
	/** calculate any dynamic variable used in the ability's description */
	calculate?: (self: DamageSource<Id>) => Record<T, ICalculatedDynamicVariable>;
	/**
	 * any dynamic variables' meta information like icon of the stat they scale from.
	 * this is added by `defineDynamicVariables` to `known` when called and later on added to calculated variables by `calculateDynamicVariables`
	 */
	meta?: Partial<Record<T, IVariableMeta>>;
	uninteresting?: (PossibleUninterestingVariables | NoInfer<T>)[];
}

export function defineVariables<T extends string, Id extends IChampionId | undefined = undefined, PossibleUninterestingVariables extends string = string>(
	config: ISpecificVariables<T, Id, PossibleUninterestingVariables>,
): ISpecificVariables<T, Id, PossibleUninterestingVariables> {
	return config;
}

export function calculateDynamicVariables(self: DamageSource, config?: ISpecificVariables): IDynamicVariables | undefined {
	return config && {
		values: config.calculate?.(self),
		meta: config.meta,
	};
}
