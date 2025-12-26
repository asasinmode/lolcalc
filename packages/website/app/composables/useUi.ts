import { data } from '../assets/ui.json';

export function useUi() {
	return data satisfies IUiData;
}

export function textureBgImageAttrs({ resWidth, resHeight, uv: [startX, startY, endX, endY] }: ITexture, src: string): { src: string; width: number; height: number; style: string } {
	const width = endX! - startX!;
	const height = endY! - startY!;
	return {
		src,
		width: resWidth,
		height: resHeight,
		style: `background-image: url(${src}); background-size: ${resWidth}px ${resHeight}px; background-position: -${startX}px -${startY}px; width: ${endX! - startX!}px; height: ${endY! - startY!}px; --txt-width: ${width}px; --txt-height: ${height}px`,
	};
}

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
		name: 'On hit',
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
		name: 'Mana',
		filter: item => !!item.stats.FlatMPPoolMod,
	},
	magicPen: {
		name: 'Magic penetration',
		filter: item => !!(item.stats.FlatMagicPenetrationMod || item.stats.PercentMagicPenetrationMod),
	},
	health: {
		name: 'Health',
		filter: item => !!item.stats.FlatHPPoolMod,
	},
	armor: {
		name: 'Armor',
		filter: item => !!item.stats.FlatArmorMod,
	},
	magicResists: {
		name: 'Magic reists',
		filter: item => !!item.stats.FlatSpellBlockMod,
	},
	abilityHaste: {
		name: 'Ability haste',
		filter: item => !!item.stats.AbilityHasteMod,
	},
	movement: {
		name: 'Movement',
		// TODO check if tenacity counts
		filter: item => !!(item.stats.FlatMovementSpeedMod || item.stats.PercentMovementSpeedMod || item.stats.PercentTenacityMod),
	},
	vamp: {
		name: 'Lifesteal and omnivamp',
		filter: item => !!(item.stats.PercentLifeStealMod || item.stats.PercentOmnivampMod),
	},
} satisfies Record<string, { name: string; filter: (item: IItem) => boolean }>;

export type IItemShopStatFilter = keyof typeof ITEM_SHOP_STAT_FILTERS;

interface IUiData {
	shop: {
		categories: Record<IItemCategory | 'all', ITexture>;
		stats: Partial<Record<IItemShopStatFilter, ITexture>>;
		clearFilters: ITexture;
	};
}

export interface ITexture {
	spriteSheet: string;
	resWidth: number;
	resHeight: number;
	uv: number[];
}
