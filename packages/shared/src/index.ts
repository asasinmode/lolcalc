import type { IItemStat } from '@lolcalc/data/types';

/** order should be preserved when new ones are added because it's used for stringifying the type - `champion` will become 0. If order were to be changed, it would probably be a breaking change to parsing & stringifying */
export const AbilityType = {
	champion: 'champion',
	item: 'item',
	effect: 'effect',
	dragon: 'dragon',
} as const;

export const ALL_ABILITY_TYPES: string[] = Object.values(AbilityType);

export type TAbilityType = typeof AbilityType[keyof typeof AbilityType];

export const ALL_ITEM_CATEGORIES = ['fighter', 'marksman', 'assassin', 'mage', 'tank', 'support'] as const;

export type IItemCategory = typeof ALL_ITEM_CATEGORIES[number];

export const ALL_CHAMPION_ABILITY_KEYS = ['passive', 'q', 'w', 'e', 'r'] as const;

export type IChampionAbilityKey = typeof ALL_CHAMPION_ABILITY_KEYS[number];

export type INonPassiveAbilityKey = Exclude<IChampionAbilityKey, 'passive'>;

export const CHAMPION_STATS = ['hp', 'hpRegen', 'mana', 'manaRegen', 'healShieldPower', 'lethality', 'percentArmorPen', 'flatMagicPen', 'percentMagicPen', 'lifeSteal', 'omnivamp', 'attackRange', 'tenacity', 'attackDamage', 'abilityPower', 'armor', 'magicResist', 'attackSpeed', 'attackSpeedRatio', 'abilityHaste', 'critChance', 'critDamageMultiplier', 'moveSpeed', 'bonusAttackSpeedPercent', 'slowResist', 'ultimateHaste', 'basicHaste', 'immobilizingHaste'] as const;

export type IChampionStatName = (typeof CHAMPION_STATS)[number];

export type IMultiplicativeChampionStatName = 'tenacity' | 'slowResist';

export type IChampionStats = Record<IChampionStatName, number>;

export interface IStatsCalculationResult {
	isRanged?: boolean;
	/** raw stats from champion file */
	initial: IChampionStats;
	/** stats that could've been already modified from raw, like custom target dummy ones */
	base: IChampionStats;
	/** ONLY increases from level, i.e if champion gains 2 ad per level, on lvl 3 it will be `4` */
	level: Partial<IChampionStats>;
	/** base + level combined */
	baseOnLevel: IChampionStats;
	/** stats from rune shards */
	runeShards: Partial<IChampionStats> & Pick<IChampionStats, IMultiplicativeChampionStatName>;
	/** raw stats given by items, no passives */
	itemBase: IChampionStats;
	/** stats from item passives */
	itemPassive: IChampionStats;
	/** sum of `itemBase` and `itemPassive` */
	itemTotal: IChampionStats;
	dragon: Partial<IChampionStats> & Pick<IChampionStats, IMultiplicativeChampionStatName>;
	/** stats from champion's passive */
	championPassive: Partial<IChampionStats>;
	/**
	 * specific items' stat increases from their passives used in displaying the item tooltip, like current tear item mana
	 *
	 * known items that could but don't have it
	 * `mejai, hubris`
	 */
	itemStatIncreases: Record<string, Partial<Record<IItemStat, number>>>;
	/**
	 * stats gained from any multipliers like mid role quest, dragons, rabadon or jak'sho
	 * atm this tries to include both multipliers to all types of stats, base/bonus/total. Maybe they should be separated
	 */
	totalMultipliers: IChampionStats;
	/** total stats before applying multipliers (`totalMultipliersStats`) */
	totalPreMultipliers: IChampionStats;
	dragonStatMultipliers: Pick<IChampionStats, 'attackDamage' | 'abilityPower' | 'armor' | 'magicResist'>;
	bonus: IChampionStats;
	effect: Partial<IChampionStats>;
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

/** the variables calculated by various things, like riftmaker's void infusion */
export interface IStatsCalculationVariables {
	/** if mid quest is selected it will be the % the quest reward gives (`0.08`) */
	midQuestMultiplier: number;
	totalBonusPercentMoveSpeed: number;
	/** penalty from move speed soft cap */
	movespeedSoftCapPenalty: number;
	/**
	 * ad that's not supposed to be multiplied by overlord's retribution. Currently
	 * - Rammus' passive infernal bonus. If Rammus' passive gives 100 ad and he has 1 infernal, it will be `3`
	 */
	bloodmailRetributionExcludedAd: number;
	/**
	 * heal and shield multiplier from spirit visage, actualizer and immortal path's passives
	 * [wiki of sources](https://wiki.leagueoflegends.com/en-us/Heal_and_shield_power#Notes)
	 * TODO include revitalize
	 * @note it starts from 1
	 */
	healShieldMult: number;
	/** same as `healShieldMult` but just for regen. Note that it starts at 0 */
	hpRegenMult: number;
	/** same as `healShieldMult` but for life steal/omnivamp. Note that it starts at 0 */
	lifeStealOmnivampMult: number;
	/** ad gained from completed mid quest */
	midQuestAd?: number;
	/** ap gained from completed mid quest */
	midQuestAp?: number;
	/** bonus damage % gained from liandry's passive stacks, doesn't affect stats but is kept here */
	liandryBonusDamagePercent?: number;
	/** bonus damage % gained from haunting guise's passive stacks, doesn't affect stats but is kept here */
	hauntingGuiseBonusDamagePercent?: number;
	/** bonus damage % gained from riftmaker's passive stacks, doesn't affect stats but is kept here */
	riftmakerBonusDamagePercent?: number;
	/** % increase of stuff from actualizer's passive, doesn't affect stats but is kept here */
	actualizerBuffPercent?: number;
	/** bonus damage % gained from shojin's passive stacks, doesn't affect stats but is kept here */
	shojinBonusDamagePercent?: number;
	/** ap gained from blackfire torch's passive */
	blackfireTorchBBlazeAP?: number;
	/** multiplier value from blackfire torch's passive */
	blackfireTorchBBlazeMultiplier?: number;
	/** ap gained from riftmaker's passive */
	riftmakerVoidInfusion?: number;
	/**
	 * ap value affected by multipliers like rabadon & blackfire torch passives
	 * from my understanding it's all "flat" ap bonuses, multipliers add, so rabadon's 30% and 1 blackfire burning champion's 4% would be 34% bonus ap
	 */
	apMultipliersBase: number;
	/** ap multipliers from items like rabadon and blackfire torch */
	totalItemApMultipliers: number;
	/** mana regen % gained from items (`1` = 100%, `1.5` would be 150%) */
	baseItemManaRegenPercent: number;
	/** ap gained from rabadon's passive */
	rabadonMagicalOpus?: number;
	/** ap gained from archangel/seraph's passive */
	archangelSeraphAwe?: number;
	/** ad gained from manamune/muramana's passive */
	manaMuraAwe?: number;
	/** hp gained from winter's approach/fimbulwinter's passive */
	approachFimbulAwe?: number;
	/** heal shield power gained from whispering circlet's/diadem of songs passive */
	whisperingDiademAwe?: number;
	/** attack speed value reduced by frozen heart's passive */
	frozenHeartCaress?: number;
	/** ad gained from overlord's bloodmail bonus hp to ad passive */
	bloodmailTyranny?: number;
	/** ad gained from overlord's bloodmail missing hp ad increase passive */
	bloodmailRetribution?: number;
	/** omnivamp gained from endless hunger's feast passive */
	endlessOmnivamp?: number;
	/** ability haste gained from endless hunger's famine passive */
	endlessHaste?: number;
	/** omnivamp gained from gluttonous greaves/immortal path's passive */
	gluttonousImmortalOmnivamp?: number;
	/** ad gained from sterak's gage passive */
	sterakAd?: number;
	/** adaptive force gained from swiftmarch's passive */
	swiftmarchAdaptive?: number;
	/** hp gained from warmog's passive */
	warmogsVitality?: number;
	/** % of mana gained from ryze's passive */
	ryzePassivePercentManaIncrease?: number;
	/** heal and shield power gained from dawncore's passive */
	dawncoreHsp?: number;
	/** ability power gained from dawncore's passive */
	dawncoreAp?: number;
	/** hp gained from roa's passive */
	roaHp?: number;
	/** mana gained from roa's passive */
	roaMana?: number;
	/** ap gained from roa's passive */
	roaAp?: number;
	/** lethality gained from voltaic's passive trigger */
	voltaicLethality?: number;
	/** move speed gained from phage's passive */
	phageMoveSpeed?: number;
	/** move speed gained from trinity force's passive */
	trinityForceMoveSpeed?: number;
	/** move speed gained from black cleaver's passive */
	blackCleaverMoveSpeed?: number;
	/** move speed percent gained from crimson lucidity passive */
	crimsonLucidityMSPercent?: number;
	/** crit chance gained from yuntal's practice passive */
	yuntalCritChance?: number;
	/** attack speed gained from yuntal's flurry passive */
	yuntalAttackSpeed?: number;
	/** move speed percent gained from storm razor's passive */
	stormrazorMSPercent?: number;
	/** move speed percent gained from mercurial scimitar's passive */
	mercurialMSPercent?: number;
	/** value bonus resists are multiplied by when jak'sho's passive is active, like `0.3` */
	jakShoBonusResistMultiplier?: number;
	/** armor gained from jak'sho's passive */
	jakShoArmor?: number;
	/** magic resist gained from jak'sho's passive */
	jakShoMagicResist?: number;
	/** armor & magic penetration from terminus' passive */
	terminusPercentagePen?: number;
	/** armor & magic resist from terminus' passive */
	terminusResists?: number;
	/** heal, shield and regen mult from spirit visage's passive */
	spiritVisageHSMult?: number;
	/** healing multiplier from Briar's passive, TODO check how it works on life steal/heals */
	briarHealingMult?: number;
}

/** any other debug data for calculateStats, like bonus hp the riftmaker calculates void infusion from */
export interface IStatsCalculationMiscDebug {
	/** bonus hp riftmaker's passive is based on */
	riftmakerBonusHp?: number;
	/** bonus hp overlord's bloodmail's passive is based on */
	bloodmailBonusHp?: number;
	/** % ad gained from bloodmail's retribution passive */
	bloodmailRetributionPercentage?: number;
	/** bonus mana tear items' passives calculations are based on */
	tearItemBonusMana?: number;
	/** bonus hp endless hunger's famine passive is based on */
	endlessBonusAd?: number;
	/** total movespeed swiftmarch's passive is based on */
	swiftmarchTotalMs?: number;
	/** total ap ryze passive is based on */
	ryzePassiveAPBase?: number;
	/** mana value ryze's passive is applied onto */
	ryzePassiveManaBase?: number;
	/** mana gained from ryze's passive */
	ryzePMana?: number;
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
		decimal: 3,
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
	ultimateHaste: {
		name: 'Ultimate Haste',
	},
	basicHaste: {
		name: 'Basic Ability Haste',
	},
	immobilizingHaste: {
		name: 'Immobilizing Ability Haste',
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
	sapphireCrystal: '1027',
	rubyCrystal: '1028',
	dagger: '1042',
	doransShield: '1054',
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
	ardentCenser: '3504',
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
	hexdrinker: '3155',
	mawOfMalmortius: '3156',
	jakSho: '6665',
	bootsOfSwiftness: '3009',
	sorcerersShoes: '3020',
	swiftmarch: '3170',
	crimsonLucidity: '3171',
	berserkerGreaves: '3006',
	gunmetalGreaves: '3172',
	chainlacedCrushers: '3173',
	armoredAdvance: '3174',
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
	lichBane: '3100',
	botrk: '3153',
	steraksGage: '3053',
	duskAndDawn: '2510',
	unendingDespair: '2502',
	fatedAshes: '2508',
	bastionBreaker: '2520',
	zekesConvergence: '3050',
	spiritVisage: '3065',
	sunfireAegis: '3068',
	ravenousHydra: '3074',
	brambleVest: '3076',
	thornmail: '3075',
	executionersCalling: '3123',
	morellonomicon: '3165',
	oblivionOrb: '3916',
	chempunkChainsword: '6609',
	mortalReminder: '3033',
	tiamat: '3077',
	wardensMail: '3082',
	warmogsArmor: '3083',
	statikkShiv: '3087',
	witsEnd: '3091',
	redemption: '3107',
	ldr: '3036',
	nashorsTooth: '3115',
	malignance: '3118',
	cryptbloom: '3137',
	randuinsOmen: '3143',
	rocketbelt: '3152',
	imperialMandate: '4005',
	forbiddenIdol: '3114',
	umbralGlaive: '3179',
	hullbreaker: '3181',
	solariLocket: '3190',
	mikaelsBlessing: '3222',
	essenceReaver: '3508',
	stormsurge: '4646',
	deathsDance: '6333',
	sunderedSky: '6610',
	moonstoneRenewer: '6617',
	echoesOfHelia: '6620',
	dawncore: '6621',
	stridebreaker: '6631',
	ludensEcho: '6655',
	bamisCinder: '6660',
	icebornGauntlet: '6662',
	hollowRadiance: '6664',
	krakenSlayer: '6672',
	immortalShieldbow: '6673',
	eclipse: '6692',
	voltaicCyclosword: '6699',
	seryldasGrudge: '6694',
	scoutsSlingshot: '3144',
	recurveBow: '1043',
	sheen: '3057',
	hextechAlternator: '3145',
	rfc: '3094',
	kaenicRookern: '2504',
	hextechGunblade: '3146',
	stormrazor: '3097',
	mercurialScimitar: '3139',
	titanicHydra: '3748',
	bloodthirster: '3072',
	axiomArc: '6696',
	profaneHydra: '6698',
	mercurysTreads: '3111',
	zhonya: '3157',
	shadowflame: '4645',
	infinityEdge: '3031',
	collector: '6676',
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

export const UPGRADED_SUPPORT_ITEMS: string[] = [
	ITEM_NAME_TO_ID.celestialOpposition,
	ITEM_NAME_TO_ID.dreamMaker,
	ITEM_NAME_TO_ID.zazZakRealmspike,
	ITEM_NAME_TO_ID.solsticeSleigh,
	ITEM_NAME_TO_ID.bloodsong,
];

export const SUPPORT_ITEMS: string[] = [
	ITEM_NAME_TO_ID.worldAtlas,
	ITEM_NAME_TO_ID.runicCompass,
	ITEM_NAME_TO_ID.bountyOfWorlds,
	...UPGRADED_SUPPORT_ITEMS,
];

export const UNTRANSFORMED_TEAR_ITEM_IDS = [
	ITEM_NAME_TO_ID.tear,
	ITEM_NAME_TO_ID.whisperingCirclet,
	ITEM_NAME_TO_ID.archangelsStaff,
	ITEM_NAME_TO_ID.manamune,
	ITEM_NAME_TO_ID.wintersApproach,
];

export const TRANSFORMED_TEAR_ITEM_IDS = [
	ITEM_NAME_TO_ID.diademOfSongs,
	ITEM_NAME_TO_ID.seraphsEmbrace,
	ITEM_NAME_TO_ID.muramana,
	ITEM_NAME_TO_ID.fimbulwinter,
];

export const TEAR_ITEM_TRANSFORMATIONS: Record<string, string> = {
	[ITEM_NAME_TO_ID.whisperingCirclet]: ITEM_NAME_TO_ID.diademOfSongs,
	[ITEM_NAME_TO_ID.archangelsStaff]: ITEM_NAME_TO_ID.seraphsEmbrace,
	[ITEM_NAME_TO_ID.manamune]: ITEM_NAME_TO_ID.muramana,
	[ITEM_NAME_TO_ID.wintersApproach]: ITEM_NAME_TO_ID.fimbulwinter,
	[ITEM_NAME_TO_ID.diademOfSongs]: ITEM_NAME_TO_ID.whisperingCirclet,
	[ITEM_NAME_TO_ID.seraphsEmbrace]: ITEM_NAME_TO_ID.archangelsStaff,
	[ITEM_NAME_TO_ID.muramana]: ITEM_NAME_TO_ID.manamune,
	[ITEM_NAME_TO_ID.fimbulwinter]: ITEM_NAME_TO_ID.wintersApproach,
};

export const GRIEVOUS_WOUND_ITEMS = [
	ITEM_NAME_TO_ID.brambleVest,
	ITEM_NAME_TO_ID.executionersCalling,
	ITEM_NAME_TO_ID.oblivionOrb,
	ITEM_NAME_TO_ID.thornmail,
	ITEM_NAME_TO_ID.mortalReminder,
	ITEM_NAME_TO_ID.chempunkChainsword,
	ITEM_NAME_TO_ID.morellonomicon,
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
	botrkClawingShadows: '3153Slow',
	zekesConvergenceFrostfireTempest: '3050_EnemyBuff',
	celestialOppositionBlessingShattered: 'lolcalc3869BlessingShattered',
	randuinsHumility: 'lolcalc3143HumilitySlow',
	malignanceHatefog: '3118VisualDebuff',
	imperialMandateCommand: '4005Debuff',
	stridebreakerBShockwaveSlow: 'lolcalc6631BShockwaveSlow',
	icebornGauntletFrostField: 'lolcalc6662FrostField',
	bloodsongSpellbladed: 'lolcalc3877Spellbladed',
	seryldaBitterCold: 'lolcalc6694BitterCold',
	gunbladeLightningBolt: 'lolcalc3146LightningBolt',
	/* champion passives */
	amumuPCursedTouch: 'AmumuPDebuff',
	jannaPTailwind: 'Tailwind',
	nunuPCallOfFreljord: 'localcNunuPassive',
	ornnPLivingForge: 'lolcalcOrnnPassive',
	rellPBreakMold: 'RellP_Debuff',
	/* other */
	grievousWounds: 'lolcalcGrievousWounds',
	grievousWoundsPercent: 'lolcalcGrievousWoundsPercent',
	stun: 'lolcalcStun',
	slowFlat: 'lolcalcSlowFlat',
	slowPercent: 'lolcalcSlowPercent',
} as const;

export type IEffectObjectName = typeof EFFECT_OBJECT_NAME[keyof typeof EFFECT_OBJECT_NAME];

export const VariableType = {
	shield: 'shield',
	heal: 'heal',
	physical: 'physical',
	magic: 'magic',
	true: 'true',
} as const;

export type IVariableType = typeof VariableType[keyof typeof VariableType];

export const CHAMPION_LEVEL = {
	min: 1,
	max: 18,
	topQuestMax: 20,
};
