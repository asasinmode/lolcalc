export type UnionKeys<T> = T extends T ? keyof T : never;

export interface ITexture {
	spriteSheet: string;
	resWidth: number;
	resHeight: number;
	uv: number[];
}

/**
 * champions/runes can have dynamic variables, like veigar stacks, current aphelios gun rotation or scaling health rune shard current value
 * possible values for these can be specified in `champion.ts` and `rune.ts` under proper key, these are then used for saving needed stringtable variables when getting game data
 */
export type IWithPossibleDynamicValues = Record<string, { POSSIBLE_DYNAMIC_VALUES?: Record<string, (string | number)[]> }>;

/**
 * champions/runes can have dynamic variables, like veigar stacks, current aphelios gun rotation or scaling health rune shard current value
 * possible values for these can be specified in `champion.ts` and `rune.ts` under proper key, these are then used in calculations
 */
export type IWithCalculateDynamicValues = Record<string, { calculateDynamicVariables?: (damageSource: DamageSource) => any }>;
