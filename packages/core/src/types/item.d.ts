import type { UnionKeys } from '.';
import type { IItemCategory } from '../meta';
import type IItemsData from '~/assets/item.json';

export type IItemStat = UnionKeys<(typeof IItemsData)['data'][keyof typeof IItemsData['data']]['stats']> | 'PercentOmnivampMod';

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
