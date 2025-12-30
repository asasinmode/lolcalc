import { data } from '../assets/item.json';

export function useItems(): Record<string, IItem> {
	return data satisfies Record<string, IItem>;
}

export const ALL_ITEM_CATEGORIES = ['fighter', 'marksman', 'assassin', 'mage', 'tank', 'support'] as const;

export type IItemCategory = typeof ALL_ITEM_CATEGORIES[number];

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
	image: string;
	mapMask: number;
	into?: string[];
	from?: string[];
	epicness?: number;
	categories?: Partial<Record<IItemCategory, boolean>>;
	/** has 'Boots' in `tags` */
	isBoots?: boolean;
	/** has 'OnHit' in `tags` */
	isOnHit?: boolean;
}

type UnionKeys<T> = T extends T ? keyof T : never;
