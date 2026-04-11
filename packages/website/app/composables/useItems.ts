import type { UnionKeys } from '~/utils/types';
import { data } from '../assets/item.json';

for (const item of Object.values(data)) {
	markRaw(item);
}

export function useItems(): Record<string, IItem> {
	return data satisfies Record<string, IItem>;
}

export type IItemStat = UnionKeys<(typeof data)[keyof typeof data]['stats']> | 'PercentOmnivampMod';

export interface IItem {
	id: string;
	name: string;
	/** joined search terms of the item */
	searchString: string;
	stats: Partial<Record<IItemStat, number>>;
	gold: {
		total: number;
		sell: number;
		sellBackModifier?: number;
	};
	image: string;
	/** the mask of maps item is enabled on, see `useMaps.ts` */
	mapMask: number;
	into?: string[];
	from?: string[];
	epicness?: number;
	categories?: Partial<Record<IItemCategory, boolean>>;
	/** item "buy" groups, cant buy multiple from the same group */
	itemGroups?: string[];
	/** has 'Boots' in `tags` */
	isBoots?: boolean;
	/** has 'OnHit' in `tags` */
	isOnHit?: boolean;
	dataValues?: Record<string, number>;
	stringCalculations?: Record<string, Record<'MeleeResult' | 'RangedResult' | 'DefaultResult', string>>;
	itemCalculations?: Record<string, {
		mFormulaParts?: any[];
		mDisplayAsPercent?: boolean;
		[key: string]: any;
	}>;
	effectAmount?: number[];
}
