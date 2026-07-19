import type { TMiscData } from '@lolcalc/data';
import type { IChampionId, IItem } from '@lolcalc/data/types';
import type { IAdaptiveForceStatRv, IChampionStatName, IChampionStats, IMultiplicativeChampionStatName, IStatsCalculationMiscDebug, IStatsCalculationResult, IStatsCalculationVariables } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource';
import { MISC } from '@lolcalc/data';
import { ITEM_TO_CHAMPION_STATS, MULTIPLICATIVE_CHAMPION_STATS } from '@lolcalc/data/meta.ts';
import { addMultiplicative, calculateMSCapPenalty } from './util.ts';

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
		ultimateHaste: 0,
		basicHaste: 0,
		immobilizingHaste: 0,
	};

	const calculatedVariables: IStatsCalculationVariables = {
		apMultipliersBase: 0,
		baseItemManaRegenPercent: 0,
		totalItemApMultipliers: 1,
		totalBonusPercentMoveSpeed: 0,
		movespeedSoftCapPenalty: 0,
		midQuestMultiplier: source.roleQuest.value === 'mid' ? (MISC as TMiscData).roleQuests.mid.dataValues.BonusADAP : 0,
		bloodmailRetributionExcludedAd: 0,
		healShieldMult: 1,
		hpRegenMult: 1,
		lifeStealOmnivampMult: 1,
	};
	const miscDebug: IStatsCalculationMiscDebug = {};

	const baseStats = structuredClone(initialStats);
	const bonusStats = Object.fromEntries(Object.keys(baseStats).map(key => [key, 0])) as IChampionStats;
	const championPassiveStats: Partial<IChampionStats> = {};

	// atm only frozen heart and these are not automatically added to total, only used for tracking - frozen heart uses onTotalPreMultipliers and totalMultipliersStats
	const effectStats: Partial<IChampionStats> = {};

	if (source.calculateStatsHooks.all.value.postInit) {
		for (const hook of source.calculateStatsHooks.all.value.postInit) {
			hook(source, { baseStats, bonusStats, championPassiveStats }, { calculatedVariables, miscDebug });
		}
	}

	const isRanged: IStatsCalculationResult['isRanged'] = champion && ((baseStats.attackRange ?? 0) + (championPassiveStats.attackRange ?? 0) > 325);

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

	/** [statistics growth formula modifier](https://wiki.leagueoflegends.com/en-us/Champion_statistic#Growth_statistic_calculations) */
	const STAT_GFM = 0.7025 + 0.0175 * (level - 1);
	for (const stat in levelStats) {
		levelStats[stat as keyof typeof levelStats]! *= (level - 1) * STAT_GFM;
	}

	const baseOnLevelStats = Object.fromEntries(Object.entries(baseStats).map(
		([statName, statValue]) => [statName, statValue
		+ (levelStats[statName as keyof typeof levelStats] || 0)],
	)) as IChampionStats;

	const dragonStats: IStatsCalculationResult['dragon'] = {
		tenacity: 1,
		slowResist: 1,
	};
	const dragonStatMultipliers: IStatsCalculationResult['dragonStatMultipliers'] = {
		abilityPower: 0,
		attackDamage: 0,
		armor: 0,
		magicResist: 0,
	};

	const itemBaseStats = Object.fromEntries(Object.keys(baseStats).map(key => [key, 0])) as IChampionStats;
	for (const stat of MULTIPLICATIVE_CHAMPION_STATS) {
		itemBaseStats[stat] = 1;
	}

	for (const item of items.filter(Boolean)) {
		for (const [statName, statValue] of itemToChampionStats(item)) {
			if (MULTIPLICATIVE_CHAMPION_STATS.includes(statName)) {
				itemBaseStats[statName] = addMultiplicative(itemBaseStats[statName], statValue);
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
			calculatedVariables.baseItemManaRegenPercent += item!.stats.PercentBaseMPRegenMod;
		}
		if (item!.stats.PercentMovementSpeedMod) {
			calculatedVariables.totalBonusPercentMoveSpeed += item!.stats.PercentMovementSpeedMod;
		}
	}
	itemBaseStats.attackSpeed = itemBaseStats.bonusAttackSpeedPercent * baseStats.attackSpeedRatio;
	for (const stat of MULTIPLICATIVE_CHAMPION_STATS) {
		itemBaseStats[stat] = 1 - itemBaseStats[stat];
	}

	const itemStatIncreases: IStatsCalculationResult['itemStatIncreases'] = {};
	const itemPassivesStats = Object.fromEntries(Object.keys(baseStats).map(key => [key, 0])) as IChampionStats;
	for (const stat of MULTIPLICATIVE_CHAMPION_STATS) {
		itemPassivesStats[stat] = 1;
	}

	if (source.calculateStatsHooks.all.value.preItemTotal) {
		for (const hook of source.calculateStatsHooks.all.value.preItemTotal) {
			hook(source, { isRanged, itemBaseStats, itemPassivesStats, baseStats, baseOnLevelStats, itemStatIncreases, effectStats, dragonStatMultipliers, dragonStats }, { calculatedVariables, miscDebug });
		}
	}
	itemPassivesStats.attackSpeed = itemPassivesStats.bonusAttackSpeedPercent * baseStats.attackSpeedRatio;
	for (const stat of MULTIPLICATIVE_CHAMPION_STATS) {
		itemPassivesStats[stat] = 1 - itemPassivesStats[stat];
	}

	/* non multiplier dragon stacks are done preItemTotal so adjust those early calculated stats here */
	dragonStats.attackSpeed = (dragonStats.bonusAttackSpeedPercent ?? 0) * baseStats.attackSpeedRatio;
	dragonStats.tenacity = 1 - dragonStats.tenacity;
	dragonStats.slowResist = 1 - dragonStats.slowResist;

	const itemTotalStats = Object.fromEntries(Object.entries(itemBaseStats).map(([key, value]) => [
		key,
		MULTIPLICATIVE_CHAMPION_STATS.includes(key as IChampionStatName)
			? addMultiplicative(1, value, itemPassivesStats[key as IChampionStatName])
			: (value + itemPassivesStats[key as IChampionStatName]),
	]),
	) as IChampionStats;
	for (const stat of MULTIPLICATIVE_CHAMPION_STATS) {
		itemTotalStats[stat] = 1 - itemTotalStats[stat];
	}
	calculatedVariables.apMultipliersBase += itemTotalStats.abilityPower;

	const adaptiveForceMeta = getAdaptiveForceStat(champion?.id, itemTotalStats.attackDamage, itemTotalStats.abilityPower);

	const runeShardStats: IStatsCalculationResult['runeShards'] = {
		tenacity: 1,
		slowResist: 1,
	};
	if (source.calculateStatsHooks.all.value.onRuneShards) {
		for (const hook of source.calculateStatsHooks.all.value.onRuneShards) {
			hook(source, { isRanged, runeShardStats, baseStats, adaptiveForceMeta }, { calculatedVariables, miscDebug });
		}
	}
	runeShardStats.tenacity = 1 - runeShardStats.tenacity;
	runeShardStats.slowResist = 1 - runeShardStats.slowResist;
	calculatedVariables.apMultipliersBase += runeShardStats.abilityPower ?? 0;

	if (source.calculateStatsHooks.all.value.onChampionPassive) {
		for (const hook of source.calculateStatsHooks.all.value.onChampionPassive) {
			hook(source, { isRanged, championPassiveStats, baseStats }, { calculatedVariables, miscDebug });
		}
	}
	championPassiveStats.attackSpeed = (championPassiveStats.bonusAttackSpeedPercent ?? 0) * baseOnLevelStats.attackSpeedRatio;

	if (source.calculateStatsHooks.all.value.preBonus) {
		for (const hook of source.calculateStatsHooks.all.value.preBonus) {
			hook(source, { isRanged, runeShardStats, itemBaseStats, itemPassivesStats, itemTotalStats, baseOnLevelStats }, { calculatedVariables, miscDebug });
		}
	}

	/* attack speed from level counts towards bonus */
	bonusStats.bonusAttackSpeedPercent += baseOnLevelStats.bonusAttackSpeedPercent;
	for (const stat in bonusStats) {
		if (MULTIPLICATIVE_CHAMPION_STATS.includes(stat as IChampionStatName)) {
			bonusStats[stat as IMultiplicativeChampionStatName] = 1 - addMultiplicative(1, runeShardStats[stat as IMultiplicativeChampionStatName], dragonStats[stat as IMultiplicativeChampionStatName], itemTotalStats[stat as IMultiplicativeChampionStatName], championPassiveStats[stat as IMultiplicativeChampionStatName] ?? 0);
		} else {
			bonusStats[stat as IChampionStatName]! += (runeShardStats[stat as IChampionStatName] ?? 0)
				+ (dragonStats[stat as IChampionStatName] ?? 0)
				+ itemTotalStats[stat as IChampionStatName]
				+ (championPassiveStats[stat as IChampionStatName] ?? 0);
		}
	}

	const levelAndRunesStats = Object.fromEntries(Object.entries(baseOnLevelStats).map(
		([statName, statValue]) => [
			statName,
			statValue + (runeShardStats[statName as IChampionStatName] ?? 0),
		],
	)) as IChampionStats;
	levelAndRunesStats.tenacity = 1 - addMultiplicative(1, baseOnLevelStats.tenacity, runeShardStats.tenacity);

	const totalPreMultipliersStats = Object.fromEntries(Object.entries(levelAndRunesStats).map(
		([statName, statValue]) => [statName, statValue
		+ (championPassiveStats[statName as IChampionStatName] ?? 0)
		+ (dragonStats[statName as IChampionStatName] ?? 0)
		+ itemTotalStats[statName as IChampionStatName]],
	)) as IChampionStats;
	/* maybe should not be done like that but that's what it is at this point */
	totalPreMultipliersStats.tenacity = bonusStats.tenacity;
	totalPreMultipliersStats.slowResist = bonusStats.slowResist;

	const multiplierBonusMoveSpeed = totalPreMultipliersStats.moveSpeed * calculatedVariables.totalBonusPercentMoveSpeed;
	// TODO possibly could be done in posttotal but it kind of messes up swiftmarch adaptive force, figure it out when something messes up because of it
	totalPreMultipliersStats.moveSpeed += multiplierBonusMoveSpeed;
	const penalty = calculateMSCapPenalty(totalPreMultipliersStats.moveSpeed);
	calculatedVariables.movespeedSoftCapPenalty = penalty;
	totalPreMultipliersStats.moveSpeed -= penalty;
	bonusStats.moveSpeed += multiplierBonusMoveSpeed - penalty;

	const totalMultipliersStats = Object.fromEntries(Object.keys(totalPreMultipliersStats).map(key => [key, 0])) as IChampionStats;

	if (source.calculateStatsHooks.all.value.onTotalPreMultipliers) {
		for (const hook of source.calculateStatsHooks.all.value.onTotalPreMultipliers) {
			hook(source, { isRanged, totalPreMultipliersStats, totalMultipliersStats, bonusStats, effectStats, itemPassivesStats, itemTotalStats, championPassiveStats, baseStats, adaptiveForceMeta }, { calculatedVariables, miscDebug });
		}
	}

	dragonStats.abilityPower = calculatedVariables.apMultipliersBase * dragonStatMultipliers.abilityPower;
	totalMultipliersStats.abilityPower += dragonStats.abilityPower;
	dragonStats.armor = (totalPreMultipliersStats.armor + (calculatedVariables.jakShoArmor ?? 0)) * dragonStatMultipliers.armor;
	totalMultipliersStats.armor += dragonStats.armor;
	dragonStats.magicResist = (totalPreMultipliersStats.magicResist + (calculatedVariables.jakShoMagicResist ?? 0)) * dragonStatMultipliers.magicResist;
	totalMultipliersStats.magicResist += dragonStats.magicResist;

	for (const [statName, value] of Object.entries(totalMultipliersStats)) {
		bonusStats[statName as IChampionStatName] += value;
	}

	calculatedVariables.midQuestAp = calculatedVariables.apMultipliersBase * calculatedVariables.midQuestMultiplier;
	totalMultipliersStats.abilityPower += calculatedVariables.midQuestAp;
	bonusStats.abilityPower += calculatedVariables.midQuestAp;

	dragonStats.attackDamage = baseOnLevelStats.attackDamage * dragonStatMultipliers.attackDamage + bonusStats.attackDamage * dragonStatMultipliers.attackDamage;
	calculatedVariables.midQuestAd = bonusStats.attackDamage * (1 + dragonStatMultipliers.attackDamage) * calculatedVariables.midQuestMultiplier;

	const adMultipliersBonus = dragonStats.attackDamage + calculatedVariables.midQuestAd;
	bonusStats.attackDamage += adMultipliersBonus;
	totalMultipliersStats.attackDamage += adMultipliersBonus;

	const totalStats = Object.fromEntries(Object.entries(totalPreMultipliersStats).map(
		([statName, statValue]) => [statName, statValue + totalMultipliersStats[statName as IChampionStatName]],
	)) as IChampionStats;

	// TODO figure out if its ok to do it, also handle other non mana champions not gaining mana
	if (!source.hasMana.value) {
		totalStats.mana = baseStats.mana;
	}

	if (source.calculateStatsHooks.all.value.postTotal) {
		for (const hook of source.calculateStatsHooks.all.value.postTotal) {
			hook(source, { isRanged, totalStats, dragonStatMultipliers, totalMultipliersStats, bonusStats, itemPassivesStats, itemTotalStats, dragonStats, baseOnLevelStats, championPassiveStats, totalPreMultipliersStats }, { calculatedVariables, miscDebug });
		}
	}

	return {
		meta: {
			hasMana: !champion || champion.partype === 'mana',
			adaptiveForceStatVariable: adaptiveForceMeta[1],
		},
		isRanged,
		initial: initialStats,
		base: baseStats,
		level: levelStats,
		baseOnLevel: baseOnLevelStats,
		runeShards: runeShardStats,
		dragonStatMultipliers,
		itemBase: itemBaseStats,
		itemPassive: itemPassivesStats,
		itemTotal: itemTotalStats,
		itemStatIncreases,
		championPassive: championPassiveStats,
		effect: effectStats,
		totalPreMultipliers: totalPreMultipliersStats,
		dragon: dragonStats,
		totalMultipliers: totalMultipliersStats,
		bonus: bonusStats,
		total: totalStats,
		variables: calculatedVariables,
		miscDebug,
	};
}

function itemToChampionStats(item: IItem): [IChampionStatName, number][] {
	const rv = Object.entries(item.stats)
		.filter(([itemStatName]) => itemStatName in ITEM_TO_CHAMPION_STATS)
		.map(([itemStatName, itemStatValue]) => {
			return [
				ITEM_TO_CHAMPION_STATS[itemStatName as keyof typeof ITEM_TO_CHAMPION_STATS],
				itemStatValue,
			] as [IChampionStatName, number];
		});

	if (item.dataValues?.UltimateHaste) {
		rv.push(['ultimateHaste', item.dataValues.UltimateHaste]);
	}

	return rv;
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
