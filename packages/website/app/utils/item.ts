import type { IShopItem } from './types';

export const ITEM_CALCULATIONS: Record<string, Record<string, (target?: IItemVariableCalculationTarget) => number>> = {
	3004: {	// manamune
		// TODO
		// BonusADFromMana(_source) {
		// 	const { mFormulaParts } = useItems()['3004']!.itemCalculations!.BonusADFromMana!;
		// 	return mFormulaParts![0].mCoefficient;
		// },
	},
};

export const ITEM_STAT_ICON_NAMES: Record<IItemStat | 'adaptiveForce' | 'OnHit' | 'level' | 'range' | 'cooldown', string> = {
	OnHit: 'onhit',
	FlatPhysicalDamageMod: 'scalead',
	adaptiveForce: 'adaptiveforce',
	AbilityHasteMod: 'scaleah',
	cooldown: 'scalecooldown',
	FlatMagicDamageMod: 'scaleap',
	PhysicalLethality: 'scaleapen',
	PercentArmorPenetrationMod: 'scaleapen',
	FlatArmorMod: 'scalearmor',
	PercentAttackSpeedMod: 'scaleas',
	FlatCritChanceMod: 'scalecrit',
	FlatCritDamageMod: 'scalecritmult',
	PercentHealingAmountMod: 'scalehealshield',
	FlatHPPoolMod: 'scalehealth',
	FlatHPRegenMod: 'scalehpregen',
	PercentBaseHPRegenMod: 'scalehpregen',
	level: 'scalelevel',
	PercentLifeStealMod: 'scalels',
	FlatMPPoolMod: 'scalemana',
	PercentBaseMPRegenMod: 'scalemanaregen',
	FlatMagicPenetrationMod: 'scalempen',
	PercentMagicPenetrationMod: 'scalempen',
	FlatSpellBlockMod: 'scalemr',
	FlatMovementSpeedMod: 'scalems',
	PercentMovementSpeedMod: 'scalems',
	range: 'scalerange',
	PercentOmnivampMod: 'scalesv',
	PercentTenacityMod: 'scaletenacity',
};

export const ITEM_STAT_META: Record<IItemStat, {
	name: string;
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

const RANGED_ONLY_ITEM_IDS = [
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
