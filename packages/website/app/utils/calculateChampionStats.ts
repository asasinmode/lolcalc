import { data as runes } from '../assets/runes.json';

export function calculateChampionStats(champion: IChampion, level: number, items: IItem[], runes: IChampionRunes) {
	const baseStats: IChampionStats = {
		hp: champion.stats.hp,
		hpRegen: champion.stats.hpregen,
		mana: champion.stats.mp,
		manaRegen: champion.stats.mpregen,
		healShieldPower: 0,
		lethality: 0,
		percentArmorPen: 0,
		flatMagicPen: 0,
		percentMagicPen: 0,
		lifeSteal: 0,
		omnivamp: 0,
		attackRange: champion.stats.attackrange,
		tenacity: 0,
		attackDamage: champion.stats.attackdamage,
		abilityPower: 0,
		armor: champion.stats.armor,
		magicResist: champion.stats.spellblock,
		attackSpeed: champion.stats.attackspeed,
		attackSpeedRatio: champion.stats.attackspeedratio,
		/** in percentage points, same as in game when hovering over attack speed */
		bonusAttackSpeedPercent: 0,
		abilityHaste: 0,
		critChance: champion.stats.crit,
		critDamageMultiplier: 1.75,
		moveSpeed: champion.stats.movespeed,
	};

	const levelStats: Partial<IChampionStats> = {
		hp: champion.stats.hpperlevel,
		hpRegen: champion.stats.hpregenperlevel,
		mana: champion.stats.mpperlevel,
		manaRegen: champion.stats.mpregenperlevel,
		attackDamage: champion.stats.attackdamageperlevel,
		armor: champion.stats.armorperlevel,
		magicResist: champion.stats.spellblockperlevel,
		attackSpeed: champion.stats.attackspeedperlevel * 0.01 * champion.stats.attackspeedratio,
		bonusAttackSpeedPercent: champion.stats.attackspeedperlevel,
		critChance: champion.stats.critperlevel,
	};

	/** [statistics growth formula modifier](https://wiki.leagueoflegends.com/en-us/Champion_statistic#Growth_statistic_calculations) */
	const STAT_GFM = 0.7025 + 0.0175 * (level - 1);
	for (const stat in levelStats) {
		levelStats[stat as keyof typeof levelStats]! *= (level - 1) * STAT_GFM;
	}

	const baseOnLevelStats = Object.fromEntries(Object.entries(baseStats).map(
		([statName, statValue]) => [statName, statValue
		+ (levelStats[statName as keyof typeof levelStats] || 0)],
	)) as IChampionStats;

	const itemStats = Object.keys(baseStats).reduce((acc, statName) => ({
		...acc,
		[statName]: 0,
	}), {} as IChampionStats);

	let itemsTotalPercentMovementSpeed = 0;
	for (const item of items) {
		for (const [statName, statValue] of itemToChampionStats(item)) {
			// hpRegen is stored in per second in item but per 5 seconds in champion/displayed
			itemStats[statName] += statValue * (statName === 'hpRegen' ? 5 : 1);
		}

		if (item.stats.PercentBaseHPRegenMod) {
			itemStats.hpRegen += baseOnLevelStats.hpRegen * item.stats.PercentBaseHPRegenMod;
		}
		if (item.stats.PercentBaseMPRegenMod) {
			itemStats.manaRegen += baseOnLevelStats.manaRegen * item.stats.PercentBaseMPRegenMod;
		}
		if (item.stats.PercentMovementSpeedMod) {
			itemsTotalPercentMovementSpeed += item.stats.PercentMovementSpeedMod;
		}
	}

	const baseWithFlatFlatItemMoveSpeed = (baseOnLevelStats.moveSpeed + itemStats.moveSpeed);

	itemStats.moveSpeed += baseWithFlatFlatItemMoveSpeed * itemsTotalPercentMovementSpeed;
	itemStats.attackSpeed = itemStats.bonusAttackSpeedPercent * champion.stats.attackspeedratio;

	// TODO make sure it works
	const [adaptiveForceTargetStat, adaptiveForceStatMultiplier] = getAdaptiveForceStat(champion.id, itemStats.attackDamage, itemStats.abilityPower);

	const { adaptiveForce: runeShardsAdaptiveForce, ...preAdaptiveRuneShardStats } = getRuneShardStats(runes.shards, level);
	const runeShardStats: Partial<IChampionStats> = {
		...preAdaptiveRuneShardStats,
		moveSpeed: baseWithFlatFlatItemMoveSpeed * preAdaptiveRuneShardStats.percentMoveSpeedMod,
		attackSpeed: preAdaptiveRuneShardStats.bonusAttackSpeedPercent * champion.stats.attackspeedratio,
		[adaptiveForceTargetStat]: runeShardsAdaptiveForce * adaptiveForceStatMultiplier,
	};

	// to keep it consistent with the way it's displayed stored on `champion.stats.attackspeedperlevel`
	itemStats.bonusAttackSpeedPercent *= 100;
	runeShardStats.bonusAttackSpeedPercent! *= 100;

	const levelAndRunesStats = Object.fromEntries(Object.entries(baseOnLevelStats).map(
		([statName, statValue]) => [statName, statValue
		+ (runeShardStats[statName as keyof typeof runeShardStats] || 0)],
	)) as IChampionStats;

	const totalStats = Object.fromEntries(Object.entries(levelAndRunesStats).map(
		([statName, statValue]) => [statName, statValue
		+ (itemStats[statName as keyof typeof itemStats] || 0)],
	)) as IChampionStats;

	return {
		totalStats,
		itemStats,
		levelAndRunesStats,
		levelStats,
		baseStats,
		runeShardStats,
		hasMana: champion.partype === 'mana',
	};
}

const ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES: Record<Exclude<
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
};

function itemToChampionStats(item: IItem): [IChampionStatName, number][] {
	return Object.entries(item.stats)
		.filter(([itemStatName]) => itemStatName in ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES)
		.map(([itemStatName, itemStatValue]) => {
			return [
				ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES[itemStatName as keyof typeof ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES],
				itemStatValue,
			];
		});
}

// TODO maybe better way exists
const ADAPTIVE_FORCE_AD_BIAS_CHAMPIONS: IChampionId[] = ['Aatrox', 'Akshan', 'Ambessa', 'Aphelios', 'Ashe', 'Belveth', 'Blitzcrank', 'Braum', 'Briar', 'Caitlyn', 'Camille', 'Corki', 'Darius', 'Draven', 'DrMundo', 'Ezreal', 'Fiora', 'Gangplank', 'Garen', 'Gnar', 'Graves', 'Hecarim', 'Illaoi', 'Irelia', 'JarvanIV', 'Jax', 'Jayce', 'Jhin', 'Jinx', 'Kaisa', 'Kalista', 'Kayle', 'Kayn', 'Khazix', 'Kindred', 'Kled', 'KogMaw', 'KSante', 'LeeSin', 'Leona', 'Lucian', 'MasterYi', 'MissFortune', 'MonkeyKing', 'Naafiri', 'Nasus', 'Nilah', 'Nocturne', 'Olaf', 'Ornn', 'Pantheon', 'Poppy', 'Pyke', 'Qiyana', 'Quinn', 'Rammus', 'RekSai', 'Rell', 'Renekton', 'Rengar', 'Riven', 'Samira', 'Senna', 'Sett', 'Shaco', 'Shen', 'Shyvana', 'Sion', 'Sivir', 'Skarner', 'Smolder', 'TahmKench', 'Talon', 'Taric', 'Thresh', 'Tristana', 'Trundle', 'Tryndamere', 'Twitch', 'Udyr', 'Urgot', 'Varus', 'Vayne', 'Vi', 'Viego', 'Volibear', 'Warwick', 'Xayah', 'XinZhao', 'Yasuo', 'Yone', 'Yorick', 'Yunara', 'Zaahen', 'Zed', 'Zeri'];

type IAdaptiveForceStat = 'attackDamage' | 'abilityPower';
type IAdaptiveForceStatRv = [IAdaptiveForceStat, multiplier: number];

function getAdaptiveForceStat(championId: string, attackDamage: number, abilityPower: number): IAdaptiveForceStatRv {
	const adRv: IAdaptiveForceStatRv = ['attackDamage', 0.6];
	return attackDamage > abilityPower
		? adRv
		: (attackDamage === abilityPower && ADAPTIVE_FORCE_AD_BIAS_CHAMPIONS.includes(championId as IChampionId))
				? adRv
				: ['abilityPower', 1];
}

function getRuneShardStats(shards: IRuneShards, level: number) {
	const stats = {
		hp: 0,
		adaptiveForce: 0,
		abilityHaste: 0,
		bonusAttackSpeedPercent: 0,
		tenacity: 0,
		percentMoveSpeedMod: 0,
	} satisfies Partial<Record<IChampionStatName | 'adaptiveForce' | 'percentMoveSpeedMod', number>>;

	const adaptiveForceValue = runes.shards.offensive.adaptiveForce;
	const scalingHealthValue = level * runes.shards.defensive.scalingHealth;

	const slotStats: Record<keyof IRuneShards, Record<string, [keyof typeof stats, number]>> = {
		offensive: {
			adaptiveForce: ['adaptiveForce', adaptiveForceValue],
			percentAttackSpeed: ['bonusAttackSpeedPercent', runes.shards.offensive.percentAttackSpeed],
			abilityHaste: ['abilityHaste', runes.shards.offensive.abilityHaste],
		} satisfies Record<IRuneShards['offensive'], [keyof typeof stats, number]>,
		flex: {
			adaptiveForce: ['adaptiveForce', adaptiveForceValue],
			percentMoveSpeed: ['percentMoveSpeedMod', runes.shards.flex.percentMoveSpeed],
			scalingHealth: ['hp', scalingHealthValue],
		} satisfies Record<IRuneShards['flex'], [keyof typeof stats, number]>,
		defensive: {
			flatHealth: ['hp', runes.shards.defensive.flatHealth],
			percentTenacityMod: ['tenacity', runes.shards.defensive.percentTenacityMod],
			scalingHealth: ['hp', scalingHealthValue],
		} satisfies Record<IRuneShards['defensive'], [keyof typeof stats, number]>,
	};

	for (const [slotKey, slotValue] of Object.entries(shards)) {
		const [slotStat, slotStatValue] = slotStats[slotKey as keyof IRuneShards][slotValue]!;
		stats[slotStat] += slotStatValue;
	}

	return stats;
}

export type IChampionStats = Record<IChampionStatName, number>;

export type IChampionStatName = 'hp' | 'hpRegen' | 'mana' | 'manaRegen' | 'healShieldPower' | 'lethality' | 'percentArmorPen' | 'flatMagicPen' | 'percentMagicPen' | 'lifeSteal' | 'omnivamp' | 'attackRange' | 'tenacity' | 'attackDamage' | 'abilityPower' | 'armor' | 'magicResist' | 'attackSpeed' | 'attackSpeedRatio' | 'abilityHaste' | 'critChance' | 'critDamageMultiplier' | 'moveSpeed' | 'bonusAttackSpeedPercent';
