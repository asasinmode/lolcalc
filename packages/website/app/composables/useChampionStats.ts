type IDisplayedStatName = 'hp' | 'hpRegen' | 'mana' | 'manaRegen' | 'healShieldPower' | 'lethality' | 'percentArmorPen' | 'flatMagicPen' | 'percentMagicPen' | 'lifeSteal' | 'omnivamp' | 'attackRange' | 'tenacity' | 'attackDamage' | 'abilityPower' | 'armor' | 'magicResists' | 'attackSpeed' | 'attackSpeedRatio' | 'abilityHaste' | 'critChance' | 'critDamageMultiplier' | 'moveSpeed' | 'bonusAttackSpeedPercent';

type IDisplayedStats = Record<IDisplayedStatName, number>;

type IAdaptiveForceStat = 'attackDamage' | 'abilityPower';

export function useChampionStats(champion: IChampion, level: number, items: IItem[], runes: IRunes) {
	const baseStats: IDisplayedStats = {
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
		magicResists: champion.stats.spellblock,
		attackSpeed: champion.stats.attackspeed,
		attackSpeedRatio: champion.stats.attackspeedratio,
		/** in percentage points, same as in game when hovering over attack speed */
		bonusAttackSpeedPercent: 0,
		abilityHaste: 0,
		critChance: champion.stats.crit,
		critDamageMultiplier: 1.75,
		moveSpeed: champion.stats.movespeed,
	};

	const levelStats: Partial<IDisplayedStats> = {
		hp: champion.stats.hpperlevel,
		hpRegen: champion.stats.hpregenperlevel,
		mana: champion.stats.mpperlevel,
		manaRegen: champion.stats.mpregenperlevel,
		attackDamage: champion.stats.attackdamageperlevel,
		armor: champion.stats.armorperlevel,
		magicResists: champion.stats.spellblockperlevel,
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
	)) as IDisplayedStats;

	const itemStats = Object.keys(baseStats).reduce((acc, statName) => ({
		...acc,
		[statName]: 0,
	}), {} as IDisplayedStats);

	// TODO attack speed
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
			console.log('TODO');
		}
	}

	const [adaptiveForceTargetStat, adaptiveForceStatMultiplier] = getAdaptiveForceStat(itemStats.attackDamage, itemStats.abilityPower);

	const { adaptiveForce: runeShardsAdaptiveForce, ...preAdaptiveRuneShardStats } = getRuneShardStats(runes.shards, level);
	const runeShardStats = {
		...preAdaptiveRuneShardStats,
		[adaptiveForceTargetStat]: runeShardsAdaptiveForce * adaptiveForceStatMultiplier,
	};

	// TODO %move speed, attack speed
	const levelAndRunesStats = Object.fromEntries(Object.entries(baseStats).map(
		([statName, statValue]) => [statName, statValue
		+ (runeShardStats[statName as keyof typeof runeShardStats] || 0)],
	)) as IDisplayedStats;

	const totalStats = Object.fromEntries(Object.entries(levelAndRunesStats).map(
		([statName, statValue]) => [statName, statValue
		+ (itemStats[statName as keyof typeof itemStats] || 0)],
	));

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
>, IDisplayedStatName> = {
	AbilityHasteMod: 'abilityHaste',
	FlatArmorMod: 'armor',
	FlatCritChanceMod: 'critChance',
	FlatHPPoolMod: 'hp',
	FlatHPRegenMod: 'hpRegen',
	FlatMPPoolMod: 'mana',
	FlatMagicDamageMod: 'abilityPower',
	FlatMagicPenetrationMod: 'flatMagicPen',
	FlatMovementSpeedMod: 'moveSpeed',
	FlatPhysicalDamageMod: 'attackDamage',
	FlatSpellBlockMod: 'magicResists',
	PercentArmorPenetrationMod: 'percentArmorPen',
	PercentAttackSpeedMod: 'attackSpeed',
	PercentHealingAmountMod: 'healShieldPower',
	PercentLifeStealMod: 'lifeSteal',
	PercentMagicPenetrationMod: 'percentMagicPen',
	PercentTenacityMod: 'tenacity',
	PhysicalLethality: 'lethality',
};

function itemToChampionStats(item: IItem): [IDisplayedStatName, number][] {
	return Object.entries(item.stats)
		.filter(([itemStatName]) => itemStatName in ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES)
		.map(([itemStatName, itemStatValue]) => {
			return [
				ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES[itemStatName as keyof typeof ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES],
				itemStatValue,
			];
		});
}

function getAdaptiveForceStat(attackDamage: number, abilityPower: number): [IAdaptiveForceStat, multiplier: number] {
	return attackDamage > abilityPower ? ['attackDamage', 0.6] : ['abilityPower', 1];
}

function getRuneShardStats(shards: IRuneShards, level: number) {
	const stats = {
		hp: 0,
		adaptiveForce: 0,
		abilityHaste: 0,
		attackSpeed: 0,
		tenacity: 0,
		moveSpeedPercent: 0,
	} satisfies Partial<Record<IDisplayedStatName | 'adaptiveForce' | 'moveSpeedPercent', number>>;

	const scalingHealthValue = level * 10;

	const slotStats: Record<keyof IRuneShards, Record<string, [keyof typeof stats, number]>> = {
		slot1: {
			adaptive: ['adaptiveForce', 9],
			attackSpeed: ['attackSpeed', 0.1],
			abilityHaste: ['abilityHaste', 8],
		} satisfies Record<IRuneShards['slot1'], [keyof typeof stats, number]>,
		slot2: {
			adaptive: ['adaptiveForce', 9],
			moveSpeed: ['moveSpeedPercent', 0.025],
			scalingHealth: ['hp', scalingHealthValue],
		} satisfies Record<IRuneShards['slot2'], [keyof typeof stats, number]>,
		slot3: {
			instantHealth: ['hp', 65],
			tenacity: ['tenacity', 0.1],
			scalingHealth: ['hp', scalingHealthValue],
		} satisfies Record<IRuneShards['slot3'], [keyof typeof stats, number]>,
	};

	for (const [slotKey, slotValue] of Object.entries(shards)) {
		const [slotStat, slotStatValue] = slotStats[slotKey as keyof IRuneShards][slotValue]!;
		stats[slotStat] += slotStatValue;
	}

	return stats;
}
