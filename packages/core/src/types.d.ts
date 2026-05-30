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

export interface IReplacedGameVariable {
	baseValue: number | [number, number];
	value: number | [number, number];
	meta?: IVariableMeta;
	isUninteresting?: boolean;
}

export interface IReplaceGameVariablesRV {
	replaced: string;
	variables: Map<string, IReplacedGameVariable>;
	/** all found variables' listed values, expected on champion variables like values for Q level 0-6 */
	variablesAllValues: Map<string, (string | number)[]>;
	unknownVariables: [rawName: string, actualName?: string][];
	/** whether any of the detected variables has additional info expected to be shown in the extended version (when holding shift) */
	anyExtendedVariables: boolean;
}

export interface IReplaceStringtableVariablesRV {
	replaced: string;
	stringtableVariables: Map<string, string>;
	unknownStringtableVariables: Map<string, Set<string>>;
}

/** creates a union of all variable properties detected on an item */
export type DetectItemVariables<T>
	= | (T extends { dataValues: object } ? keyof T['dataValues'] : never)
		| (T extends { stringCalculations: object } ? keyof T['stringCalculations'] : never)
		| (T extends { itemCalculations: object } ? keyof T['itemCalculations'] : never);

/** creates a union of all variable properties detected on a champion */
export type DetectChampionVariables<T, AbilityKey extends IChampionAbilityKey = IChampionAbilityKey, U = T['abilities'][AbilityKey]['variants'][number]>
	= | (U extends { dataValues: any } ? keyof U['dataValues'] & string : never)
		| (U extends { spellCalculations: any } ? keyof U['spellCalculations'] & string : never);
