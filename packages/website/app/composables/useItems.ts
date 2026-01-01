import { data } from '../assets/item.json';

export function useItems(): Record<string, IItem> {
	return data satisfies Record<string, IItem>;
}

export const ALL_ITEM_CATEGORIES = ['fighter', 'marksman', 'assassin', 'mage', 'tank', 'support'] as const;

export type IItemCategory = typeof ALL_ITEM_CATEGORIES[number];

export const ITEM_SHOP_STAT_FILTERS = {
	attackDamage: {
		name: 'Attack damage',
		filter: item => !!item.stats.FlatPhysicalDamageMod,
	},
	crit: {
		name: 'Critical strike',
		filter: item => !!item.stats.FlatCritChanceMod,
	},
	attackSpeed: {
		name: 'Attack speed',
		filter: item => !!item.stats.PercentAttackSpeedMod,
	},
	onHit: {
		name: 'On-hit effects',
		filter: item => !!item.isOnHit,
	},
	armorPen: {
		name: 'Armor penetration',
		filter: item => !!(item.stats.PhysicalLethality || item.stats.PercentArmorPenetrationMod),
	},
	abilityPower: {
		name: 'Ability power',
		filter: item => !!item.stats.FlatMagicDamageMod,
	},
	mana: {
		name: 'Mana & regeneration',
		filter: item => !!(item.stats.FlatMPPoolMod || item.stats.PercentBaseMPRegenMod),
	},
	magicPen: {
		name: 'Magic penetration',
		filter: item => !!(item.stats.FlatMagicPenetrationMod || item.stats.PercentMagicPenetrationMod),
	},
	health: {
		name: 'Health & regeneration',
		filter: item => !!(item.stats.FlatHPPoolMod || item.stats.FlatHPRegenMod || item.stats.PercentBaseHPRegenMod),
	},
	armor: {
		name: 'Armor',
		filter: item => !!item.stats.FlatArmorMod,
	},
	magicResist: {
		name: 'Magic reistance',
		filter: item => !!item.stats.FlatSpellBlockMod,
	},
	abilityHaste: {
		name: 'Ability haste',
		filter: item => !!item.stats.AbilityHasteMod,
	},
	movement: {
		name: 'Movement',
		// TODO check if tenacity counts
		filter: item => !!(item.stats.FlatMovementSpeedMod || item.stats.PercentMovementSpeedMod || item.stats.PercentTenacityMod),
	},
	vamp: {
		name: 'Life Steal & omnivamp',
		filter: item => !!(item.stats.PercentLifeStealMod || item.stats.PercentOmnivampMod),
	},
} satisfies Record<string, { name: string; filter: (item: IItem) => boolean }>;

export type IItemShopStatFilter = keyof typeof ITEM_SHOP_STAT_FILTERS;

export type IItemStat = UnionKeys<(typeof data)[keyof typeof data]['stats']> | 'PercentOmnivampMod';

export interface IItem {
	id: string;
	name: string;
	searchString: string;
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
	dataValues?: Record<string, number>;
	stringCalculations?: Record<string, Record<'MeleeResult' | 'RangedResult' | 'DefaultResult', string>>;
	itemCalculations?: Record<string, {
		mFormulaParts?: any[];
		mDisplayAsPercent?: boolean;
		[key: string]: any;
	}>;
}

type UnionKeys<T> = T extends T ? keyof T : never;
