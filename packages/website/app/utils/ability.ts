// TODO functionality + figure out variants, for some champions like Jayce the stance affects stats

import type { IDamageResultTableSection } from './types';

/** returns the variables that are listed when the extended ability tooltip is shown */
export function championAbilityVariantListedVariables(_champion: IChampion, _abilityKey: IChampionAbilityKey, _variantIndex: number): IDamageResultTableSection['rows'] {
	return Array.from({ length: Math.round(Math.random() * 4) + 1 }, (_, i) => `Variable${i + 1}`).map(name => ({ id: name, name }));
}
