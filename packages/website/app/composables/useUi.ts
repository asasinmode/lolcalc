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

export const ITEM_STAT_ICON_NAMES: Record<IItemStat | 'adaptiveForce' | 'OnHit' | 'level' | 'range', string> = {
	OnHit: 'onhit',
	FlatPhysicalDamageMod: 'scalead',
	adaptiveForce: 'adaptiveforce',
	AbilityHasteMod: 'scaleah',
	FlatMagicDamageMod: 'scaleap',
	PhysicalLethality: 'scaleapen',
	PercentArmorPenetrationMod: 'scaleapen',
	FlatArmorMod: 'scalearmor',
	PercentAttackSpeedMod: 'scaleas',
	FlatCritChanceMod: 'scalecrit',
	FlatCritDamageMod: 'scalecritmult',
	PercentHealingAmountMod: 'scalehealshield',
	FlatHPPoolMod: 'scalehealth',
	FlatHPRegenMod: 'scalehpregen',
	PercentBaseHPRegenMod: 'scalehpregen',
	level: 'scalelevel',
	PercentLifeStealMod: 'scalels',
	FlatMPPoolMod: 'scalemana',
	PercentBaseMPRegenMod: 'scalemanaregen',
	FlatMagicPenetrationMod: 'scalempen',
	PercentMagicPenetrationMod: 'scalempen',
	FlatSpellBlockMod: 'scalemr',
	FlatMovementSpeedMod: 'scalems',
	PercentMovementSpeedMod: 'scalems',
	range: 'scalerange',
	PercentOmnivampMod: 'scalesv',
	PercentTenacityMod: 'scaletenacity',
};

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
