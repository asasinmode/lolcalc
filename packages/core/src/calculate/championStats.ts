import type { IChampionId, IItem } from '@lolcalc/data/types';
import type { IAdaptiveForceStatRv, IChampionStatName, IChampionStats, IStatsCalculationMiscDebug, IStatsCalculationResult, IStatsCalculationVariables } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource';
import { ITEM_TO_CHAMPION_STATS } from '@lolcalc/data/meta.ts';

export function calculateChampionStats(source: DamageSource): IStatsCalculationResult {
	const level = source.level.value;
	const champion = source.champion.value;
	const items = source.items.value;

	const initialStats: IChampionStats = {
		hp: champion?.stats.hp ?? 0,
		hpRegen: champion?.stats.hpregen ?? 0,
		mana: champion?.stats.mp ?? 0,
		manaRegen: champion?.stats.mpregen ?? 0,
		healShieldPower: 0,
		lethality: 0,
		percentArmorPen: 0,
		flatMagicPen: 0,
		percentMagicPen: 0,
		lifeSteal: 0,
		omnivamp: 0,
		attackRange: champion?.stats.attackrange ?? 0,
		tenacity: 0,
		attackDamage: champion?.stats.attackdamage ?? 0,
		abilityPower: 0,
		armor: champion?.stats.armor ?? 0,
		magicResist: champion?.stats.spellblock ?? 0,
		attackSpeed: champion?.stats.attackspeed ?? 0,
		attackSpeedRatio: champion?.stats.attackspeedratio ?? 0,
		bonusAttackSpeedPercent: 0,
		abilityHaste: 0,
		critChance: champion?.stats.crit ?? 0,
		critDamageMultiplier: 2,
		moveSpeed: champion?.stats.movespeed ?? 0,
		slowResist: 0,
	};

	const calculatedVariables: IStatsCalculationVariables = {
		apMultipliersBase: 0,
	};
	const miscDebug: IStatsCalculationMiscDebug = {};

	const baseStats = structuredClone(initialStats);
	const bonusStats = Object.fromEntries(Object.keys(baseStats).map(key => [key, 0])) as IChampionStats;

	if (source.calculateStatsHooks.all.value.postInit) {
		for (const hook of source.calculateStatsHooks.all.value.postInit) {
			hook(source, { baseStats }, { calculatedVariables, miscDebug });
		}
	}

	const levelStats: Partial<IChampionStats> = {
		hp: champion?.stats.hpperlevel ?? 0,
		hpRegen: champion?.stats.hpregenperlevel ?? 0,
		mana: champion?.stats.mpperlevel ?? 0,
		manaRegen: champion?.stats.mpregenperlevel ?? 0,
		attackDamage: champion?.stats.attackdamageperlevel ?? 0,
		armor: champion?.stats.armorperlevel ?? 0,
		magicResist: champion?.stats.spellblockperlevel ?? 0,
		attackSpeed: (champion?.stats.attackspeedperlevel ?? 0) * 0.01 * initialStats.attackSpeedRatio,
		bonusAttackSpeedPercent: (champion?.stats.attackspeedperlevel ?? 0) / 100 + baseStats.bonusAttackSpeedPercent,
		critChance: champion?.stats.critperlevel ?? 0,
	};

	// TODO health/resource can calculate decimal because of this, make sure it works
	/** [statistics growth formula modifier](https://wiki.leagueoflegends.com/en-us/Champion_statistic#Growth_statistic_calculations) */
	const STAT_GFM = 0.7025 + 0.0175 * (level - 1);
	for (const stat in levelStats) {
		levelStats[stat as keyof typeof levelStats]! *= (level - 1) * STAT_GFM;
	}

	const baseOnLevelStats = Object.fromEntries(Object.entries(baseStats).map(
		([statName, statValue]) => [statName, statValue
		+ (levelStats[statName as keyof typeof levelStats] || 0)],
	)) as IChampionStats;

	const itemBaseStats = Object.fromEntries(Object.keys(baseStats).map(key => [key, 0])) as IChampionStats;
	itemBaseStats.tenacity = 1;

	let itemsTotalPercentMovementSpeed = 0;
	for (const item of items.filter(Boolean)) {
		for (const [statName, statValue] of itemToChampionStats(item)) {
			if (statName === 'tenacity') {
				/* item tenacity calculated according to [wiki formula](https://wiki.leagueoflegends.com/en-us/Tenacity#Stacking) */
				itemBaseStats.tenacity *= 1 - statValue;
			} else {
				/* hpRegen is stored in per second in item but per 5 seconds in champion/displayed */
				itemBaseStats[statName] += statValue * (statName === 'hpRegen' ? 5 : 1);
			}
		}

		if (item!.stats.PercentBaseHPRegenMod) {
			itemBaseStats.hpRegen += baseOnLevelStats.hpRegen * item!.stats.PercentBaseHPRegenMod;
		}
		if (item!.stats.PercentBaseMPRegenMod) {
			itemBaseStats.manaRegen += baseOnLevelStats.manaRegen * item!.stats.PercentBaseMPRegenMod;
		}
		if (item!.stats.PercentMovementSpeedMod) {
			itemsTotalPercentMovementSpeed += item!.stats.PercentMovementSpeedMod;
		}
	}
	itemBaseStats.tenacity = 1 - itemBaseStats.tenacity;

	const baseWithFlatItemMoveSpeed = (baseOnLevelStats.moveSpeed + itemBaseStats.moveSpeed);

	itemBaseStats.moveSpeed += baseWithFlatItemMoveSpeed * itemsTotalPercentMovementSpeed;
	itemBaseStats.attackSpeed = itemBaseStats.bonusAttackSpeedPercent * baseStats.attackSpeedRatio;

	const itemStatIncreases: IStatsCalculationResult['itemStatIncreases'] = {};
	const itemPassivesStats = Object.fromEntries(Object.keys(baseStats).map(key => [key, 0])) as IChampionStats;

	if (source.calculateStatsHooks.all.value.preItemTotal) {
		for (const hook of source.calculateStatsHooks.all.value.preItemTotal) {
			hook(source, { itemBaseStats, itemPassivesStats, baseStats, baseOnLevelStats, itemStatIncreases, baseWithFlatItemMoveSpeed }, { calculatedVariables, miscDebug });
		}
	}

	const itemTotalStats = Object.fromEntries(Object.entries(itemBaseStats).map(([key, value]) => [key, value + itemPassivesStats[key as IChampionStatName]])) as IChampionStats;
	calculatedVariables.apMultipliersBase += itemTotalStats.abilityPower;

	const adaptiveForceMeta = getAdaptiveForceStat(champion?.id, itemTotalStats.attackDamage, itemTotalStats.abilityPower);

	// TODO tenacity should be added using the same formula as items
	const runeShardStats: Partial<IChampionStats> = {};
	if (source.calculateStatsHooks.all.value.onRuneShards) {
		for (const hook of source.calculateStatsHooks.all.value.onRuneShards) {
			hook(source, { runeShardStats, baseStats, adaptiveForceMeta, baseWithFlatItemMoveSpeed }, { calculatedVariables, miscDebug });
		}
	}
	calculatedVariables.apMultipliersBase += runeShardStats.abilityPower ?? 0;

	const championPassiveStats: Partial<IChampionStats> = {};
	if (source.calculateStatsHooks.all.value.onChampionPassive) {
		for (const hook of source.calculateStatsHooks.all.value.onChampionPassive) {
			hook(source, { championPassiveStats, baseStats }, { calculatedVariables, miscDebug });
		}
	}

	if (source.calculateStatsHooks.all.value.preBonus) {
		for (const hook of source.calculateStatsHooks.all.value.preBonus) {
			hook(source, { runeShardStats, baseStats, itemBaseStats, itemPassivesStats, itemTotalStats, baseOnLevelStats, baseWithFlatItemMoveSpeed }, { calculatedVariables, miscDebug });
		}
	}

	/* attack speed from level counts towards bonus */
	bonusStats.bonusAttackSpeedPercent += baseOnLevelStats.bonusAttackSpeedPercent;
	for (const stat in bonusStats) {
		bonusStats[stat as IChampionStatName]! += (runeShardStats[stat as IChampionStatName] ?? 0)
			+ itemTotalStats[stat as IChampionStatName]
			+ (championPassiveStats[stat as IChampionStatName] ?? 0);
	}

	const levelAndRunesStats = Object.fromEntries(Object.entries(baseOnLevelStats).map(
		([statName, statValue]) => [
			statName,
			statValue + (runeShardStats[statName as IChampionStatName] ?? 0),
		],
	)) as IChampionStats;

	const totalStats = Object.fromEntries(Object.entries(levelAndRunesStats).map(
		([statName, statValue]) => [statName, statValue
		+ (championPassiveStats[statName as IChampionStatName] ?? 0)
		+ (itemTotalStats[statName as IChampionStatName] ?? 0)],
	)) as IChampionStats;

	const effectStats: Partial<IChampionStats> = {};

	if (source.calculateStatsHooks.all.value.postTotal) {
		for (const hook of source.calculateStatsHooks.all.value.postTotal) {
			hook(source, { totalStats, effectStats, bonusStats, itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug });
		}
	}

	for (const stat in effectStats) {
		totalStats[stat as IChampionStatName] += effectStats[stat as IChampionStatName]!;
	}

	// TODO figure out if its ok to do it
	if (champion && champion.partype !== 'Mana') {
		// TODO should be done by CHAMPION_SPECIFICS like `.postTotal()`
		totalStats.mana = champion.id === 'Viego' ? 0 : baseStats.mana ?? 0;
	}

	return {
		initial: initialStats,
		base: baseStats,
		level: levelStats,
		baseOnLevel: baseOnLevelStats,
		runeShards: runeShardStats,
		itemBase: itemBaseStats,
		itemPassive: itemPassivesStats,
		itemTotal: itemTotalStats,
		itemStatIncreases,
		championPassive: championPassiveStats,
		bonus: bonusStats,
		effect: effectStats,
		total: totalStats,
		meta: {
			hasMana: !champion || champion.partype === 'mana',
			adaptiveForceStatVariable: adaptiveForceMeta[1],
		},
		variables: calculatedVariables,
		miscDebug,
	};
}

function itemToChampionStats(item?: IItem): [IChampionStatName, number][] {
	return item
		? Object.entries(item.stats)
				.filter(([itemStatName]) => itemStatName in ITEM_TO_CHAMPION_STATS)
				.map(([itemStatName, itemStatValue]) => {
					return [
						ITEM_TO_CHAMPION_STATS[itemStatName as keyof typeof ITEM_TO_CHAMPION_STATS],
						itemStatValue,
					];
				})
		: [];
}

// TODO maybe a better way exists
const ADAPTIVE_FORCE_AD_BIAS_CHAMPIONS: IChampionId[] = ['Aatrox', 'Akshan', 'Ambessa', 'Aphelios', 'Ashe', 'Belveth', 'Blitzcrank', 'Braum', 'Briar', 'Caitlyn', 'Camille', 'Corki', 'Darius', 'Draven', 'DrMundo', 'Ezreal', 'Fiora', 'Gangplank', 'Garen', 'Gnar', 'Graves', 'Hecarim', 'Illaoi', 'Irelia', 'JarvanIV', 'Jax', 'Jayce', 'Jhin', 'Jinx', 'Kaisa', 'Kalista', 'Kayle', 'Kayn', 'Khazix', 'Kindred', 'Kled', 'KogMaw', 'KSante', 'LeeSin', 'Leona', 'Lucian', 'MasterYi', 'MissFortune', 'MonkeyKing', 'Naafiri', 'Nasus', 'Nilah', 'Nocturne', 'Olaf', 'Ornn', 'Pantheon', 'Poppy', 'Pyke', 'Qiyana', 'Quinn', 'Rammus', 'RekSai', 'Rell', 'Renekton', 'Rengar', 'Riven', 'Samira', 'Senna', 'Sett', 'Shaco', 'Shen', 'Shyvana', 'Sion', 'Sivir', 'Skarner', 'Smolder', 'TahmKench', 'Talon', 'Taric', 'Thresh', 'Tristana', 'Trundle', 'Tryndamere', 'Twitch', 'Udyr', 'Urgot', 'Varus', 'Vayne', 'Vi', 'Viego', 'Volibear', 'Warwick', 'Xayah', 'XinZhao', 'Yasuo', 'Yone', 'Yorick', 'Yunara', 'Zaahen', 'Zed', 'Zeri'];

function getAdaptiveForceStat(championId: string | undefined, attackDamage: number, abilityPower: number): IAdaptiveForceStatRv {
	const adRv: IAdaptiveForceStatRv = ['attackDamage', 0, 0.6];
	return attackDamage > abilityPower
		? adRv
		: (attackDamage === abilityPower && ADAPTIVE_FORCE_AD_BIAS_CHAMPIONS.includes(championId as IChampionId))
				? adRv
				: ['abilityPower', 1, 1];
}
