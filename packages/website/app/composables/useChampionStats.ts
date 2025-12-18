type IDisplayedStat = 'hp' | 'hpRegen' | 'mana' | 'manaRegen' | 'healShieldPower' | 'lethality' | 'percentArmorPen' | 'flatMagicPen' | 'percentMagicPen' | 'lifeSteal' | 'omnivamp' | 'attackRange' | 'tenacity' | 'attackDamage' | 'abilityPower' | 'armor' | 'magicResists' | 'attackSpeed' | 'attackSpeedRatio' | 'abilityHaste' | 'critChance' | 'critDamageMultiplier' | 'moveSpeed' | 'bonusAttackSpeedPercent';

export function useChampionStats(champion: IChampion, level: number, items: IItem[]) {
	const baseStats: Record<IDisplayedStat, number> = {
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

	/** [statistics growth formula modifier](https://wiki.leagueoflegends.com/en-us/Champion_statistic#Growth_statistic_calculations) */
	const STAT_GFM = 0.7025 + 0.0175 * (level - 1);

	const levelStats: Partial<Record<IDisplayedStat, number>> = {
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

	for (const stat in levelStats) {
		levelStats[stat as keyof typeof levelStats]! *= (level - 1) * STAT_GFM;
	}

	const baseWithLevelStats = Object.fromEntries(Object.entries(baseStats).map(
		([statName, statValue]) => [statName, statValue
		+ (levelStats[statName as keyof typeof levelStats] || 0)],
	)) as Record<IDisplayedStat, number>;

	const itemStats = Object.keys(baseStats).reduce((acc, statName) => ({
		...acc,
		[statName]: 0,
	}), {} as Record<IDisplayedStat, number>);

	// TODO move speed, %move speed, attack speed
	for (const item of items) {
		const stats = itemToChampionStats(item);
		for (const [statName, statValue] of stats) {
			// it's stored in per second in item but per 5 seconds in champion/displayed
			itemStats[statName] += statValue * (statName === 'hpRegen' ? 5 : 1);
		}

		if (item.stats.PercentBaseHPRegenMod) {
			itemStats.hpRegen += baseWithLevelStats.hpRegen * item.stats.PercentBaseHPRegenMod;
		}
		if (item.stats.PercentBaseMPRegenMod) {
			itemStats.manaRegen += baseWithLevelStats.manaRegen * item.stats.PercentBaseMPRegenMod;
		}
	}

	const totalStats = Object.fromEntries(Object.entries(baseWithLevelStats).map(
		([statName, statValue]) => [statName, statValue
		+ (itemStats[statName as keyof typeof itemStats] || 0)],
	));

	return {
		totalStats,
		itemStats,
		baseWithLevelStats,
		levelStats,
		baseStats,
		hasMana: champion.partype === 'mana',
	};
}

const ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES: Record<Exclude<
	IItemStat,
'PercentBaseHPRegenMod' | 'PercentBaseMPRegenMod' | 'PercentMovementSpeedMod'
>, IDisplayedStat> = {
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

function itemToChampionStats(item: IItem): [IDisplayedStat, number][] {
	return Object.entries(item.stats)
		.filter(([itemStatName]) => itemStatName in ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES)
		.map(([itemStatName, itemStatValue]) => {
			return [
				ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES[itemStatName as keyof typeof ITEM_STAT_NAMES_TO_DISPLAYED_STAT_NAMES],
				itemStatValue,
			];
		});
}
