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
