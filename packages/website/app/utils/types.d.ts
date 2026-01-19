export type UnionKeys<T> = T extends T ? keyof T : never;

export interface ITexture {
	spriteSheet: string;
	resWidth: number;
	resHeight: number;
	uv: number[];
}
