import type { IChampionAbilityKey, IItemCategory } from '@lolcalc/shared';
import type { UnionKeys } from '@lolcalc/shared/types';
import type IChampionData from '../files/champion.json';
import type TExampleChampion from '../files/champion/Ahri.json';
import type IItemData from '../files/item.json';
import type IMiscData from '../files/misc.json';
import type IRuneData from '../files/rune.json';

export type IDragonName = keyof typeof IMiscData['data']['dragons'];

export type IItemStat = UnionKeys<(typeof IItemData)['data'][keyof typeof IItemData['data']]['stats']> | 'PercentOmnivampMod';

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

export interface IShopItem {
	item: IItem;
	/**
	 * -1 = locked (already have item of this group)
	 *	0 = inventory full
	 *	1 = can buy
	 */
	buyability: -1 | 0 | 1;
	calculatedPrice: number;
	isBought?: boolean;
	from?: IShopItem[];
	isLegendary: boolean;
	srStatus: string;
}

export type IChampionId = keyof typeof IChampionData['data'];

export type IChampionStat = keyof typeof TExampleChampion['stats'];

export interface IChampion<T extends IChampionId = IChampionId> {
	id: T;
	key: string;
	name: string;
	partype: string;
	stats: Record<IChampionStat, number>;
	abilities: Record<IChampionAbilityKey, IChampionAbility>;
	/** nested stringtable variables used in champion abilities' descriptions */
	stringtable: Record<string, string>;
}

export interface IListedChampion<T extends IChampionId = any> extends Pick<IChampion<T>, 'id' | 'key' | 'name'> {
	image: string;
	roles: Partial<Record<IChampionRole, boolean>>;
}

export interface IChampionAbility {
	maxLevel: number;
	cooldownTime?: number[];
	/**
	 * champion ability can have multiple variants. Most champions abilities have 1 variant, but shapeshifters like Elise/Nidalee/Jayce have a variant for each form and Aphelios has many Q/E variants
	 * except for Aphelios, only first 2 variants are actually meaningful (used/shown in game as that ability). Abilities can have more variants than just 2 though (for example Elise Q). These additional variants are used for resolving the variables shown in the main 2 variants' tooltips and aren't supposed to be otherwise shown to the user
	 * for additional information see `scripts/updateGameData.ts` -> `championAbilityVariants`
	 */
	variants: IChampionAbilityVariant[];
}

export interface IChampionAbilityVariant {
	name: string;
	image: string;
	mana?: number[];
	cooldownTime?: number[];
	// TODO not sure if still needed, Aphelios variants use it maybe?
	// /** if present, means the variant uses the tooltip of another variant at the specified index */
	// tooltipVariantIndex?: number;
	tooltip?: string;
	/** tooltip shown when holding shift */
	tooltipExtended?: string;
	// TODO unused at the moment? dont remember what it was for, maybe for when all abilities' (not just passive) are fully resolved
	tooltipExtendedBelowLine?: string;
	/** the variables shown below the description when holding shift. Cooldown excluded, it's added manually */
	extendedVariables?: {
		/** like `QBaseDamage` */
		name: string;
		/**
		 * the stringtable key to override the default variable name with
		 * like `QBaseDamage` -> `spell_listtype_damage` -> `Damage`
		 */
		nameOverride?: string;
	}[];
	dataValues?: any;
	spellCalculations?: any;
	effectAmount?: any;
	dataKey: string;
	objectName: string;
}

type IDataShards = typeof IRuneData['data']['shards'];
type IDataPaths = typeof IRuneData['data']['paths'];

export type IRuneShardSlotName = keyof IDataShards;
export type IRuneShardSlotValue = {
	[K in keyof IDataShards]: keyof IDataShards[K]
}[keyof IDataShards];
export type IRunePathName = keyof IDataPaths;
export type IRuneSlotName = UnionKeys<IDataPaths[IRunePathName]['slots'][number]>;

export interface IRunePath {
	id: number;
	name: IRunePathName;
	icon: string;
	iconColor: string;
	slots: Partial<Record<IRuneSlotName, IRunePathSlot>>[];
}

export interface IRunePathSlot {
	id: number;
	name: IRuneSlotName;
	icon: string;
	effectAmount?: Record<string, number>;
	/** mCalculations from rune data, maybe should be kept as just calculations */
	calculations?: Record<string, any>;
}

export interface IRuneShard {
	id: number;
	icon: string;
	effectAmount?: Record<string, number>;
}

export type IRune = IRunePath | IRunePathSlot | IRuneShard;

export interface IRunes {
	paths: Record<IRunePathName, IRunePath>;
	shards: {
		[S in IRuneShardSlotName]: {
			[V in keyof IDataShards[S]]: IRuneShard
		}
	};
}

export interface IChampionRunes {
	paths: {
		primary: IRunePathName;
		primarySlots: (IRuneSlotName | undefined)[];
		secondary: IRunePathName | undefined;
		secondarySlots: (IRuneSlotName | undefined)[];
	};
	shards: {
		[K in IRuneShardSlotName]: keyof IDataShards[K];
	};
}
