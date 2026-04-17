import type { IProviderGroupImageText, IProviderGroupInternalItemData, IShopItem } from './types';
import itemsData from '../assets/item.json';

const { data: items } = itemsData;

const tearItemSpecifics = {
	internalDataProperties: ['manaflow'],
	setupData(self: DamageSource) {
		self.internalItemData.value.manaflow = clamp(0, self.internalItemData.value.manaflow ?? 0, items[ITEM_NAME_TO_ID.tear].dataValues.MaxMana);
		return { manaflow: 0 };
	},
	imgTextLabel: 'Manaflow stacks',
	imgText(self) {
		return (self.internalItemData.value as { manaflow: number }).manaflow;
	},
} satisfies IItemSpecific;

export const ITEM_SPECIFICS = {
	[ITEM_NAME_TO_ID.hubris]: {
		internalDataProperties: ['eminence'],
		setupData(self) {
			self.internalItemData.value.eminence = Math.max(0, self.internalItemData.value.eminence ?? 0);
			return { eminence: 0 };
		},
		imgTextLabel: 'Eminence stacks',
		imgText(self) {
			const { eminence } = self.internalItemData.value as { eminence: number };
			return eminence && items[ITEM_NAME_TO_ID.hubris].dataValues.BonusLethality + eminence * items[ITEM_NAME_TO_ID.hubris].dataValues.ADPerStatue;
		},
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		internalDataProperties: ['glory'],
		setupData(self) {
			self.internalItemData.value.glory = clamp(0, self.internalItemData.value.glory ?? 0, items[ITEM_NAME_TO_ID.darkSeal].dataValues.MaxGloryStacks);
			return { glory: 0 };
		},
		imgTextLabel: 'Glory stacks',
		imgText(self) {
			return (self.internalItemData.value as { glory: number }).glory;
		},
	},
	[ITEM_NAME_TO_ID.mejai]: {
		internalDataProperties: ['glory'],
		setupData(self) {
			self.internalItemData.value.glory = clamp(0, self.internalItemData.value.glory ?? 0, items[ITEM_NAME_TO_ID.mejai].dataValues.MaxGloryStacks);
			return { glory: 0 };
		},
		imgTextLabel: 'Glory stacks',
		imgText(self) {
			return (self.internalItemData.value as { glory: number }).glory;
		},
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		internalDataProperties: ['madness'],
		setupData(self) {
			self.internalItemData.value.madness = clamp(0, self.internalItemData.value.madness ?? 0, items[ITEM_NAME_TO_ID.hauntingGuise].dataValues.SecondsInCombat);
			return { madness: 0 };
		},
		imgTextLabel: 'Madness bonus damage',
		imgText(self) {
			const { madness } = self.internalItemData.value as { madness: number };
			return madness && `${Math.round(madness * items[ITEM_NAME_TO_ID.hauntingGuise].dataValues.DamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.roa]: {
		internalDataProperties: ['eternity'],
		setupData(self) {
			self.internalItemData.value.eternity = clamp(0, self.internalItemData.value.eternity ?? 0, items[ITEM_NAME_TO_ID.roa].dataValues.MaxStacks);
			return { eternity: 0 };
		},
		imgTextLabel: 'Eternity stacks',
		imgText(self) {
			return (self.internalItemData.value as { eternity: number }).eternity;
		},
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		internalDataProperties: ['bBlaze'],
		setupData(self) {
			self.internalItemData.value.bBlaze = Math.max(0, self.internalItemData.value.bBlaze ?? 0);
			return { bBlaze: 0 };
		},
		imgTextLabel: 'Baleful Blaze ap increase',
		imgText(self) {
			const { bBlaze } = self.internalItemData.value as { bBlaze: number };
			return bBlaze && `${Math.round(bBlaze * items[ITEM_NAME_TO_ID.blackfireTorch].dataValues.APPerStack * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		internalDataProperties: ['cConsumption'],
		setupData(self) {
			self.internalItemData.value.cConsumption = Math.max(0, self.internalItemData.value.cConsumption ?? 0);
			return { cConsumption: 0 };
		},
		imgTextLabel: 'Colosal Consumption health increase',
		imgText(self) {
			return (self.internalItemData.value as { cConsumption: number }).cConsumption;
		},
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		internalDataProperties: ['seething'],
		setupData(self) {
			self.internalItemData.value.seething = clamp(0, self.internalItemData.value.seething ?? 0, items[ITEM_NAME_TO_ID.guinsoo].dataValues.MaxStacks);
			return { seething: 0 };
		},
		imgTextLabel: 'Seething Strikes stacks',
		imgText(self) {
			return (self.internalItemData.value as { seething: number }).seething;
		},
	},
	[ITEM_NAME_TO_ID.terminus]: {
		internalDataProperties: ['jxtpL', 'jxtpD'],
		setupData(self) {
			const { PenPerHit, PenMax } = items[ITEM_NAME_TO_ID.terminus].dataValues;
			const maxStacks = Math.round(PenPerHit / PenMax);
			self.internalItemData.value.jxtpL = clamp(0, self.internalItemData.value.jxtpL ?? 0, maxStacks);
			self.internalItemData.value.jxtpD = clamp(0, self.internalItemData.value.jxtpD ?? 0, maxStacks);
			return { jxtpL: 0, jxtpD: 0 };
		},
		imgTextLabel: 'Juxtaposition stacks (light | dark)',
		imgText(self, property?: 'jxtpL' | 'jxtpD') {
			const data = self.internalItemData.value as { jxtpL: number; jxtpD: number };
			return property ? data[property] : (data.jxtpD || data.jxtpL) && `${data.jxtpL} | ${data.jxtpD}`;
		},
	},
	[ITEM_NAME_TO_ID.liandry]: {
		internalDataProperties: ['madness'],
		setupData(self) {
			self.internalItemData.value.madness = clamp(0, self.internalItemData.value.madness ?? 0, items[ITEM_NAME_TO_ID.liandry].dataValues.MaxStackNumber);
			return { madness: 0 };
		},
		imgTextLabel: 'Madness bonus damage',
		imgText(self) {
			const { madness } = self.internalItemData.value as { madness: number };
			return madness && `${Math.round(madness * items[ITEM_NAME_TO_ID.liandry].dataValues.DamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		internalDataProperties: ['practice'],
		setupData(self) {
			self.internalItemData.value.practice = clamp(0, self.internalItemData.value.practice ?? 0, items[ITEM_NAME_TO_ID.yunTal].dataValues.CritMax);
			return { practice: 0 };
		},
		imgTextLabel: 'Practice Makes Lethal critical strike chance',
		imgText(self) {
			const { practice } = self.internalItemData.value as { practice: number };
			return practice && `${practice}%`;
		},
	},
	[ITEM_NAME_TO_ID.shojin]: {
		internalDataProperties: ['fWill'],
		setupData(self) {
			self.internalItemData.value.fWill = clamp(0, self.internalItemData.value.fWill ?? 0, items[ITEM_NAME_TO_ID.shojin].dataValues.StackCount);
			return { fWill: 0 };
		},
		imgTextLabel: 'Focused Will ability damage increase',
		imgText(self) {
			const { fWill } = self.internalItemData.value as { fWill: number };
			return fWill && `${Math.round(fWill * items[ITEM_NAME_TO_ID.shojin].dataValues.SpellDamageIncrease * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		internalDataProperties: ['corruption'],
		setupData(self) {
			self.internalItemData.value.corruption = clamp(0, self.internalItemData.value.corruption ?? 0, items[ITEM_NAME_TO_ID.riftmaker].dataValues.SecondsInCombat);
			return { corruption: 0 };
		},
		imgTextLabel: 'Corruption bonus damage',
		imgText(self) {
			const { corruption } = self.internalItemData.value as { corruption: number };
			return corruption && `${Math.round(corruption * items[ITEM_NAME_TO_ID.riftmaker].dataValues.EternityDamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.tear]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.whisperingCirclet]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.archangelsStaff]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.manamune]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.wintersApproach]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.trinity]: {
		internalDataProperties: ['quicken'],
		setupData(self) {
			self.internalItemData.value.quicken = clamp(0, self.internalItemData.value.quicken ?? 0, 1);
			return { quicken: 0 };
		},
		isItemImageActive(internalData: { quicken: number }) {
			return internalData.quicken;
		},
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		internalDataProperties: ['carve', 'fervor'],
		setupData(self) {
			self.internalItemData.value.carve = Math.max(0, Math.min(
				EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.blackCleaverCarve].maxValue,
				self.internalItemData.value.carve ?? 0,
			));
			self.internalItemData.value.fervor = clamp(0, self.internalItemData.value.carve ?? 0, 1);
			return { carve: 0, fervor: 0 };
		},
		isItemImageActive(internalData: { fervor: number }) {
			return internalData.fervor;
		},
		imgTextLabel: 'Carve stacks',
		imgText(self) {
			return self.internalItemData.value.carve;
		},
	},
} satisfies IHypotheticalItemSpecifics;

export type TItemSpecifics = typeof ITEM_SPECIFICS;
export type IHypotheticalItemSpecifics = Record<string, IItemSpecific>;

export type IItemSpecific = IProviderGroupImageText & IProviderGroupInternalItemData & {
	/** whether to show the green dot that the item is active in the top right corner of the image */
	isItemImageActive?: (internalData: any) => number | boolean;
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
		(!target.isRanged.value && (RANGED_ONLY_ITEM_IDS as string[]).includes(item.id))
		|| inventoryAfterBuying.some(boughtItem => boughtItem && boughtItem.itemGroups?.some(group => item.itemGroups?.includes(group)))
	) {
		buyability = -1;
	} else if (inventoryAfterBuying.slice(0, 6).filter(Boolean).length > 5 && (target.roleQuest.value !== 'bot' || inventoryAfterBuying[7])) {
		buyability = 0;
	}

	return buyability;
}
