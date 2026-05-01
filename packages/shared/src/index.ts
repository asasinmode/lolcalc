export const ABILITY_TYPE = {
	champion: 'champion',
	item: 'item',
	effect: 'effect',
} as const;

export const ALL_ABILITY_TYPES = Object.values(ABILITY_TYPE);

export type TAbilityType = typeof ABILITY_TYPE[keyof typeof ABILITY_TYPE];
