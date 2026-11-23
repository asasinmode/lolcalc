/*
 * this file shouldn't import anything from specifics in order to avoid circular imports as it's used throughout them
 */
import { CHAMPION_IMAGES, CHAMPIONS, EFFECTS, ICON_ON_HIT_IMG, imgUrl, ITEMS, PATCH_VERSION, STAT_ICON, textureBgImageAttrs, UI, useChampion } from '@lolcalc/data';
import { ITEM_STAT_META } from '@lolcalc/data/meta.ts';
import type { IChampionId } from '@lolcalc/data/types.js';
import { AbilityType, CHAMPION_STAT_META, CUSTOM_EFFECT_IMAGES, ITEM_NAME_TO_ID, type TItemNameToId } from '@lolcalc/shared';
import type { ITexture } from '@lolcalc/shared/types.d.ts';
import type { ImgHTMLAttributes } from 'vue';
import type { IGameAbilityId } from './GameAbilityId';
import { GameAbilityId } from './GameAbilityId.ts';
import { EFFECTS_META } from './specifics/effectsMeta.ts';

const statIconNameValues = Object.values(STAT_ICON);

/**
 * images found in [assets/ux/fonts/texticons/lol/champion](https://raw.communitydragon.org/16.13/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/champion) that are also encountered in some champion ability descriptions without the extension like `%i:asolstackicon%` or `%i:kindredpassiveicon%`
 * list of champion icons or, when `[string, string]` also renames. For example locke's icon string is `LockeStackIcon` but file is `lockescalingicon`
 */
const championGameIcons: (string | [string, string])[] = ['asolstackicon', 'kindredpassiveicon', 'nasusstackicon', 'sennascalingicon', 'shyvana', 'smolder', 'threshscalingicon', ['lockestackicon', 'lockescalingicon']];

const STAT_ICON_VALUE_TO_STAT = Object.fromEntries(Object.entries(STAT_ICON).map(([key, value]) => [value, key])) as Record<string, any>;

export function gameIconAttrs(icon: (typeof STAT_ICON)[keyof typeof STAT_ICON], subpath?: string, addAlt = false): ImgHTMLAttributes {
	const key = Array.isArray(icon) ? icon[0] : icon.toLowerCase();

	let altSource;
	if (addAlt) {
		const stat = STAT_ICON_VALUE_TO_STAT[key];
		// @ts-expect-error accessing is chill
		altSource = stat && (CHAMPION_STAT_META[stat] ?? ITEM_STAT_META[stat]);
	}
	const attrs: ImgHTMLAttributes = altSource ? { alt: `icon representing ${altSource.name}` } : { 'aria-hidden': 'true' };

	if (Array.isArray(icon)) {
		const [src, width, height = width] = icon;
		return { src, width, height, ...attrs };
	}

	const championIconRename = championGameIcons.findLast((el) => el[0] === key);
	const isChampionIcon = championIconRename ?? championGameIcons.includes(key);
	const folder = statIconNameValues.includes(key) ? 'statsicon' : (subpath ?? (isChampionIcon ? 'champion' : 'gameplay'));

	return {
		src: `https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/${folder}/${championIconRename?.[1] ?? key}.png`,
		width: 20,
		height: 20,
		...attrs,
	};
}

export function replaceGameIcons(text: string, subpath?: string, addAlt = false): string {
	return text
		.replace(/%i:(\w+)%/g, (_, name: string) => {
			const attrs = gameIconAttrs(name, subpath, addAlt);
			return `<img src="${attrs.src}" width="20" height="20" ${'alt' in attrs ? `alt="${attrs.alt}"` : 'aria-hidden="true"'}>`;
		})
		.replace(/\{\{ ?Item_Keyword_OnHit ?\}\}/g, `${ICON_ON_HIT_IMG} <onhit>On-Hit</onhit>`);
}

export type IGameImageData = [src: string, width: number, height?: number, abilityName?: string] | (ITexture & { abilityName?: string });

/** @param imgIndex will be used for resolving champion ability image if it's an array */
export async function gameAbilityImage(abilityId: IGameAbilityId, imgIndex?: number): Promise<IGameImageData> {
	const imageAbilityId = abilityId.type === AbilityType.effect ? EFFECTS_META[abilityId.id].sourceAbility : abilityId;

	if (!imageAbilityId) {
		console.warn('[gameAbilityId] failed to resolve imageAbilityId for', abilityId);
		return ['', 0];
	}

	if (imageAbilityId.type === AbilityType.item) {
		return [imgUrl(`img/item/${imageAbilityId.id}.png`, true), 64, undefined, ITEMS[imageAbilityId.id]?.name];
	} else if (imageAbilityId.type === AbilityType.effect) {
		const effectData = EFFECTS[imageAbilityId.id];
		if (effectData && 'image' in effectData) {
			return [imgUrl(`game/${effectData.image}`), 64, undefined, EFFECTS_META[imageAbilityId.id].label];
		}
		if (!CUSTOM_EFFECT_IMAGES[imageAbilityId.id]) {
			console.warn('[gameAbilityImage] no effect image found for', imageAbilityId);
			return ['', 0];
		}
		return [imgUrl(CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![0]), CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![1], undefined, EFFECTS_META[imageAbilityId.id].label];
	} else if (imageAbilityId.type === AbilityType.dragon) {
		return {
			...UI.dragons[imageAbilityId.id][imageAbilityId.subtype === 'stack' ? 'stack' : 'soulActive'],
			abilityName: `${imageAbilityId.id} ${imageAbilityId.subtype}`,
		};
	}

	const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;

	const champion = await useChampion(imageAbilityId.id);
	const rawAbilityImage = champion.abilities[imageAbilityId.abilityKey].variants[imageAbilityId.abilityVariantIndex]!.image;

	return [
		abilityImage(typeof rawAbilityImage === 'string' ? rawAbilityImage : (rawAbilityImage[imgIndex === undefined ? 0 : imgIndex] ?? rawAbilityImage[0]!), imageAbilityId.id),
		abilityImageSize(imageAbilityId.id),
		undefined,
		champion.abilities[imageAbilityId.abilityKey].variants[imageAbilityId.abilityVariantIndex]!.name,
	];
}

/** used for creating a _game ability_ image string that will be parsed by `simpleDescriptionFormatting` */
export function simpleFormattingGameAbilityImage(abilityId: IGameAbilityId) {
	return `%a:${GameAbilityId.stringify(abilityId)}%`;
}

export function linkedFormattedItemImage(itemName: keyof TItemNameToId, name?: string) {
	const itemId = ITEM_NAME_TO_ID[itemName];
	const item = ITEMS[itemId]!;
	return `[${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, itemId))}${name ?? item?.name ?? '<unknown>unknown</unknown>'}](https://wiki.leagueoflegends.com/en-us/${item?.name.replaceAll(' ', '_')})`;
}

export function linkedFormattedChampionImage(championId: IChampionId, name?: string) {
	const champion = CHAMPIONS[championId];
	return `[%c:${championId}%${name ?? champion.name}](https://wiki.leagueoflegends.com/en-us/${champion.name.replaceAll(' ', '_')})`;
}

export async function simpleDescriptionFormatting(text: string, addAlt?: boolean, textureSize?: number): Promise<string> {
	const parts = replaceGameIcons(text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')).split(/(%[ac]:[^%]+%)/g);

	for (let i = 1; i < parts.length; i += 2) {
		const token = parts[i]!;

		let abilityImage: IGameImageData;

		if (token.startsWith('%a:')) {
			const match = token.match(/%a:(.+?)%/);
			if (!match) continue;

			const abilityId = GameAbilityId.parse(match[1] ?? '');
			if (!abilityId) {
				console.warn('[simpleDescriptionFormatting] failed to parse game ability id from', match[1]);
				continue;
			}
			abilityImage = await gameAbilityImage(abilityId);
		} else if (token.startsWith('%c:')) {
			const championId = token.match(/%c:(.+?)%/)?.[1] as IChampionId | undefined;
			const champion = championId && CHAMPIONS[championId];
			if (champion) {
				const src = CHAMPION_IMAGES.championImage(champion.image, championId);
				const size = CHAMPION_IMAGES.championImageSize(championId);
				abilityImage = [src, size, size, champion.name];
			} else {
				continue;
			}
		}

		parts[i] = formatImageHtml(abilityImage!, addAlt, textureSize);
	}

	return parts.join('');
}

function formatImageHtml(imageInfo: IGameImageData, addAlt?: boolean, textureSize = 20) {
	return `<img ${Object.entries(formatImageAttrs(imageInfo, addAlt, textureSize))
		.map(
			([attr, value]) =>
				`${attr}="${
					typeof value === 'object'
						? Object.entries(value)
								.map(([k, v]) => `${k}: ${v}`)
								.join('; ')
						: value
				}"`,
		)
		.join(' ')}>`;
}

export function formatImageAttrs(imageInfo: IGameImageData, addAlt = true, textureSize = 20): ImgHTMLAttributes {
	if (Array.isArray(imageInfo)) {
		const name = imageInfo[3] ?? 'unknown';
		return {
			src: imageInfo[0],
			width: imageInfo[1],
			height: imageInfo[2] ?? imageInfo[1],
			...(addAlt && { title: name, alt: `${name} icon` }),
		};
	}

	const name = imageInfo.abilityName ?? 'unknown';
	return Object.assign(textureBgImageAttrs(imageInfo, textureSize), addAlt ? { title: name, alt: `${name} icon` } : undefined);
}
