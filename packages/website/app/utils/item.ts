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
		imgActive(internalData: { quicken: number }) {
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
		imgActive(internalData: { fervor: number }) {
			return internalData.fervor;
		},
		imgTextLabel: 'Carve stacks',
		imgText(self) {
			return self.internalItemData.value.carve;
		},
	},
	[ITEM_NAME_TO_ID.celestialOpposition]: {
		internalDataProperties: ['mBlessing'],
		setupData(self) {
			self.internalItemData.value.mBlessing = clamp(0, self.internalItemData.value.mBlessing ?? 0, 1);
			return { mBlessing: 0 };
		},
		imgActive(internalData: { mBlessing: number }) {
			return internalData.mBlessing;
		},
	},
	[ITEM_NAME_TO_ID.phage]: {
		internalDataProperties: ['rage'],
		setupData(self) {
			self.internalItemData.value.rage = clamp(0, self.internalItemData.value.rage ?? 0, 1);
			return { rage: 0 };
		},
		imgActive(internalData: { rage: number }) {
			return internalData.rage;
		},
	},
	[ITEM_NAME_TO_ID.shurelya]: {
		internalDataProperties: ['iSpeech'],
		setupData(self) {
			self.internalItemData.value.iSpeech = clamp(0, self.internalItemData.value.iSpeech ?? 0, 1);
			return { iSpeech: 0 };
		},
		imgActive(internalData: { iSpeech: number }) {
			return internalData.iSpeech;
		},
	},
	[ITEM_NAME_TO_ID.ardentCensor]: {
		internalDataProperties: ['sanctify'],
		setupData(self) {
			self.internalItemData.value.sanctify = clamp(0, self.internalItemData.value.sanctify ?? 0, 1);
			return { sanctify: 0 };
		},
		imgActive(internalData: { sanctify: number }) {
			return internalData.sanctify;
		},
	},
	[ITEM_NAME_TO_ID.staffOfFlowingWater]: {
		internalDataProperties: ['rapids'],
		setupData(self) {
			self.internalItemData.value.rapids = clamp(0, self.internalItemData.value.rapids ?? 0, 1);
			return { rapids: 0 };
		},
		imgActive(internalData: { rapids: number }) {
			return internalData.rapids;
		},
	},
	[ITEM_NAME_TO_ID.bandlepipes]: {
		internalDataProperties: ['fanfare'],
		setupData(self) {
			self.internalItemData.value.fanfare = clamp(0, self.internalItemData.value.fanfare ?? 0, 1);
			return { fanfare: 0 };
		},
		imgActive(internalData: { fanfare: number }) {
			return internalData.fanfare;
		},
	},
	[ITEM_NAME_TO_ID.protoplasmHarness]: {
		internalDataProperties: ['pHLifeline'],
		setupData(self) {
			self.internalItemData.value.pHLifeline = clamp(0, self.internalItemData.value.pHLifeline ?? 0, 1);
			return { pHLifeline: 0 };
		},
		imgActive(internalData: { pHLifeline: number }) {
			return internalData.pHLifeline;
		},
	},
	[ITEM_NAME_TO_ID.frozenHeart]: {
		internalDataProperties: ['wCaress'],
		setupData(self) {
			self.internalItemData.value.wCaress = clamp(0, self.internalItemData.value.wCaress ?? 0, 1);
			return { wCaress: 0 };
		},
		imgActive(internalData: { wCaress: number }) {
			return internalData.wCaress;
		},
	},
	[ITEM_NAME_TO_ID.serpentsFang]: {
		internalDataProperties: ['sVenom'],
		setupData(self) {
			self.internalItemData.value.sVenom = clamp(0, self.internalItemData.value.sVenom ?? 0, 1);
			return { sVenom: 0 };
		},
		imgActive(internalData: { sVenom: number }) {
			return internalData.sVenom;
		},
	},
	[ITEM_NAME_TO_ID.rylaisScepter]: {
		internalDataProperties: ['rimefrost'],
		setupData(self) {
			self.internalItemData.value.rimefrost = clamp(0, self.internalItemData.value.rimefrost ?? 0, 1);
			return { rimefrost: 0 };
		},
		imgActive(internalData: { rimefrost: number }) {
			return internalData.rimefrost;
		},
	},
	[ITEM_NAME_TO_ID.fiendhunterBolts]: {
		internalDataProperties: ['oBarrage'],
		setupData(self) {
			self.internalItemData.value.oBarrage = clamp(0, self.internalItemData.value.oBarrage ?? 0, 1);
			return { oBarrage: 0 };
		},
		imgActive(internalData: { oBarrage: number }) {
			return internalData.oBarrage;
		},
	},
	[ITEM_NAME_TO_ID.abyssalMask]: {
		internalDataProperties: ['unmake'],
		setupData(self) {
			self.internalItemData.value.unmake = clamp(0, self.internalItemData.value.unmake ?? 0, 1);
			return { unmake: 0 };
		},
		imgActive(internalData: { unmake: number }) {
			return internalData.unmake;
		},
	},
	[ITEM_NAME_TO_ID.horizonFocus]: {
		internalDataProperties: ['hypershot'],
		setupData(self) {
			self.internalItemData.value.hypershot = clamp(0, self.internalItemData.value.hypershot ?? 0, 1);
			return { hypershot: 0 };
		},
		imgActive(internalData: { hypershot: number }) {
			return internalData.hypershot;
		},
	},
	[ITEM_NAME_TO_ID.actualizer]: {
		internalDataProperties: ['empowered'],
		setupData(self) {
			self.internalItemData.value.empowered = clamp(0, self.internalItemData.value.empowered ?? 0, 1);
			return { empowered: 0 };
		},
		imgActive(internalData: { empowered: number }) {
			return internalData.empowered;
		},
	},
	[ITEM_NAME_TO_ID.hexoptics]: {
		internalDataProperties: ['magnification'],
		setupData(self) {
			self.internalItemData.value.magnification = clamp(0, self.internalItemData.value.magnification ?? 0, items[ITEM_NAME_TO_ID.hexoptics].dataValues.MaxRange);
			return { magnification: 0 };
		},
		imgTextLabel: 'Magnification % damage increase',
		imgText(self) {
			const { magnification } = self.internalItemData.value as { magnification: number };
			const { dataValues: { MaxRange, MaxDamageAmp } } = items[ITEM_NAME_TO_ID.hexoptics];
			return magnification && `${roundVariable(Math.round((magnification / MaxRange * 100 * MaxDamageAmp) * 10) / 10)}%`;
		},
	},
	[ITEM_NAME_TO_ID.youmuu]: {
		internalDataProperties: ['haunt', 'wStep'],
		setupData(self) {
			self.internalItemData.value.haunt = clamp(0, self.internalItemData.value.haunt ?? 0, 1);
			self.internalItemData.value.wStep = clamp(0, self.internalItemData.value.wStep ?? 0, 1);
			return { haunt: 0, wStep: 0 };
		},
		imgActive(internalData: { haunt: number; wStep: number }) {
			return [internalData.haunt, internalData.wStep];
		},
	},
	[ITEM_NAME_TO_ID.forceOfNature]: {
		internalDataProperties: ['steadfast'],
		setupData(self) {
			self.internalItemData.value.steadfast = clamp(0, self.internalItemData.value.steadfast ?? 0, 1);
			return { steadfast: 0 };
		},
		imgActive(internalData: { steadfast: number }) {
			return internalData.steadfast;
		},
	},
	[ITEM_NAME_TO_ID.deadMansPlate]: {
		internalDataProperties: ['shipwrecker'],
		setupData(self) {
			self.internalItemData.value.shipwrecker = clamp(0, self.internalItemData.value.shipwrecker ?? 0, items[ITEM_NAME_TO_ID.deadMansPlate].dataValues.MaxMovementSpeed);
			return { shipwrecker: 0 };
		},
		imgTextLabel: 'Shipwrecker built up movement speed',
		imgText(self) {
			return (self.internalItemData.value as { shipwrecker: number }).shipwrecker;
		},
	},
	[ITEM_NAME_TO_ID.bloodlettersCurse]: {
		internalDataProperties: ['vDecay'],
		setupData(self) {
			self.internalItemData.value.vDecay = Math.max(0, Math.min(
				EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.bloodletterVileDecay].maxValue,
				self.internalItemData.value.vDecay ?? 0,
			));
			return { vDecay: 0 };
		},
		imgTextLabel: 'Vile Decay stacks',
		imgText(self) {
			return self.internalItemData.value.vDecay;
		},
	},
	[ITEM_NAME_TO_ID.experimentalHexplate]: {
		internalDataProperties: ['overdrive'],
		setupData(self) {
			self.internalItemData.value.overdrive = clamp(0, self.internalItemData.value.overdrive ?? 0, 1);
			return { overdrive: 0 };
		},
		imgActive(internalData: { overdrive: number }) {
			return internalData.overdrive;
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
	[ITEM_NAME_TO_ID.cosmicDrive]: {
		internalDataProperties: ['spelldance'],
		setupData(self) {
			self.internalItemData.value.spelldance = clamp(0, self.internalItemData.value.spelldance ?? 0, 1);
			return { spelldance: 0 };
		},
		imgActive(internalData: { spelldance: number }) {
			return internalData.spelldance;
		},
	},
	[ITEM_NAME_TO_ID.endlessHunger]: {
		internalDataProperties: ['feast'],
		setupData(self) {
			self.internalItemData.value.feast = clamp(0, self.internalItemData.value.feast ?? 0, 1);
			return { feast: 0 };
		},
		imgActive(internalData: { feast: number }) {
			return internalData.feast;
		},
	},
	[ITEM_NAME_TO_ID.mawOfMalmortius]: {
		internalDataProperties: ['mawLifeline'],
		setupData(self) {
			self.internalItemData.value.mawLifeline = clamp(0, self.internalItemData.value.mawLifeline ?? 0, 1);
			return { mawLifeline: 0 };
		},
		imgActive(internalData: { mawLifeline: number }) {
			return internalData.mawLifeline;
		},
	},
	[ITEM_NAME_TO_ID.jakSho]: {
		internalDataProperties: ['vbResistance'],
		setupData(self) {
			self.internalItemData.value.vbResistance = clamp(0, self.internalItemData.value.vbResistance ?? 0, 1);
			return { vbResistance: 0 };
		},
		imgActive(internalData: { vbResistance: number }) {
			return internalData.vbResistance;
		},
	},
} satisfies IHypotheticalItemSpecifics;

export type TItemSpecifics = typeof ITEM_SPECIFICS;
export type IHypotheticalItemSpecifics = Record<string, IItemSpecific>;

export type IItemSpecific = IProviderGroupImageText & IProviderGroupInternalItemData & {
	/**
	 * whether to show the green dot that the item is active in the top right corner of the image
	 * when array, the indicator dot will be split in half and colored based on the array 1/2 being trueish, useful for youmuu
	 */
	imgActive?: (internalData: any) => [(number | boolean), (number | boolean)] | number | boolean;
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
	transformBoots = false,
	isMove = false,
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
		(target.champion.value && !target.isRanged.value && (RANGED_ONLY_ITEM_IDS as string[]).includes(item.id))
		|| (!(transformBoots && isMove && item.isBoots) && inventoryAfterBuying.some(boughtItem => boughtItem && boughtItem.itemGroups?.some(group => item.itemGroups?.includes(group))))
		|| (!transformBoots && target && target.roleQuest.value !== 'mid' && item.isBoots && item.epicness === 7)
	) {
		buyability = -1;
	} else if (!isMove && inventoryAfterBuying.slice(0, 6).filter(Boolean).length > 5 && (target.roleQuest.value !== 'bot' || inventoryAfterBuying[6])) {
		buyability = 0;
	}

	return buyability;
}
