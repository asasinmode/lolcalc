export const ABILITY_TYPE = {
	champion: 'champion',
	item: 'item',
	effect: 'effect',
} as const;

export const ALL_ABILITY_TYPES = Object.values(ABILITY_TYPE);

export type TAbilityType = typeof ABILITY_TYPE[keyof typeof ABILITY_TYPE];

export const ALL_CHAMPION_ABILITY_KEYS: IChampionAbilityKey[] = ['passive', 'q', 'w', 'e', 'r'];

export const CHAMPION_STATS = ['hp', 'hpRegen', 'mana', 'manaRegen', 'healShieldPower', 'lethality', 'percentArmorPen', 'flatMagicPen', 'percentMagicPen', 'lifeSteal', 'omnivamp', 'attackRange', 'tenacity', 'attackDamage', 'abilityPower', 'armor', 'magicResist', 'attackSpeed', 'attackSpeedRatio', 'abilityHaste', 'critChance', 'critDamageMultiplier', 'moveSpeed', 'bonusAttackSpeedPercent'] as const;

export type IChampionStatName = (typeof CHAMPION_STATS)[number];

export const CHAMPION_STAT_NAMES: Record<IChampionStatName, string> = {
	hp: 'Health',
	mana: 'Mana',
	attackDamage: 'Attack Damage',
	abilityPower: 'Ability Power',
	armor: 'Armor',
	magicResist: 'Magic Resist',
	abilityHaste: 'Ability Haste',
	attackSpeed: 'Attack Speed',
	attackSpeedRatio: 'Attack Speed Ratio',
	bonusAttackSpeedPercent: 'Bonus Attack Speed',
	critChance: 'Critical Strike Chance',
	critDamageMultiplier: 'Critical Strike Damage',
	lethality: 'Lethality',
	percentArmorPen: 'Percentage Armor Penetration',
	flatMagicPen: 'Magic penetration',
	percentMagicPen: 'Percentage Magic Penetration',
	lifeSteal: 'Life Steal',
	omnivamp: 'Omnivamp',
	moveSpeed: 'Move Speed',
	tenacity: 'Tenacity',
	healShieldPower: 'Heal and Shield power',
	attackRange: 'Attack Range',
	hpRegen: 'Health every 5 seconds',
	manaRegen: 'Mana/Resource every 5 seconds',
};

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
	celestialOpposition: '3869',
	phage: '3044',
	ardentCensor: '3504',
	staffOfFlowingWater: '6616',
	bandlepipes: '2524',
	knightsVow: '3109',
	trailblazer: '3002',
	protoplasmHarness: '2525',
	frozenHeart: '3110',
	serpentsFang: '6695',
	rylaisScepter: '3116',
	fiendhunterBolts: '2512',
	abyssalMask: '8020',
	horizonFocus: '4628',
	opportunity: '6701',
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
} as const;

export type TItemNameToId = typeof ITEM_NAME_TO_ID;

export const KEPT_UNPURCHASABLE_ITEMS = [
	ITEM_NAME_TO_ID.diademOfSongs,
	ITEM_NAME_TO_ID.slightlyMagicalFootwear,
	ITEM_NAME_TO_ID.seraphsEmbrace,
	ITEM_NAME_TO_ID.muramana,
	ITEM_NAME_TO_ID.fimbulwinter,
];

export const RANGED_ONLY_ITEM_IDS = [ITEM_NAME_TO_ID.runaan];

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

/**
 * tags that appear in game descriptions, like item shop hover tooltip or champ select rune hover
 * they should have appropriate styles (like font color) set in `ItemDescription.vue`
 */
export const KNOWN_GAME_DESCRIPTION_TAGS = [
	'passive',	// heading
	'scalead', // bloodmail, sterak
	'scaleap',	// rabadon, riftmaker
	'scalehealth', // roa, heartsteel
	'scalemana',	// manamune, archangel
	'scalearmor',	// hullbreaker, terminus
	'scalemr',	// malignance, force of nature
	'scalelethality',	// opportunity
	'attackspeed',	// yuntal, experimental hexplate
	'onhit',	// iceborn, statik
	'physicaldamage',	// heartsteel, titanic
	'magicdamage',	// bami, thornmail
	'truedamage',	// cosmic drive, shadowflame
	'health',	// protoplasm harness, no styles
	'healing',	// guardian angel, warmog
	'shield',	// fimbulwinter, hexdrinker
	'lifesteal', // maw of malmortius
	'omnivamp',	// riftmaker
	'speed',	// opportunity, slightly magical footwear
	'gold',	// world atlas, collector
	'status',	// botrk, iceborn
	'attention',	// statikk, knight's vow
	'raritygeneric',	// world atlas
	'raritylegendary',	// archangel, manamune
	'rules',	// crimson lucidity
	'keyword',	// phantom dancer, zeke's convergence
	'keywordmajor',	// terminus
	'keywordstealth',	// horizon focus
	'slow',	// voltaic cyclosword, no styles
	'active', // seeker's armguard, mercurial scimitar
	'lol-uikit-tooltipped-keyword', // in many runes
	'scalelevel', // long first strike, guardian, shield bash
	'statgood', // long precision legends
	'font',
	'b',
	'i',
	'hr',
	'li',
	'titleleft', // dragon stack descriptions
	'maintext', // dragon stack descriptions
	'stattracking', // veigar passive, draven passive
];

export const ALL_ITEM_CATEGORIES = ['fighter', 'marksman', 'assassin', 'mage', 'tank', 'support'] as const;

export type IItemCategory = typeof ALL_ITEM_CATEGORIES[number];

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

export const EFFECT_OBJECT_NAME = {
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
	grievousWounds: 'lolcalcGrievousWounds',
	bloodletterVileDecay: '8010VisualDebuff',
	amumuPCursedTouch: 'AmumuPDebuff',
	jannaPTailwind: 'Tailwind',
} as const;

export type IEffectObjectName = typeof EFFECT_OBJECT_NAME[keyof typeof EFFECT_OBJECT_NAME];
