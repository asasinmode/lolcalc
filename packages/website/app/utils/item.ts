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
