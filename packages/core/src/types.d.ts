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
	variables: Map<string, number | [number, number]>;
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
