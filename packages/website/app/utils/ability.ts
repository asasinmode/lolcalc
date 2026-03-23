// TODO functionality + figure out variants, for some champions like Jayce the stance affects stats

import type { IDamageResultTableSection } from './types';

/** returns the variables that are listed when the extended ability tooltip is shown */
export function championAbilityVariantListedVariables(_champion: IChampion, _abilityKey: IChampionAbilityKey, _variantIndex: number): IDamageResultTableSection['rows'] {
	return Array.from({ length: Math.round(Math.random() * 4) + 1 }, (_, i) => `Variable${i + 1}`).map(name => ({ id: name, name }));
}

// TODO friendlier names, if value is calculated in item.ts maybe that can help
// TODO try to filter out non simple variables? Like ones that aren't 5 flat damage to BonusDamageToMinions? only ones that are calculated?
/** same as `championAbilityVariantListedVariables` */
export function itemAbilityListedVariables(text: ITextData, minorVersion: string, item: IItem): IDamageResultTableSection['rows'] {
	const { variables, unknownVariables } = computedItemDescription(text, minorVersion, item);
	return variables.keys().toArray().map(name => ({ id: name, name })).concat(unknownVariables.map(([rawName, actualName]) => ({
		id: rawName,
		name: actualName || rawName,
		isUnknown: true,
	})));
}
