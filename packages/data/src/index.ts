import type { IChampionStatName, IItemCategory } from '@lolcalc/shared';
import type { IChampionRole, ITexture } from '@lolcalc/shared/types';
import type { IChampion, IChampionId, IDragonName, IItem, IItemStat, IListedChampion, IRunes, IRuneSlotName } from './types';
import { markRaw } from 'vue';
import championData from '../files/champion.json' with { type: 'json' };
import effectData from '../files/effect.json' with { type: 'json' };
import itemData from '../files/item.json' with { type: 'json' };
import miscData from '../files/misc.json' with { type: 'json' };
import runeData from '../files/rune.json' with { type: 'json' };
import textData from '../files/text.json' with { type: 'json' };
import uiData from '../files/ui.json' with { type: 'json' };

export const SHAPESHIFTING_CHAMPION_IDS: IChampionId[] = ['Elise', 'Jayce', 'Nidalee'];

export const ITEM_STAT_META: Record<IItemStat, {
	name: string;
	/** value by which the stat is sorted in the item hover tooltip */
	order: number;
	displayMultiplier?: number;
	isPercentage?: boolean;
}> = {
	FlatPhysicalDamageMod: { name: 'Attack damage', order: 95 },
	FlatMagicDamageMod: { name: 'Ability power', order: 90 },

	PercentAttackSpeedMod: { name: 'Attack speed', order: 80, isPercentage: true },

	FlatHPPoolMod: { name: 'Health', order: 75 },
	FlatMPPoolMod: { name: 'Mana', order: 70 },

	FlatArmorMod: { name: 'Armor', order: 65 },
	FlatSpellBlockMod: { name: 'Magic resist', order: 60 },

	PhysicalLethality: { name: 'Lethality', order: 59 },
	PercentArmorPenetrationMod: { name: 'Armor penetration', order: 56, isPercentage: true },
	FlatMagicPenetrationMod: { name: 'Magic penetration', order: 53 },
	PercentMagicPenetrationMod: { name: 'Magic penetration', order: 50, isPercentage: true },

	FlatCritChanceMod: { name: 'Critical strike chance', order: 45, isPercentage: true },
	FlatCritDamageMod: { name: 'Critical strike damage', order: 40, isPercentage: true },

	AbilityHasteMod: { name: 'Ability haste', order: 39 },
	FlatMovementSpeedMod: { name: 'Move speed', order: 36 },
	PercentMovementSpeedMod: { name: 'Move speed', order: 33, isPercentage: true },
	PercentTenacityMod: { name: 'Tenacity', order: 30, isPercentage: true },

	FlatHPRegenMod: { name: 'Health every 5 seconds', order: 28, displayMultiplier: 5 },
	PercentBaseHPRegenMod: { name: 'Base health regen', order: 24, isPercentage: true },
	PercentBaseMPRegenMod: { name: 'Base mana regen', order: 20, isPercentage: true },

	PercentHealingAmountMod: { name: 'Heal and shield power', order: 10, isPercentage: true },

	PercentLifeStealMod: { name: 'Life steal', order: 5, isPercentage: true },
	PercentOmnivampMod: { name: 'Omnivamp', order: 0, isPercentage: true },
};

export const ITEM_TO_CHAMPION_STATS: Record<Exclude<
	IItemStat,
	'PercentBaseHPRegenMod' | 'PercentBaseMPRegenMod' | 'PercentMovementSpeedMod'
>, IChampionStatName> = {
	AbilityHasteMod: 'abilityHaste',
	FlatArmorMod: 'armor',
	FlatCritChanceMod: 'critChance',
	FlatHPPoolMod: 'hp',
	FlatHPRegenMod: 'hpRegen',
	FlatMPPoolMod: 'mana',
	FlatCritDamageMod: 'critDamageMultiplier',
	FlatMagicDamageMod: 'abilityPower',
	FlatMagicPenetrationMod: 'flatMagicPen',
	FlatMovementSpeedMod: 'moveSpeed',
	FlatPhysicalDamageMod: 'attackDamage',
	FlatSpellBlockMod: 'magicResist',
	PercentArmorPenetrationMod: 'percentArmorPen',
	PercentAttackSpeedMod: 'bonusAttackSpeedPercent',
	PercentHealingAmountMod: 'healShieldPower',
	PercentLifeStealMod: 'lifeSteal',
	PercentMagicPenetrationMod: 'percentMagicPen',
	PercentTenacityMod: 'tenacity',
	PhysicalLethality: 'lethality',
	PercentOmnivampMod: 'omnivamp',
};

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
		// TODO check if tenacity counts + check other filters
		filter: item => !!(item.stats.FlatMovementSpeedMod || item.stats.PercentMovementSpeedMod || item.stats.PercentTenacityMod),
	},
	vamp: {
		name: 'Life Steal & omnivamp',
		filter: item => !!(item.stats.PercentLifeStealMod || item.stats.PercentOmnivampMod),
	},
} satisfies Record<string, { name: string; filter: (item: IItem) => boolean }>;

export type IItemShopStatFilter = keyof typeof ITEM_SHOP_STAT_FILTERS;

/**
 * paths to the stat icons found in `plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${STAT_ICON}.png`
 * or full external ones if starting with `http`
 */
export const STAT_ICON: Record<
	IItemStat | IChampionStatName | 'adaptiveForce' | 'OnHit' | 'level' | 'attackRange' | 'cooldown',
	string | [url: string, size: number] | [url: string, width: number, height: number]
> = {
	OnHit: 'onhit',
	attackDamage: 'scalead',
	FlatPhysicalDamageMod: 'scalead',
	adaptiveForce: 'adaptiveforce',
	AbilityHasteMod: 'scaleah',
	abilityHaste: 'scaleah',
	cooldown: 'scalecooldown',
	FlatMagicDamageMod: 'scaleap',
	abilityPower: 'scaleap',
	PhysicalLethality: 'scaleapen',
	lethality: 'scaleapen',
	PercentArmorPenetrationMod: 'scaleapen',
	percentArmorPen: 'scaleapen',
	FlatArmorMod: 'scalearmor',
	armor: 'scalearmor',
	PercentAttackSpeedMod: 'scaleas',
	attackSpeed: 'scaleas',
	bonusAttackSpeedPercent: 'scaleas',
	attackSpeedRatio: 'scaleas',
	FlatCritChanceMod: 'scalecrit',
	critChance: 'scalecrit',
	FlatCritDamageMod: 'scalecritmult',
	critDamageMultiplier: 'scalecritmult',
	PercentHealingAmountMod: 'scalehealshield',
	healShieldPower: 'scalehealshield',
	FlatHPPoolMod: 'scalehealth',
	hp: 'scalehealth',
	FlatHPRegenMod: 'scalehpregen',
	PercentBaseHPRegenMod: 'scalehpregen',
	hpRegen: 'scalehpregen',
	level: 'scalelevel',
	PercentLifeStealMod: 'scalels',
	lifeSteal: 'scalels',
	FlatMPPoolMod: 'scalemana',
	mana: 'scalemana',
	PercentBaseMPRegenMod: 'scalemanaregen',
	manaRegen: 'scalemanaregen',
	FlatMagicPenetrationMod: 'scalempen',
	flatMagicPen: 'scalempen',
	PercentMagicPenetrationMod: 'scalempen',
	percentMagicPen: 'scalempen',
	FlatSpellBlockMod: 'scalemr',
	magicResist: 'scalemr',
	FlatMovementSpeedMod: 'scalems',
	PercentMovementSpeedMod: 'scalems',
	moveSpeed: 'scalems',
	attackRange: 'scalerange',
	PercentOmnivampMod: 'scalesv',
	omnivamp: 'scalesv',
	PercentTenacityMod: 'scaletenacity',
	tenacity: 'scaletenacity',
	slowResist: ['https://wiki.leagueoflegends.com/en-us/images/Slow_immune_icon.png', 65],
};

export const RUNE_SLOT_NAME_TO_NUMBER = Object.fromEntries(Object.entries(runeData.data.paths)
	.flatMap(([, { slots }]) =>
		slots.flatMap((slot, slotIndex) => Object.keys(slot).map(slotName => [slotName, slotIndex])),
	),
) as Record<IRuneSlotName, number>;

export const CHAMPIONS = championData.data satisfies Record<IChampionId, IListedChampion> as IChampionData;

type IChampionData = { [Id in IChampionId]: IListedChampion<Id> };

export const CHAMPION_KEY_TO_ID: Record<string, IChampionId> = Object.fromEntries(
	Object.entries(championData.data).map(([id, { key }]) => [key, id as IChampionId]),
);

export const CHAMPION_ID_TO_KEY: Record<IChampionId, string> = Object.fromEntries(
	Object.entries(CHAMPION_KEY_TO_ID).map(([key, id]) => [id as IChampionId, key]),
) as Record<IChampionId, string>;

const championCache = new Map<IChampionId, Promise<IChampion>>();

export function useChampion(id: IChampionId | (string & {})): Promise<IChampion> {
	const cacheHit = championCache.get(id as IChampionId);
	if (cacheHit) {
		return cacheHit;
	}
	const promise = import(`../files/champion/${id}.json?raw`, { with: { type: 'json' } }).then(module => module.default);
	championCache.set(id as IChampionId, promise);
	return promise;
}

for (const item of Object.values(itemData.data)) {
	markRaw(item);
}

export const ITEMS = itemData.data satisfies Record<string, IItem> as Record<string, IItem>;

/** the const type of the `item.json` file for accessing specific things like `items[darkSealId].dataValues.maxStacks` without losing the types from `ITEMS` being Record<string> */
export type TItems = typeof itemData['data'];

export const RUNES = runeData.data as IRunes;

export const EFFECTS = { data: effectData.data, stringtable: effectData.stringtable } satisfies IEffectData;

export interface IEffectData {
	data: Record<string, {
		description: string;
		dataKey: string;
	}>;
	stringtable: Record<string, string>;
}

export const TEXT = textData.data satisfies ITextData;

export interface ITextData {
	items: Record<string, {
		subtitleLeft?: string;
		subtitleRight?: string;
		/** the extra text that's below the stats when hovering item in shop */
		tooltipShop?: string[][];
		/**
		 * same as `extrasShop` but in inventory
		 * present if source has it and is different from the shop one
		 * differs in for example using the computed variables for the champion like AD gained from Overlord's Bloodmail
		 */
		tooltipInventory?: string[][];
		/** the additional, usually gray, text shown below the stats and any descripiton */
		extended?: string;
		/** text in the footer, same spot as `Press [Shift] to...`, usually showing the value of a dynamic variable like `Giant Slayer Bonus Damage: \@f1\@` */
		footerLeft?: string;
		/** keyword definition like `Wounds: Reduces the effectiveness...` */
		keywordDefinitions?: string;
	}>;
	runes: {
		paths: Record<string, { name: string; tooltip: string }>;
		slots: Record<string, {
			name: string;
			/** champ select rune dialog hover */
			tooltipShort: string;
			/** champ select rune dialog hover + shift */
			tooltipLong: string;
			/** the tooltip displayed when hovering over the in game stats panel */
			tooltipStats: string;
		}>;
		shards: {
			slotNames: Record<string, { name: string }>;
			slotValues: Record<string, {
				name: string;
				/** champ select rune dialog hover */
				tooltip: string;
				/** the tooltip displayed when hovering over in game stats panel */
				tooltipStats: string;
			}>;
		};
	};
	dragons: Record<IDragonName, {
		stack: string;
		soul: string;
	}>;
	roleQuests: Record<IChampionRole, string[]>;
	stringtable: Record<string, string>;
}

export const MISC = miscData.data satisfies IMiscData;

export const ALL_DRAGON_NAMES = Object.keys(MISC.dragons) as IDragonName[];

interface IMiscData {
	dragons: Record<IDragonName, {
		name: string;
		stack: {
			objectName: string;
			dataValues: any;
		};
		soul: {
			objectName: string;
			dataValues: any;
		};
	}>;
}

export const UI = uiData.data satisfies IUiData;

interface IUiData {
	shop: {
		categories: Record<IItemCategory | 'all', ITexture>;
		stats: Partial<Record<IItemShopStatFilter, { default: ITexture; selected: Pick<ITexture, 'uv'> }>>;
		clearFilters: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
		};
		swapItemOrder: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
		};
		pin: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
			slcHover: Pick<ITexture, 'uv'>;
		};
	};
	playerStats: Record<string, ITexture>;
	dragons: Record<IDragonName, {
		stack: ITexture;
		soulActive: ITexture;
	}>;
	practiceTool: {
		statusEffect: ITexture;
	};
}
