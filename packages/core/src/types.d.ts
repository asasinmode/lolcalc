import type { IChampionAbilityKey } from '@lolcalc/shared';

export type IProviderGroupDataSetup = { setupData?: never } | IDamageSourceInternalDataProvider;

export type IProviderGroupImageText = {
	imgText?: never;
	imgTextLabel?: never;
} | IAbilityImageTextProvider;

export type IProviderGroupEffect = {
	effectObjectName?: never;
} | IDamageSourceEffectProvider;

export type IProviderGroupInternalItemData = {
	setupData?: never;
	internalDataProperties?: never;
} | IDamageSourceInternalItemDataProvider;

export interface IAbilityImageTextProvider {
	/**
	 * text on the item's image, like current heartsteel/mejai stacks
	 */
	imgText: (damageSource: DamageSource, dataProperty?: any) => string | number;
	/** sr only label for the shown image text */
	imgTextLabel: string;
}

/** creates a union of all variable properties detected on an item */
export type DetectItemVariables<T>
	= | (T extends { dataValues: object } ? keyof T['dataValues'] : never)
		| (T extends { stringCalculations: object } ? keyof T['stringCalculations'] : never)
		| (T extends { itemCalculations: object } ? keyof T['itemCalculations'] : never);

/** creates a union of all variable properties detected on a champion */
export type DetectChampionVariables<T, AbilityKey extends IChampionAbilityKey = IChampionAbilityKey, U = T['abilities'][AbilityKey]['variants'][number]>
	= | (U extends { dataValues: any } ? keyof U['dataValues'] & string : never)
		| (U extends { spellCalculations: any } ? keyof U['spellCalculations'] & string : never)
		| (U extends { effectAmount: any } ? IEffectAmountKeys<U['effectAmount']> : never);

type IStrToNum<S extends string> = S extends `${infer N extends number}` ? N : never;

type ITuple<L extends number, T extends unknown[] = []> = T['length'] extends L ? T : ITuple<L, [...T, unknown]>;

type IIncrement<N extends number> = [...ITuple<N>, unknown]['length'];

type IEffectAmountKeys<T> = T extends Record<string, any>
	? { [K in keyof T & string]: `Effect${IIncrement<IStrToNum<K>>}Amount` }[keyof T & string]
	: never;
