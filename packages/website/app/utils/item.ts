import type { IProviderGroupEffect, IProviderGroupImageText, IProviderGroupInternalItemData, IShopItem } from './types';
import itemsData from '../assets/item.json';

const { data: items } = itemsData;

const tearItemSpecifics = {
	internalDataProperties: ['manaflow'],
	setupInternalData(self: DamageSource) {
		self.internalItemData.value.manaflow = Math.max(0, Math.min(360, self.internalItemData.value.manaflow ?? 0));
		return { manaflow: 0 };
	},
	itemImageTextLabel: 'Manaflow stacks',
	itemImageText(self) {
		return (self.internalItemData.value as { manaflow: number }).manaflow;
	},
} satisfies IItemSpecific;

export const ITEM_SPECIFICS = {
	[ITEM_NAME_TO_ID.hubris]: {
		internalDataProperties: ['eminence'],
		setupInternalData(self) {
			self.internalItemData.value.eminence = Math.max(0, self.internalItemData.value.eminence ?? 0);
			return { eminence: 0 };
		},
		itemImageTextLabel: 'Eminence stacks',
		itemImageText(self) {
			const { eminence } = self.internalItemData.value as { eminence: number };
			return eminence && items[ITEM_NAME_TO_ID.hubris].dataValues.BonusLethality + eminence * items[ITEM_NAME_TO_ID.hubris].dataValues.ADPerStatue;
		},
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		internalDataProperties: ['glory'],
		setupInternalData(self) {
			self.internalItemData.value.glory = Math.max(0, Math.min(10, self.internalItemData.value.glory ?? 0));
			return { glory: 0 };
		},
		itemImageTextLabel: 'Glory stacks',
		itemImageText(self) {
			return (self.internalItemData.value as { glory: number }).glory;
		},
	},
	[ITEM_NAME_TO_ID.mejai]: {
		internalDataProperties: ['glory'],
		setupInternalData(self) {
			self.internalItemData.value.glory = Math.max(0, Math.min(25, self.internalItemData.value.glory ?? 0));
			return { glory: 0 };
		},
		itemImageTextLabel: 'Glory stacks',
		itemImageText(self) {
			return (self.internalItemData.value as { glory: number }).glory;
		},
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		internalDataProperties: ['madness'],
		setupInternalData(self) {
			self.internalItemData.value.madness = Math.max(0, Math.min(3, self.internalItemData.value.madness ?? 0));
			return { madness: 0 };
		},
		itemImageTextLabel: 'Madness bonus damage',
		itemImageText(self) {
			const { madness } = self.internalItemData.value as { madness: number };
			return madness && `${Math.round(madness * items[ITEM_NAME_TO_ID.hauntingGuise].dataValues.DamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.roa]: {
		internalDataProperties: ['eternity'],
		setupInternalData(self) {
			self.internalItemData.value.eternity = Math.max(0, Math.min(10, self.internalItemData.value.eternity ?? 0));
			return { eternity: 0 };
		},
		itemImageTextLabel: 'Eternity stacks',
		itemImageText(self) {
			return (self.internalItemData.value as { eternity: number }).eternity;
		},
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		internalDataProperties: ['bBlaze'],
		setupInternalData(self) {
			self.internalItemData.value.bBlaze = Math.max(0, self.internalItemData.value.bBlaze ?? 0);
			return { bBlaze: 0 };
		},
		itemImageTextLabel: 'Baleful Blaze ap increase',
		itemImageText(self) {
			const { bBlaze } = self.internalItemData.value as { bBlaze: number };
			return bBlaze && `${Math.round(bBlaze * items[ITEM_NAME_TO_ID.blackfireTorch].dataValues.APPerStack * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		internalDataProperties: ['cConsumption'],
		setupInternalData(self) {
			self.internalItemData.value.cConsumption = Math.max(0, self.internalItemData.value.cConsumption ?? 0);
			return { cConsumption: 0 };
		},
		itemImageTextLabel: 'Colosal Consumption health increase',
		itemImageText(self) {
			return (self.internalItemData.value as { cConsumption: number }).cConsumption;
		},
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		internalDataProperties: ['seething'],
		setupInternalData(self) {
			self.internalItemData.value.seething = Math.max(0, Math.min(4, self.internalItemData.value.seething ?? 0));
			return { seething: 0 };
		},
		itemImageTextLabel: 'Seething Strikes stacks',
		itemImageText(self) {
			return (self.internalItemData.value as { seething: number }).seething;
		},
	},
	[ITEM_NAME_TO_ID.terminus]: {
		internalDataProperties: ['jxtpL', 'jxtpD'],
		setupInternalData(self) {
			self.internalItemData.value.jxtpL = Math.max(0, Math.min(3, self.internalItemData.value.jxtpL ?? 0));
			self.internalItemData.value.jxtpD = Math.max(0, Math.min(3, self.internalItemData.value.jxtpD ?? 0));
			return { jxtpL: 0, jxtpD: 0 };
		},
		itemImageTextLabel: 'Juxtaposition stacks (light | dark)',
		itemImageText(self, _abilityId, _stringifiedAbilityId, property?: 'jxtpL' | 'jxtpD') {
			const data = self.internalItemData.value as { jxtpL: number; jxtpD: number };
			return property ? data[property] : (data.jxtpD || data.jxtpL) && `${data.jxtpL} | ${data.jxtpD}`;
		},
	},
	[ITEM_NAME_TO_ID.liandry]: {
		internalDataProperties: ['madness'],
		setupInternalData(self) {
			self.internalItemData.value.madness = Math.max(0, Math.min(3, self.internalItemData.value.madness ?? 0));
			return { madness: 0 };
		},
		itemImageTextLabel: 'Madness bonus damage',
		itemImageText(self) {
			const { madness } = self.internalItemData.value as { madness: number };
			return madness && `${Math.round(madness * items[ITEM_NAME_TO_ID.liandry].dataValues.DamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		internalDataProperties: ['practice'],
		setupInternalData(self) {
			self.internalItemData.value.practice = Math.max(0, Math.min(25, self.internalItemData.value.practice ?? 0));
			return { practice: 0 };
		},
		itemImageTextLabel: 'Practice Makes Lethal critical strike chance',
		itemImageText(self) {
			const { practice } = self.internalItemData.value as { practice: number };
			return practice && `${practice}%`;
		},
	},
	[ITEM_NAME_TO_ID.shojin]: {
		internalDataProperties: ['fWill'],
		setupInternalData(self) {
			self.internalItemData.value.fWill = Math.max(0, Math.min(4, self.internalItemData.value.fWill ?? 0));
			return { fWill: 0 };
		},
		itemImageTextLabel: 'Focused Will ability damage increase',
		itemImageText(self) {
			const { fWill } = self.internalItemData.value as { fWill: number };
			return fWill && `${Math.round(fWill * items[ITEM_NAME_TO_ID.shojin].dataValues.SpellDamageIncrease * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		internalDataProperties: ['corruption'],
		setupInternalData(self) {
			self.internalItemData.value.corruption = Math.max(0, Math.min(4, self.internalItemData.value.corruption ?? 0));
			return { corruption: 0 };
		},
		itemImageTextLabel: 'Corruption bonus damage',
		itemImageText(self) {
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
		setupInternalData(self) {
			self.internalItemData.value.quicken = Math.max(0, Math.min(1, self.internalItemData.value.quicken ?? 0));
			return { quicken: 0 };
		},
		isItemImageActive(internalData: { quicken: number }) {
			return internalData.quicken;
		},
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		internalDataProperties: ['carve', 'fervor'],
		setupInternalData(self) {
			self.internalItemData.value.carve = Math.max(0, Math.min(5, self.internalItemData.value.carve ?? 0));
			self.internalItemData.value.fervor = Math.max(0, Math.min(1, self.internalItemData.value.carve ?? 0));
			return { carve: 0, fervor: 0 };
		},
		setupEffectData(self, effect): [carve: number] {
			console.log('setting up black cleaver effect', effect, self.appliedEffects.value);
			return [
				Math.max(0, Math.min(5, effect?.data[0] ?? 0)),
			];
		},
		isEffectActive(data) {
			const [carve] = data as [carve: number];
			return carve;
		},
		itemImageTextLabel: 'Carve stacks',
		itemImageText(self, abilityId) {
			if (abilityId.dataSource === ABILITY_DATA_SOURCE.internal) {
				return self.internalItemData.value.carve;
			}
			return self.appliedEffects.value.find(effect => GameAbilityId.isSame(effect.abilityId, abilityId))?.data[0];
		},
	},
	[ITEM_NAME_TO_ID.shurelya]: {
		setupEffectData(self, effect): [inspiringSpeech: 0 | 1] {
			console.log('setting up shurelya effect', effect, self.appliedEffects.value);
			return [Math.max(0, Math.min(1, effect?.data[0] ?? 0)) as 0 | 1];
		},
		isEffectActive(data) {
			const [inspiringSpeech] = data as [inspiringSpeech: 0 | 1];
			return inspiringSpeech;
		},
	},
} satisfies Record<string, IItemSpecific>;

export type TItemSpecifics = typeof ITEM_SPECIFICS;

export type IItemSpecific = IProviderGroupInternalItemData & IProviderGroupEffect & IProviderGroupImageText & {
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
	} else if (inventoryAfterBuying.slice(0, 6).filter(Boolean).length > 5) {
		buyability = 0;
	}

	return buyability;
}
