type IDisplayedStat = 'hpRegen' | 'mpRegen' | 'healShieldPower' | 'lethality' | 'percentArmorPen' | 'flatMagicPen' | 'percentMagicPen' | 'lifeSteal' | 'omnivamp' | 'attackRange' | 'tenacity' | 'attackDamage' | 'abilityPower' | 'armor' | 'magicResists' | 'attackSpeed' | 'attackSpeedRatio' | 'abilityHaste' | 'critChance' | 'critDamageMultiplier' | 'moveSpeed' | 'health' | 'mana';

export function useChampionStats(champion: IChampion, level: number, items: IItem[]) {
	const baseStats: Record<IDisplayedStat, number> = {
		hpRegen: champion.stats.hpregen,
		mpRegen: champion.stats.mpregen,
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
		abilityHaste: 0,
		critChance: champion.stats.crit,
		critDamageMultiplier: 1.75,
		moveSpeed: champion.stats.movespeed,
		health: champion.stats.hp,
		mana: champion.stats.mp,
	};

	const levelStats = {
		hpRegen: champion.stats.hpregenperlevel,
		mpRegen: champion.stats.mpregenperlevel,
		attackDamage: champion.stats.attackdamageperlevel,
		armor: champion.stats.armorperlevel,
		magicResists: champion.stats.spellblockperlevel,
		attackSpeed: champion.stats.attackspeedperlevel,
		critChance: champion.stats.critperlevel,
		health: champion.stats.hpperlevel,
		mana: champion.stats.mpperlevel,
	} satisfies Partial<Record<IDisplayedStat, number>>;

	for (const stat in levelStats) {
		levelStats[stat as keyof typeof levelStats] *= level - 1;
	}

	const totalStats = Object.fromEntries(Object.entries(baseStats).map(
		([statName, statValue]) => [statName, statValue + (levelStats[statName as keyof typeof levelStats] || 0)],
	));

	return {
		totalStats,
		baseStats,
		levelStats,
		hasMana: champion.partype === 'mana',
	};
}
