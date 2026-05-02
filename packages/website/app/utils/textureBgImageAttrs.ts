import type { ITexture } from '@lolcalc/shared/types';
import type { ImgHTMLAttributes } from 'vue';

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
