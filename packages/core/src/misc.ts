import type { ITexture } from '@lolcalc/shared/types.d.ts';
import type { IGameAbilityId } from './GameAbilityId';
import { CHAMPION_IMAGES, EFFECTS, ICON_ON_HIT_IMG, imgUrl, ITEMS, PATCH_VERSION, STAT_ICON, textureBgImageAttrs, UI, useChampion } from '@lolcalc/data';
import { ITEM_STAT_META } from '@lolcalc/data/meta.ts';
import { AbilityType, CHAMPION_STAT_META, CUSTOM_EFFECT_IMAGES } from '@lolcalc/shared';
import { GameAbilityId } from './GameAbilityId.ts';
import { EFFECT_SPECIFICS } from './specifics/effect.ts';

const statIconNameValues = Object.values(STAT_ICON);

/** images found in [assets/ux/fonts/texticons/lol/champion](https://raw.communitydragon.org/16.13/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/champion) that are also encountered in some champion ability descriptions without the extension like `%i:asolstackicon%` or `%i:kindredpassiveicon%` */
const championGameIcons = [
	'asolstackicon',
	'kindredpassiveicon',
	'nasusstackicon',
	'sennascalingicon',
	'shyvana',
	'smolder',
	'threshscalingicon',
];

const STAT_ICON_VALUE_TO_STAT = Object.fromEntries(Object.entries(STAT_ICON).map(([key, value]) => [value, key])) as Record<string, any>;

/** singular `replaceGameIcons` */
export function gameIconImgAttrs(icon: typeof STAT_ICON[keyof typeof STAT_ICON], subpath?: string, isChampionIcon = false): { src: string; width: number; height: number } {
	return typeof icon === 'string'
		? {
				src: `https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/${statIconNameValues.includes(icon)
					? 'statsicon'
					: subpath ?? (isChampionIcon ? 'champion' : 'gameplay')
				}/${icon}.png`,
				width: 20,
				height: 20,
			}
		: {
				src: icon[0],
				width: icon[1],
				height: icon[2] ?? icon[1],
			};
}

export function replaceGameIcons(text: string, subpath?: string, addAlt = false): string {
	return text
		.replace(/%i:(\w+)%/g, (_, name: string) => {
			name = name.toLocaleLowerCase();
			const isChampionIcon = championGameIcons.includes(name);

			let altSource;
			if (addAlt) {
				const stat = STAT_ICON_VALUE_TO_STAT[name];
				// @ts-expect-error accessing is chill
				altSource = stat && (CHAMPION_STAT_META[stat] ?? ITEM_STAT_META[stat]);
			}

			return `<img src="https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/${statIconNameValues.includes(name)
				? 'statsicon'
				: subpath ?? (isChampionIcon ? 'champion' : 'gameplay')
			}/${name}.png" width="20" height="20" ${altSource ? `alt="icon representing ${altSource.name}"` : 'aria-hidden="true"'}>`;
		})
		.replace(/\{\{ ?Item_Keyword_OnHit ?\}\}/g, `${ICON_ON_HIT_IMG} <onhit>On-Hit</onhit>`);
}

export type IGameImageData = [src: string, width: number, height?: number, abilityName?: string] | (ITexture & { abilityName?: string });

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
			undefined,
			ITEMS[imageAbilityId.id]?.name,
		];
	} else if (imageAbilityId.type === AbilityType.effect) {
		const effectData = EFFECTS[imageAbilityId.id];
		if (effectData && 'image' in effectData) {
			return [
				imgUrl(`game/${effectData.image}`),
				64,
				undefined,
				EFFECT_SPECIFICS[imageAbilityId.id].label,
			];
		}
		if (!CUSTOM_EFFECT_IMAGES[imageAbilityId.id]) {
			console.warn('[gameAbilityImage] no effect image found for', imageAbilityId);
			return ['', 0];
		}
		return [
			imgUrl(CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![0]),
			CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![1],
			undefined,
			EFFECT_SPECIFICS[imageAbilityId.id].label,
		];
	} else if (imageAbilityId.type === AbilityType.dragon) {
		return { ...UI.dragons[imageAbilityId.id][imageAbilityId.subtype === 'stack' ? 'stack' : 'soulActive'], abilityName: `${imageAbilityId.id} ${imageAbilityId.subtype}` };
	}

	const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;

	const champion = await useChampion(imageAbilityId.id);

	return [
		abilityImage(champion.abilities[imageAbilityId.abilityKey].variants[imageAbilityId.abilityVariantIndex]!.image, imageAbilityId.id),
		abilityImageSize(imageAbilityId.id),
		undefined,
		champion.abilities[imageAbilityId.abilityKey].variants[imageAbilityId.abilityVariantIndex]!.name,
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
export function simpleFormattingGameAbilityImage(abilityId: IGameAbilityId) {
	return `%a:${GameAbilityId.stringify(abilityId)}%`;
}

export async function simpleDescriptionFormatting(text: string, addAlt?: boolean) {
	const parts = replaceGameIcons(
		text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>'),
	)
		.split(/(%a:[^-%]+-[^%]+%)/g);

	for (let i = 0; i < parts.length; i++) {
		const match = parts[i]!.match(/%a:(.+?)%/);
		if (match) {
			const abilityId = GameAbilityId.parse(match[1] ?? '');
			if (!abilityId) {
				console.warn('[simpleDescriptionFormatting] failed to parse game ability id from', match[1]);
				continue;
			}
			const abilityImage = await gameAbilityImage(abilityId);

			if (Array.isArray(abilityImage)) {
				parts[i] = `<img src="${abilityImage[0]}" width="${abilityImage[1]}" height="${abilityImage[2] ?? abilityImage[1]}"${addAlt ? ` alt="${abilityImage[3] ?? 'unknown'} icon"` : ''}>`;
			} else {
				parts[i] = `<img ${Object.entries(textureBgImageAttrs(abilityImage, 16)).map(([attr, value]) => `${attr}="${typeof value === 'string' ? value : Object.entries(value).map(([vAttr, vValue]) => `${vAttr}: ${vValue}`).join('; ')}"`).join(' ')}${addAlt ? ` alt="${abilityImage.abilityName ?? 'unknown'} icon"` : ''}>`;
			}
		}
	}
	return parts.join('');
}
