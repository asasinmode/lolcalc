import type { IGameImageData } from '@lolcalc/core/misc';
import { textureBgImageAttrs } from '@lolcalc/data';

/** textures don't support fluid vars but after doing responsive styles all texture images ended up constant size so maybe it's fine */
export function gameImageAttrs(data: IGameImageData, textureSize?: number) {
	return Array.isArray(data)
		? {
				src: data[0],
				width: data[1],
				height: data[2] ?? data[1],
			}
		: textureBgImageAttrs(data, textureSize);
}
