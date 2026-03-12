// TODO functionality + figure out variants, for some champions like Jayce the stance affects stats
/** returns the variables that are listed when the extended ability tooltip is shown */
export function abilityVariantListedVariables(_champion: IChampion, _abilityKey: IChampionAbilityKey, _variantIndex: number) {
	return Array.from({ length: Math.round(Math.random() * 4) + 1 }, (_, i) => `Variable${i + 1}`);
}
