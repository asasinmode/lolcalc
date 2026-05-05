export type UnionKeys<T> = T extends T ? keyof T : never;

export type IChampionRole = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

export interface ITexture {
	spriteSheet: string;
	resWidth: number;
	resHeight: number;
	uv: number[];
}
