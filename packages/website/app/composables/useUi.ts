import { data } from '../assets/ui.json';

export function useUi() {
	return data satisfies IUiData;
}

export function textureBgImageAttrs({ resWidth, resHeight, spriteSheet, uv: [startX, startY, endX, endY] }: ITexture, targetSize?: string): {
	src: string;
	width: number;
	height: number;
	style: string;
	['data-sprite-image']: string;
} {
	const { minorVersion } = usePatchVersion();
	const width = endX! - startX!;
	const height = endY! - startY!;
	const src = `https://raw.communitydragon.org/${minorVersion}/game/${spriteSheet}`;
	return {
		src,
		'width': resWidth,
		'height': resHeight,
		'style': `background-image: url(${src}); background-size: ${resWidth}px ${resHeight}px; width: ${endX! - startX!}px; height: ${endY! - startY!}px; --txt-width: ${width}px; --txt-height: ${height}px; --txt-uv-start-x: -${startX}px; --txt-uv-start-y: -${startY}px; --target-size: var(${targetSize})`,
		'data-sprite-image': '',
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
	magicResists: {
		name: 'Magic reistance',
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
		name: 'Life Steal & omnivamp',
		filter: item => !!(item.stats.PercentLifeStealMod || item.stats.PercentOmnivampMod),
	},
} satisfies Record<string, { name: string; filter: (item: IItem) => boolean }>;

export type IItemShopStatFilter = keyof typeof ITEM_SHOP_STAT_FILTERS;

export interface ITexture {
	spriteSheet: string;
	resWidth: number;
	resHeight: number;
	uv: number[];
}

interface IUiData {
	shop: {
		categories: Record<IItemCategory | 'all', ITexture>;
		stats: Partial<Record<IItemShopStatFilter, { default: ITexture; selected: Pick<ITexture, 'uv'> }>>;
		clearFilters: ITexture;
		swapItemOrder: ITexture;
	};
}
