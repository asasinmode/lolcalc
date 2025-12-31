import type { ImgHTMLAttributes } from 'vue';
import { data } from '../assets/ui.json';

export function useUi() {
	return data satisfies IUiData;
}

export function textureBgImageAttrs({ resWidth, resHeight, spriteSheet, uv: [startX, startY, endX, endY] }: ITexture, targetSize?: number): ImgHTMLAttributes & {
	['data-sprite-image']: string;
} {
	const { minorVersion } = usePatchVersion();
	const width = endX! - startX!;
	const height = endY! - startY!;
	const src = `https://raw.communitydragon.org/${minorVersion}/game/${spriteSheet}`;

	const largerDim = Math.max(width, height);
	const targetDim = targetSize || largerDim;
	const scale = targetDim / largerDim;

	return {
		src,
		'loading': 'lazy',
		'aria-hidden': true,
		'data-sprite-image': '',
		'style': {
			'background-image': `url(${src})`,
			'background-size': `calc(${resWidth}px * var(--txt-scale)) calc(${resHeight}px * var(--txt-scale))`,
			'object-position': `calc(${width}px * var(--txt-scale)) calc(${height}px * var(--txt-scale))`,
			'aspect-ratio': `${width} / ${height}`,
			'width': `${width * scale}px`,
			'--txt-scale': `${scale}`,
			'--txt-uv-start-x': `-${startX}px`,
			'--txt-uv-start-y': `-${startY}px`,
		},
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
		// TODO check if tenacity counts
		filter: item => !!(item.stats.FlatMovementSpeedMod || item.stats.PercentMovementSpeedMod || item.stats.PercentTenacityMod),
	},
	vamp: {
		name: 'Life Steal & omnivamp',
		filter: item => !!(item.stats.PercentLifeStealMod || (item.stats as Record<string, number>).PercentOmnivampMod),
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
		clearFilters: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
		};
		swapItemOrder: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
		};
		pin: {
			default: ITexture;
			hover: Pick<ITexture, 'uv'>;
			slcHover: Pick<ITexture, 'uv'>;
		};
	};
}
