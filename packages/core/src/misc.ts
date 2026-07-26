import type { TAbilityType } from '@lolcalc/shared';
import type { ITexture } from '@lolcalc/shared/types.d.ts';
import type { IGameAbilityId } from './GameAbilityId';
import { CHAMPION_IMAGES, EFFECTS, imgUrl, textureBgImageAttrs, UI, useChampion } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';
import { CUSTOM_EFFECT_IMAGES, EFFECT_SPECIFICS } from './specifics/effect.ts';
import { replaceGameIcons } from './variables/game.ts';

export type IGameImageData = [src: string, width: number, height?: number] | ITexture;

export async function gameAbilityImage(abilityId: IGameAbilityId): Promise<IGameImageData> {
	const imageAbilityId = abilityId.type === AbilityType.effect
		? EFFECT_SPECIFICS[abilityId.id].sourceAbility
		: abilityId;

	if (!imageAbilityId) {
		console.warn('[gameAbilityId] failed to resolve imageAbilityId for', abilityId);
		return ['', 0];
	}

	if (imageAbilityId.type === AbilityType.item) {
		return [
			imgUrl(`img/item/${imageAbilityId.id}.png`, true),
			64,
		];
	} else if (imageAbilityId.type === AbilityType.effect) {
		const effectData = EFFECTS[imageAbilityId.id];
		if (effectData && 'image' in effectData) {
			return [
				imgUrl(`game/${effectData.image}`),
				64,
			];
		}
		if (!CUSTOM_EFFECT_IMAGES[imageAbilityId.id]) {
			console.warn('[gameAbilityImage] no effect image found for', imageAbilityId);
			return ['', 0];
		}
		return [
			imgUrl(CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![0]),
			CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![1],
		];
	} else if (imageAbilityId.type === AbilityType.dragon) {
		return UI.dragons[imageAbilityId.id][imageAbilityId.subtype === 'stack' ? 'stack' : 'soulActive'];
	}

	const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;

	const champion = await useChampion(imageAbilityId.id);

	return [
		abilityImage(champion.abilities[imageAbilityId.abilityKey].variants[imageAbilityId.abilityVariantIndex]!.image, imageAbilityId.id),
		abilityImageSize(imageAbilityId.id),
	];
}

export async function gameAbilityImgAttrs(abilityId: IGameAbilityId) {
	const img = await gameAbilityImage(abilityId);

	if (Array.isArray(img)) {
		return {
			src: img[0],
			width: img[1],
			height: img[2] ?? img[1],
		};
	} else {
		return img;
	}
}

/** used for creating a _game ability_ image string that will be parsed by `simpleDescriptionFormatting` */
export function simpleFormattingGameAbilityImage(type: TAbilityType, id: string) {
	return `%a:${type}-${id}%`;
}

export async function simpleDescriptionFormatting(text: string) {
	const parts = replaceGameIcons(
		text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>'),
	)
		.split(/(%a:[^-%]+-[^%]+%)/g);

	for (let i = 0; i < parts.length; i++) {
		const match = parts[i]!.match(/%a:([^-%]+)-([^%]+)%/);
		if (match) {
			const abilityImage = await gameAbilityImage({
				type: match[1],
				id: match[2],
			} as IGameAbilityId);
			parts[i] = Array.isArray(abilityImage)
				? `<img src="${abilityImage[0]}" width="${abilityImage[1]}" height="${abilityImage[2] ?? abilityImage[1]}">`
				: `<img ${Object.entries(textureBgImageAttrs(abilityImage, 16)).map(([attr, value]) => `${attr}="${typeof value === 'string' ? value : Object.entries(value).map(([vAttr, vValue]) => `${vAttr}: ${vValue}`).join('; ')}"`).join(' ')}>`;
		}
	}
	return parts.join('');
}
