import type { TAbilityType } from '@lolcalc/shared';
import type { IGameAbilityId } from './GameAbilityId';
import { CHAMPION_IMAGES, PATCH_VERSION, useChampion } from '@lolcalc/data';
import { ABILITY_TYPE } from '@lolcalc/shared';
import { CUSTOM_EFFECT_IMAGES, EFFECT_SPECIFICS } from './specifics/effect.ts';
import { replaceGameIcons } from './variables/game.ts';

export async function gameAbilityImage(abilityId: IGameAbilityId): Promise<[src: string, size: number]> {
	const imageAbilityId = abilityId.type === ABILITY_TYPE.effect
		? EFFECT_SPECIFICS[abilityId.id].sourceAbility
		: abilityId;

	if (!imageAbilityId) {
		console.warn('[gameAbilityId] failed to resolve imageAbilityId for', abilityId);
		return ['', 0];
	}

	if (imageAbilityId.type === ABILITY_TYPE.item) {
		return [
			imgUrl(`img/item/${imageAbilityId.id}.png`, PATCH_VERSION.vSemver, true),
			64,
		];
	} else if (imageAbilityId.type === ABILITY_TYPE.effect) {
		return CUSTOM_EFFECT_IMAGES[imageAbilityId.id]
			? [
					imgUrl(CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![0], PATCH_VERSION.vMinor),
					CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![1],
				]
			: ['', 0];
	}

	const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;

	const champion = await useChampion(imageAbilityId.id);

	return [
		abilityImage(champion.abilities[imageAbilityId.abilityKey].variants[imageAbilityId.abilityVariantIndex]!.image, imageAbilityId.id),
		abilityImageSize(imageAbilityId.id),
	];
}

function imgUrl(url: string, version: string, isDDragon = false) {
	return url.startsWith('http')
		? url
		: isDDragon
			? `https://ddragon.leagueoflegends.com/cdn/${version}/${url}`
			: `https://raw.communitydragon.org/${version}/${url}`;
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
			const [src, size] = await gameAbilityImage({
				type: match[1],
				id: match[2],
			} as IGameAbilityId);
			parts[i] = `<img src="${src}" width="${size}" height="${size}">`;
		}
	}
	return parts.join('');
}
