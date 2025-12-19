import { data } from '~/assets/item.json';

export function useItems(): Record<string, IItem> {
	return data satisfies Record<string, IItem>;
}

export type IItemId = keyof typeof data;

export interface IItemData {
	version: string;
	items: Record<IItemId, IItem>;
}

export type IItemCategory = 'fighter' | 'marksman' | 'assassin' | 'tank' | 'mage' | 'support';

export type IItemStat = UnionKeys<(typeof data)[keyof typeof data]['stats']>;

export interface IItem {
	id: string;
	name: string;
	stats: Partial<Record<IItemStat, number>>;
	gold: {
		base: number;
		purchasable: boolean;
		total: number;
		sell: number;
	};
	image: {
		full: string;
		sprite: string;
		group: string;
		x: number;
		y: number;
		w: number;
		h: number;
	};
	categories?: Partial<Record<IItemCategory, boolean>>;
}

type UnionKeys<T> = T extends T ? keyof T : never;
