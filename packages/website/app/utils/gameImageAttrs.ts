import type { IGameImageData } from '@lolcalc/core/misc';
import { textureBgImageAttrs } from '@lolcalc/data';

// TODO figure out dynamic textureSize. Additionally, 56 in places is because `var(--item-img-size)` is 3.5rem = 56
export function gameImageAttrs(data: IGameImageData, textureSize?: number) {
	return Array.isArray(data)
		? {
				src: data[0],
				width: data[1],
				height: data[2] ?? data[1],
			}
		: textureBgImageAttrs(data, textureSize);
}
