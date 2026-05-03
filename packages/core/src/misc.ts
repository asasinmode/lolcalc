import type { IGameAbilityId } from './GameAbilityId';
import { CHAMPION_IMAGES, PATCH_VERSION, useChampion } from '@lolcalc/data';
import { ABILITY_TYPE } from '@lolcalc/shared';
import { CUSTOM_EFFECT_IMAGES, EFFECT_SPECIFICS } from './specifics/effect.ts';

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
			imgUrl(`img/item/${imageAbilityId.id}.png`, PATCH_VERSION.semver, true),
			64,
		];
	} else if (imageAbilityId.type === ABILITY_TYPE.effect) {
		return CUSTOM_EFFECT_IMAGES[imageAbilityId.id]
			? [
					imgUrl(CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![0], PATCH_VERSION.minor),
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
