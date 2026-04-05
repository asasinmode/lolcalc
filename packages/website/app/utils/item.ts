import type { IShopItem } from './types';

export type IInternalItemData<Item extends keyof TItemNameToId, Id = typeof ITEM_NAME_TO_ID[Item]> = Id extends keyof TItemSpecifics
	? ReturnType<typeof ITEM_SPECIFICS[Id]['setupInternalData']> : never;

/** colloquial names to id */
export const ITEM_NAME_TO_ID = {
	slightlyMagicalFootwear: '2422',
	diademOfSongs: '2530',
	seraphsEmbrace: '3040',
	muramana: '3042',
	fimbulwinter: '3121',
	hubris: '6697',
	darkSeal: '1082',
	mejai: '3041',
	hauntingGuise: '3147',
} as const;

export type TItemNameToId = typeof ITEM_NAME_TO_ID;
export type TItemSpecifics = typeof ITEM_SPECIFICS;

export const ITEM_SPECIFICS = {
	[ITEM_NAME_TO_ID.hubris]: {
		internalDataProperties: ['hubris'],
		setupInternalData(self) {
			self.internalItemData.value.hubris = Math.max(0, self.internalItemData.value.hubris ?? 0);
			return { hubris: 0 };
		},
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		internalDataProperties: ['glory'],
		setupInternalData(self) {
			self.internalItemData.value.glory = Math.max(0, Math.min(10, self.internalItemData.value.glory ?? 0));
			return { glory: 0 };
		},
	},
	[ITEM_NAME_TO_ID.mejai]: {
		internalDataProperties: ['glory'],
		setupInternalData(self) {
			self.internalItemData.value.glory = Math.max(0, Math.min(25, self.internalItemData.value.glory ?? 0));
			return { glory: 0 };
		},
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		internalDataProperties: ['madness'],
		setupInternalData(self) {
			self.internalItemData.value.madness = Math.max(0, Math.min(3, self.internalItemData.value.madness ?? 0));
			return { madness: 0 };
		},
	},
} satisfies Record<string, {
	/**
	 * similar to `utils/champion.ts` `CHAMPION_SPECIFICS.setupInternalData` for `DamageSource.internalItemData`
	 * except the return value is used only for types, function updates the `internalItemData` properties directly (multiple items need to be able to set it)
	 *
	 * `internalDataProperties` should contain all of the properties set up by this for cleanup by a watcher in `DamageSource` when item is removed
	 */
	setupInternalData?: (self: DamageSource) => any;
	/** the properties `setupInternalData` uses, needed for cleanup */
	internalDataProperties?: string[];
}>;

export const UNPURCHASABLES_TO_KEEP = [
	ITEM_NAME_TO_ID.diademOfSongs,
	ITEM_NAME_TO_ID.slightlyMagicalFootwear,
	ITEM_NAME_TO_ID.seraphsEmbrace,
	ITEM_NAME_TO_ID.muramana,
	ITEM_NAME_TO_ID.fimbulwinter,
];

/** paths to the stat icons found in `plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${STAT_ICON_NAME}.png` */
export const STAT_ICON_NAMES: Record<IItemStat | IChampionStatName | 'adaptiveForce' | 'OnHit' | 'level' | 'attackRange' | 'cooldown', string> = {
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

export function calculateItemDiscount(
	itemId: string,
	inventory: (IItem | undefined)[],
	allItems: Record<string, IItem>,
	inComponent = false,
	consumedInventoryIndexes: number[] = [],
): number {
	if (inComponent) {
		const inventoryIndex = inventory.findIndex((item, i) => item?.id === itemId && !consumedInventoryIndexes.includes(i));
		if (~inventoryIndex) {
			consumedInventoryIndexes.push(inventoryIndex);
			return allItems[itemId]!.gold.total;
		}
	}

	return (allItems[itemId]!.from || []).reduce((discount, componentId) =>
		discount + calculateItemDiscount(componentId, inventory, allItems, true, consumedInventoryIndexes), 0);
}

export function consumeItemComponents(
	itemId: string,
	inventory: (IItem | undefined)[],
	allItems: Record<string, IItem>,
	consumedInventoryIndexes: number[] = [],
	inComponent = false,
): number[] {
	if (inComponent) {
		const inventoryIndex = inventory.findIndex((item, i) => item?.id === itemId && !consumedInventoryIndexes.includes(i));
		if (~inventoryIndex) {
			consumedInventoryIndexes.push(inventoryIndex);
			return consumedInventoryIndexes;
		}
	}

	for (const componentId of allItems[itemId]!.from || []) {
		consumeItemComponents(componentId, inventory, allItems, consumedInventoryIndexes, true);
	}

	return consumedInventoryIndexes;
}

export const RANGED_ONLY_ITEM_IDS = [
	'3085',	/* runaan's hurricane, has `mRequiredPurchaseIdentities	[ "Ranged" ]` but it's the only item like that so this should be fine */
];

export function itemBuyability(
	item: IItem,
	target: DamageSource | undefined,
	allItems: Record<string, IItem>,
	consumeComponents = true,
): IShopItem['buyability'] {
	let buyability: IShopItem['buyability'] = 1;

	if (!target) {
		return buyability;
	}

	let inventoryAfterBuying = target.items.value;

	if (consumeComponents) {
		const inventoryIndexesConsumedOnBuy = consumeItemComponents(item.id, target.items.value, allItems);
		inventoryAfterBuying = target.items.value.map((item, index) => inventoryIndexesConsumedOnBuy.includes(index) ? undefined : item);
	}

	if (
		(!target.isRanged.value && RANGED_ONLY_ITEM_IDS.includes(item.id))
		|| inventoryAfterBuying.some(boughtItem => boughtItem && boughtItem.itemGroups?.some(group => item.itemGroups?.includes(group)))
	) {
		buyability = -1;
	} else if (inventoryAfterBuying.slice(0, 6).filter(Boolean).length > 5) {
		buyability = 0;
	}

	return buyability;
}
