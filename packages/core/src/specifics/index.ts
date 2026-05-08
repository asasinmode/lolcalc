import type { IChampionId } from '@lolcalc/data/types';
import type { TItemNameToId } from '@lolcalc/shared';
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId } from '../GameAbilityId';
import type { IChampionSpecific, TChampionSpecifics } from './champion';
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
			? (CHAMPION_SPECIFICS as Partial<Record<IChampionId, IChampionSpecific>>)[abilityId.id]?.[abilityId.abilityKey]?.[abilityId.abilityVariantIndex] as IGameAbilitySpecific<T>
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

export type IInternalItemDataOf<K extends keyof TItemNameToId>
	= K extends any
		? IGameAbilityData<any, (typeof ITEM_SPECIFICS)[TItemNameToId[K] & keyof typeof ITEM_SPECIFICS]>
		: never;
