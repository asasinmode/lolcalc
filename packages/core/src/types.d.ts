import type { STAT_ICON } from '@lolcalc/data';
import type { IVariableType } from '@lolcalc/shared';

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

export interface IReplaceGameVariablesRV {
	replaced: string;
	variables: Map<string, {
		baseValue: number | [number, number];
		value: number | [number, number];
		meta?: IVariableMeta;
		isUninteresting?: boolean;
	}>;
	/** all found variables' listed values, expected on champion variables like values for Q level 0-6 */
	variablesAllValues: Map<string, (string | number)[]>;
	unknownVariables: [rawName: string, actualName: string | undefined][];
	/** whether any of the detected variables has additional info expected to be shown in the extended version (when holding shift) */
	anyExtendedVariables: boolean;
}

export interface IReplaceStringtableVariablesRV {
	replaced: string;
	stringtableVariables: Map<string, string>;
	unknownStringtableVariables: Map<string, Set<string>>;
}

export interface IVariableMeta {
	/** variable name shown in description when `replaceGameVariables`' `options.replaceWithName` is true instead of the actual variable name */
	displayedName?: string;
	/**
	 * when present, formatted variable will have `(%i:STAT_ICON[statIconKey]%)` appended to it
	 * `replaceGameVariables` doesnt handle the elaborate stat icons that are full blown paths like `slowResist` so for now these are manually excluded
	 */
	statIconKey?: Exclude<keyof typeof STAT_ICON, 'slowResist' | 'GP10'>;
	/**
	 * when present, formatted variable will have `= (${extendedEquals})` appended to in the extended version (holding shift)
	 * if `extendedEquals` is an object, it's assumed to have different info values for melee/ranged and will be formatted accordingly in `replaceGameVariables`
	 */
	extendedEquals?: string | {
		prefix: string;
		meleeValue: string | number;
		rangedValue: string | number;
		valueSuffix?: string;
		suffix: string;
	};
	/** displayed value multiplied by */
	multiplier?: number;
	/** `%` will be suffixed to the formatted value */
	isPercentage?: boolean;
	type?: IVariableType;
}

/** creates a union of all variable properties detected on an item */
export type DetectItemVariables<T>
	= | (T extends { dataValues: object } ? keyof T['dataValues'] : never)
		| (T extends { stringCalculations: object } ? keyof T['stringCalculations'] : never)
		| (T extends { itemCalculations: object } ? keyof T['itemCalculations'] : never)
		| (T extends { effectAmount: any[] } ? `Effect${number}Amount` : never);
