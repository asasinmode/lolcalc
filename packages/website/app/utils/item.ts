import type { IShopItem } from './types';
import itemsData from '../assets/item.json';

const { data: items } = itemsData;

export type IInternalItemData<Item extends keyof TItemNameToId, Id = TItemNameToId[Item]> = Id extends keyof TItemSpecifics
	? TItemSpecifics[Id] extends { setupInternalData: (...args: any) => any }
		? ReturnType<TItemSpecifics[Id]['setupInternalData']>
		: never
	: never;

export type IItemEffectData<Item extends keyof TItemNameToId, Id = TItemNameToId[Item]> = Id extends keyof TItemSpecifics
	? TItemSpecifics[Id] extends { setupEffectData: (...args: any) => any }
		? ReturnType<TItemSpecifics[Id]['setupEffectData']>
		: never
	: never;

export type TItemSpecifics = typeof ITEM_SPECIFICS;

const tearItemSpecifics = {
	internalDataProperties: ['manaflow'],
	setupInternalData(self: DamageSource) {
		self.internalItemData.value.manaflow = Math.max(0, Math.min(360, self.internalItemData.value.manaflow ?? 0));
		return { manaflow: 0 };
	},
	itemImageTextLabel: 'Manaflow stacks',
	itemImageText(data: { manaflow: number }) {
		return data.manaflow;
	},
};

export const ITEM_SPECIFICS = {
	[ITEM_NAME_TO_ID.hubris]: {
		internalDataProperties: ['eminence'],
		setupInternalData(self) {
			self.internalItemData.value.eminence = Math.max(0, self.internalItemData.value.eminence ?? 0);
			return { eminence: 0 };
		},
		itemImageTextLabel: 'Eminence stacks',
		itemImageText(data: { eminence: 0 }) {
			return data.eminence && items[ITEM_NAME_TO_ID.hubris].dataValues.BonusLethality + data.eminence * items[ITEM_NAME_TO_ID.hubris].dataValues.ADPerStatue;
		},
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		internalDataProperties: ['glory'],
		setupInternalData(self) {
			self.internalItemData.value.glory = Math.max(0, Math.min(10, self.internalItemData.value.glory ?? 0));
			return { glory: 0 };
		},
		itemImageTextLabel: 'Glory stacks',
		itemImageText(data: { glory: number }) {
			return data.glory;
		},
	},
	[ITEM_NAME_TO_ID.mejai]: {
		internalDataProperties: ['glory'],
		setupInternalData(self) {
			self.internalItemData.value.glory = Math.max(0, Math.min(25, self.internalItemData.value.glory ?? 0));
			return { glory: 0 };
		},
		itemImageTextLabel: 'Glory stacks',
		itemImageText(data: { glory: number }) {
			return data.glory;
		},
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		internalDataProperties: ['madness'],
		setupInternalData(self) {
			self.internalItemData.value.madness = Math.max(0, Math.min(3, self.internalItemData.value.madness ?? 0));
			return { madness: 0 };
		},
		itemImageTextLabel: 'Madness bonus damage',
		itemImageText(data: { madness: number }) {
			return data.madness && `${Math.round(data.madness * items[ITEM_NAME_TO_ID.hauntingGuise].dataValues.DamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.roa]: {
		internalDataProperties: ['eternity'],
		setupInternalData(self) {
			self.internalItemData.value.eternity = Math.max(0, Math.min(10, self.internalItemData.value.eternity ?? 0));
			return { eternity: 0 };
		},
		itemImageTextLabel: 'Eternity stacks',
		itemImageText(data: { eternity: number }) {
			return data.eternity;
		},
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		internalDataProperties: ['bBlaze'],
		setupInternalData(self) {
			self.internalItemData.value.bBlaze = Math.max(0, self.internalItemData.value.bBlaze ?? 0);
			return { bBlaze: 0 };
		},
		itemImageTextLabel: 'Baleful Blaze ap increase',
		itemImageText(data: { bBlaze: number }) {
			return data.bBlaze && `${Math.round(data.bBlaze * items[ITEM_NAME_TO_ID.blackfireTorch].dataValues.APPerStack * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		internalDataProperties: ['cConsumption'],
		setupInternalData(self) {
			self.internalItemData.value.cConsumption = Math.max(0, self.internalItemData.value.cConsumption ?? 0);
			return { cConsumption: 0 };
		},
		itemImageTextLabel: 'Colosal Consumption health increase',
		itemImageText(data: { cConsumption: number }) {
			return data.cConsumption;
		},
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		internalDataProperties: ['seething'],
		setupInternalData(self) {
			self.internalItemData.value.seething = Math.max(0, Math.min(4, self.internalItemData.value.seething ?? 0));
			return { seething: 0 };
		},
		itemImageTextLabel: 'Seething Strikes stacks',
		itemImageText(data: { seething: number }) {
			return data.seething;
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
		itemImageText(data: { jxtpL: number; jxtpD: number }, property?: 'jxtpL' | 'jxtpD') {
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
		itemImageText(data: { madness: number }) {
			return data.madness && `${Math.round(data.madness * items[ITEM_NAME_TO_ID.liandry].dataValues.DamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		internalDataProperties: ['practice'],
		setupInternalData(self) {
			self.internalItemData.value.practice = Math.max(0, Math.min(25, self.internalItemData.value.practice ?? 0));
			return { practice: 0 };
		},
		itemImageTextLabel: 'Practice Makes Lethal critical strike chance',
		itemImageText(data: { practice: number }) {
			return data.practice && `${data.practice}%`;
		},
	},
	[ITEM_NAME_TO_ID.shojin]: {
		internalDataProperties: ['fWill'],
		setupInternalData(self) {
			self.internalItemData.value.fWill = Math.max(0, Math.min(4, self.internalItemData.value.fWill ?? 0));
			return { fWill: 0 };
		},
		itemImageTextLabel: 'Focused Will ability damage increase',
		itemImageText(data: { fWill: number }) {
			return data.fWill && `${Math.round(data.fWill * items[ITEM_NAME_TO_ID.shojin].dataValues.SpellDamageIncrease * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		internalDataProperties: ['corruption'],
		setupInternalData(self) {
			self.internalItemData.value.corruption = Math.max(0, Math.min(4, self.internalItemData.value.corruption ?? 0));
			return { corruption: 0 };
		},
		itemImageTextLabel: 'Corruption bonus damage',
		itemImageText(data: { corruption: number }) {
			return data.corruption && `${Math.round(data.corruption * items[ITEM_NAME_TO_ID.riftmaker].dataValues.EternityDamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.tear]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.whisperingCirclet]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.archangelsStaff]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.manamune]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.wintersApproach]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.blackCleaver]: {
		setupEffectData(self, effect): [carve: number, fervor: boolean] {
			console.log('setting up black cleaver effect', effect, self.appliedEffects.value);
			return [
				Math.max(0, Math.min(5, effect?.data[0] ?? 0)),
				Boolean(effect?.data[1]),
			];
		},
	},
	[ITEM_NAME_TO_ID.shurelya]: {
		setupEffectData(self, effect): [inspiringSpeech: boolean] {
			console.log('setting up shurelya effect', effect, self.appliedEffects.value);
			return [Boolean(effect?.data[0])];
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
	/** text on the item's image, like current heartsteel/mejai stacks */
	itemImageText?: (internalData: any, property?: any) => string | number;
	/** sr only label for the shown image text */
	itemImageTextLabel?: string;
	/** same as `setupInternalData` for `DamageSource.internalEffectsData` */
	setupEffectData?: (self: DamageSource, effect?: IDamageSourceEffect) => IDamageSourceEffect['data'];
}>;

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
