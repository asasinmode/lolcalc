import type { IItemStat } from '@lolcalc/data/types';

export const ABILITY_TYPE = {
	champion: 'champion',
	item: 'item',
	effect: 'effect',
} as const;

export const ALL_ABILITY_TYPES: string[] = Object.values(ABILITY_TYPE);

export type TAbilityType = typeof ABILITY_TYPE[keyof typeof ABILITY_TYPE];

export const ALL_ITEM_CATEGORIES = ['fighter', 'marksman', 'assassin', 'mage', 'tank', 'support'] as const;

export type IItemCategory = typeof ALL_ITEM_CATEGORIES[number];

export const ALL_CHAMPION_ABILITY_KEYS = ['passive', 'q', 'w', 'e', 'r'] as const;

export type IChampionAbilityKey = typeof ALL_CHAMPION_ABILITY_KEYS[number];

export type INonPassiveAbilityKey = Exclude<IChampionAbilityKey, 'passive'>;

export const CHAMPION_STATS = ['hp', 'hpRegen', 'mana', 'manaRegen', 'healShieldPower', 'lethality', 'percentArmorPen', 'flatMagicPen', 'percentMagicPen', 'lifeSteal', 'omnivamp', 'attackRange', 'tenacity', 'attackDamage', 'abilityPower', 'armor', 'magicResist', 'attackSpeed', 'attackSpeedRatio', 'abilityHaste', 'critChance', 'critDamageMultiplier', 'moveSpeed', 'bonusAttackSpeedPercent', 'slowResist'] as const;

export type IChampionStatName = (typeof CHAMPION_STATS)[number];

export type IChampionStats = Record<IChampionStatName, number>;

export interface IStatsCalculationResult {
	/** raw stats from champion file */
	initial: IChampionStats;
	/** stats that could've been already modified from raw, like custom target dummy ones */
	base: IChampionStats;
	/** ONLY increases from level, i.e if champion gains 2 ad per level, on lvl 3 it will be `4` */
	level: Partial<IChampionStats>;
	/** base + level combined */
	baseOnLevel: IChampionStats;
	/** stats from rune shards */
	runeShards: Partial<IChampionStats>;
	/** raw stats given by items, no passives */
	itemBase: IChampionStats;
	/** stats from item passives */
	itemPassive: IChampionStats;
	/** sum of `itemBase` and `itemPassive` */
	itemTotal: IChampionStats;
	/** stats from champion's passive */
	championPassive: Partial<IChampionStats>;
	/**
	 * specific items' stat increases from their passives used in displaying the item tooltip, like current tear item mana
	 *
	 * known items that could but don't have it
	 * `mejai, hubris`
	 */
	itemStatIncreases: Record<string, Partial<Record<IItemStat, number>>>;
	bonus: IChampionStats;
	total: IChampionStats;
	meta: {
		hasMana: boolean;
		adaptiveForceStatVariable: IAdaptiveForceStatRv[1];
	};
	/** see the type definition for info */
	variables: IStatsCalculationVariables;
	/** see the type definition for info */
	miscDebug: IStatsCalculationMiscDebug;
}

// TODO maybe make more elaborate, like a record of strings where keys are appropriate stringified GameAbilityId
/** the variables calculated by various things, like riftmaker's void infusion */
export interface IStatsCalculationVariables {
	/** ap gained from blackfire torch's passive */
	blackfireTorchBBlaze?: number;
	/** ap gained from riftmaker's passive */
	riftmakerVoidInfusion?: number;
	/**
	 * ap value affected by multipliers like rabadon & blackfire torch passives
	 * from my understanding it's all "flat" ap bonuses, multipliers add, so rabadon's 30% and 1 blackfire burning champion's 4% would be 34% bonus ap
	 */
	apMultipliersBase: number;
	/** ap gained from rabadon's passive */
	rabadonMagicalOpus?: number;
	/** ap gained from archangel'seraph's passive */
	archangelSeraphAwe?: number;
	/** as gained from manamune/muramana's passive */
	manaMuraAwe?: number;
}

/** any other debug data for calculateStats, like bonus hp the riftmaker calculates void infusion from */
export interface IStatsCalculationMiscDebug {
	/** bonus hp used in riftmaker passive calculation */
	riftmakerBonusHp?: number;
	/** bonus mana used in tear items' passives' calculations */
	tearItemBonusMana?: number;
}

export type IAdaptiveForceStat = 'attackDamage' | 'abilityPower';

export type IAdaptiveForceStatRv = [IAdaptiveForceStat, adaptiveForceVariable: 0 | 1, multiplier: number];

export const CHAMPION_STAT_META: Record<IChampionStatName, IChampionStatMeta> = {
	hp: {
		name: 'Health',
	},
	mana: {
		name: 'Mana',
	},
	attackDamage: {
		name: 'Attack Damage',
	},
	abilityPower: {
		name: 'Ability Power',
	},
	armor: {
		name: 'Armor',
	},
	magicResist: {
		name: 'Magic Resist',
	},
	abilityHaste: {
		name: 'Ability Haste',
	},
	attackSpeed: {
		name: 'Attack Speed',
		decimal: 3,
	},
	attackSpeedRatio: {
		name: 'Attack Speed Ratio',
		decimal: 3,
	},
	bonusAttackSpeedPercent: {
		name: 'Bonus Attack Speed',
		decimal: 5,
		isPercentage: true,
	},
	critChance: {
		name: 'Critical Strike Chance',
		isPercentage: true,
		maxDisplayed: 100,
	},
	critDamageMultiplier: {
		name: 'Critical Strike Damage',
		isPercentage: true,
	},
	lethality: {
		name: 'Lethality',
	},
	percentArmorPen: {
		name: 'Percentage Armor Penetration',
		decimal: 2,
		isPercentage: true,
	},
	flatMagicPen: {
		name: 'Magic penetration',
	},
	percentMagicPen: {
		name: 'Percentage Magic Penetration',
		decimal: 2,
		isPercentage: true,
	},
	lifeSteal: {
		name: 'Life Steal',
		isPercentage: true,
	},
	omnivamp: {
		name: 'Omnivamp',
		isPercentage: true,
	},
	moveSpeed: {
		name: 'Move Speed',
	},
	tenacity: {
		name: 'Tenacity',
		isPercentage: true,
	},
	healShieldPower: {
		name: 'Heal and Shield power',
		isPercentage: true,
	},
	attackRange: {
		name: 'Attack Range',
	},
	hpRegen: {
		name: 'Health every 5 seconds',
	},
	manaRegen: {
		name: 'Mana/Resource every 5 seconds',
	},
	slowResist: {
		name: 'Slow Resist',
		isPercentage: true,
	},
};

export interface IChampionStatMeta {
	name: string;
	decimal?: number;
	isPercentage?: boolean;
	/** the max value displayed in stats panel, like crit chance only goes up to 100 */
	maxDisplayed?: number;
};

export const ALL_CHAMPION_STATS = Object.keys(CHAMPION_STAT_META) as IChampionStatName[];

export const ALL_CHAMPION_STATS_ENTRIES = Object.entries(CHAMPION_STAT_META) as [IChampionStatName, IChampionStatMeta][];

/** colloquial names to id */
export const ITEM_NAME_TO_ID = {
	slightlyMagicalFootwear: '2422',
	tear: '3070',
	whisperingCirclet: '2526',
	diademOfSongs: '2530',
	archangelsStaff: '3003',
	seraphsEmbrace: '3040',
	manamune: '3004',
	muramana: '3042',
	wintersApproach: '3119',
	fimbulwinter: '3121',
	hubris: '6697',
	darkSeal: '1082',
	mejai: '3041',
	hauntingGuise: '3147',
	roa: '6657',
	blackfireTorch: '2503',
	heartsteel: '3084',
	guinsoo: '3124',
	terminus: '3302',
	liandry: '6653',
	yunTal: '3032',
	shojin: '3161',
	riftmaker: '4633',
	blackCleaver: '3071',
	shurelya: '2065',
	runaan: '3085',
	trinity: '3078',
	phage: '3044',
	ardentCensor: '3504',
	staffOfFlowingWater: '6616',
	bandlepipes: '2524',
	knightsVow: '3109',
	protoplasmHarness: '2525',
	frozenHeart: '3110',
	serpentsFang: '6695',
	rylaisScepter: '3116',
	fiendhunterBolts: '2512',
	abyssalMask: '8020',
	horizonFocus: '4628',
	actualizer: '2522',
	hexoptics: '2523',
	youmuu: '3142',
	forceOfNature: '4401',
	deadMansPlate: '3742',
	bloodlettersCurse: '8010',
	experimentalHexplate: '3073',
	cosmicDrive: '4629',
	endlessHunger: '2517',
	mawOfMalmortius: '3156',
	jakSho: '6665',
	swiftmarch: '3170',
	crimsonLucidity: '3171',
	berserkerGreaves: '3006',
	gunmetalGreaves: '3172',
	chainlacedCrushers: '3173',
	armoredAdvanced: '3174',
	spellslingersShoes: '3175',
	gluttonousGreaves: '3008',
	immortalPath: '3168',
	foreverForward: '3176',
	celestialOpposition: '3869',
	dreamMaker: '3870',
	zazZakRealmspike: '3871',
	solsticeSleigh: '3876',
	bloodsong: '3877',
	rabadon: '3089',
	worldAtlas: '3865',
	runicCompass: '3866',
	bountyOfWorlds: '3867',
	overlordsBloodmail: '2501',
} as const;

export type TItemNameToId = typeof ITEM_NAME_TO_ID;

export const KEPT_UNPURCHASABLE_ITEMS: string[] = [
	ITEM_NAME_TO_ID.diademOfSongs,
	ITEM_NAME_TO_ID.slightlyMagicalFootwear,
	ITEM_NAME_TO_ID.seraphsEmbrace,
	ITEM_NAME_TO_ID.muramana,
	ITEM_NAME_TO_ID.fimbulwinter,
	ITEM_NAME_TO_ID.runicCompass,
	ITEM_NAME_TO_ID.bountyOfWorlds,
];

export const RANGED_ONLY_ITEMS: string[] = [ITEM_NAME_TO_ID.runaan];

export const SUPPORT_ITEMS: string[] = [
	ITEM_NAME_TO_ID.worldAtlas,
	ITEM_NAME_TO_ID.runicCompass,
	ITEM_NAME_TO_ID.bountyOfWorlds,
	ITEM_NAME_TO_ID.celestialOpposition,
	ITEM_NAME_TO_ID.dreamMaker,
	ITEM_NAME_TO_ID.zazZakRealmspike,
	ITEM_NAME_TO_ID.solsticeSleigh,
	ITEM_NAME_TO_ID.bloodsong,
];

export const UNTRANSFORMED_TEAR_ITEM_IDS: string[] = [
	ITEM_NAME_TO_ID.tear,
	ITEM_NAME_TO_ID.whisperingCirclet,
	ITEM_NAME_TO_ID.archangelsStaff,
	ITEM_NAME_TO_ID.manamune,
	ITEM_NAME_TO_ID.wintersApproach,
];

export const TRANSFORMED_TEAR_ITEM_IDS: string[] = [
	ITEM_NAME_TO_ID.diademOfSongs,
	ITEM_NAME_TO_ID.seraphsEmbrace,
	ITEM_NAME_TO_ID.muramana,
	ITEM_NAME_TO_ID.fimbulwinter,
];

/**
	* `ObjectName` in cdragon of the corresponding effect. Mainly used for hover tooltip text
	* `lolcalc` prefixed ones are custom, handled in `updateGameData.ts`
	*
	* for finding either
	*		1. in game, when the effect is applied check the its text
	*		2. find that text in stringtable
	*		3. in champion's bin file or `items.cdtb.bin.json` search for that stringtable key, then use the `ObjectName` of the object it's under
	*
	*	or try to do the mix of the above, usually item effects can be found next to the item key itself
	*	i.e on patch `16.4`
	*		1. the black cleaver shred would be somewhere close below the `Items/3071` key
	*		2. there's `Items/3071/Spells/3071BlackCleaverShred` that has `mBuff.mDescription` with `game_buff_tooltip_Black_Cleaver`
	*		3. that seems like the likely candidate, check the stringtable - it resolves to `This unit`s Armor is reduced...'
	*		4. this is the description we are looking for, use the `Items/3071/Spells/3071BlackCleaverShred.ObjectName` of `3071BlackCleaverShred`
	*/
export const EFFECT_OBJECT_NAME = {
	/* items */
	blackCleaverCarve: '3071BlackCleaverShred',
	shurelyaInspiringSpeech: '2065ActiveMoveSpeed',
	ardentSanctify: '3504Buff',
	flowingWaterRapids: '6616Buff',
	bandlepipesFanfare: '2524_SecondaryBuff',
	knightsVowSacrifice: 'lolcalc3109Sacrifice',
	frozenHeartWintersCaress: 'Item3110Aura',
	serpentsFangVenom: 'SerpentVenom',
	rylaisRimefrost: '3116Slow',
	abyssalMaskUnmake: '8020VisualDebuff',
	horizonFocusHypershot: '4628Marker',
	bloodletterVileDecay: '8010VisualDebuff',
	/* champion passives */
	amumuPCursedTouch: 'AmumuPDebuff',
	jannaPTailwind: 'Tailwind',
	nunuPCallOfFreljord: 'localcNunuPassive',
	ornnPLivingForge: 'lolcalcOrnnPassive',
	rellPBreakMold: 'RellP_Debuff',
	/* other */
	grievousWounds: 'lolcalcGrievousWounds',
	stun: 'lolcalcStun',
	slowFlat: 'lolcalcSlowFlat',
	slowPercent: 'lolcalcSlowPercent',
} as const;

export type IEffectObjectName = typeof EFFECT_OBJECT_NAME[keyof typeof EFFECT_OBJECT_NAME];
