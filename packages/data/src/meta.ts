/* supposed to be stuff that requires TYPES based on the data but not the actual data */

import type { IChampionStatName } from '@lolcalc/shared';
import type { IChampionId, IItem, IItemStat } from './types';

export const SHAPESHIFTING_CHAMPION_IDS: IChampionId[] = ['Elise', 'Jayce', 'Nidalee'];

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

export const ITEM_SHOP_STAT_FILTERS: Record<string, { name: string; filter: (item: IItem) => boolean }> = {
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
};

export type IItemShopStatFilter = keyof typeof ITEM_SHOP_STAT_FILTERS;

/**
 * paths to the stat icons found in `plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${STAT_ICON}.png`
 * or full external ones if starting with `http`
 */
export const STAT_ICON: Record<
	IItemStat | IChampionStatName | 'adaptiveForce' | 'OnHit' | 'level' | 'attackRange' | 'cooldown',
	string | [url: string, size: number] | [url: string, width: number, height: number]
> = {
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
	slowResist: ['https://wiki.leagueoflegends.com/en-us/images/Slow_immune_icon.png', 65],
};
