export type UnionKeys<T> = T extends T ? keyof T : never;

/**
 * record containing possible dynamic values for a variable (all values the variable is expected to resolve to)
 * used for stringtable variables like `{{ Spell_ApheliosQ_Tooltip_@f3@ }}`
 */
export type IPossibleDynamicValues = Record<string, (string | number)[]>;

export type IChampionRole = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

export interface ITexture {
	spriteSheet: string;
	resWidth: number;
	resHeight: number;
	uv: number[];
}
