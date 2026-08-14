import type { DamageSource } from '@lolcalc/core/DamageSource';
import { isMasterworkSlot } from '@lolcalc/core/DamageSource';
import { CHAMPION_IMAGES, imgUrl, RUNES, TEXT } from '@lolcalc/data';

function DamageSourceThumbnail() {
	return h('div', {
		'class': 'damage-source-thumbnail',
		'inert': true,
		'aria-hidden': 'true',
	}, [
		h('span', h('img')),
		h('span'),
		h('div', [
			h('img', { class: 'primary-path-keystone' }),
			h('span', { class: 'secondary-path' }),
		]),
		h('ul', Array.from({ length: 7 }, (_, i) =>
			h('li', {
				key: i + 1,
				style: i === 6 ? 'display: none;' : undefined,
			}, h('img')))),
	]);
}

export function useDamageSourceThumbnail() {
	const { championImage, championImageSize } = CHAMPION_IMAGES;
	return {
		updateThumbnail(el: HTMLElement | null, damageSource: DamageSource) {
			if (!el) {
				return;
			}

			const [champImgContainer, lvlSpan, runeContainer, itemList] = el.children as unknown as [HTMLSpanElement, HTMLSpanElement, HTMLDivElement, HTMLUListElement];
			const champImg = champImgContainer.firstElementChild as HTMLImageElement;
			const [runePrimary, runeSecondary] = runeContainer.children as unknown as [HTMLImageElement, HTMLSpanElement];

			const champ = damageSource.listedChampion.value;
			if (champ) {
				champImg.src = championImage(champ.image, champ.id);
				const size = championImageSize(champ.id);
				champImg.width = size;
				champImg.height = size;
			} else {
				champImg.src = imgUrl('plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png');
				champImg.width = 256;
				champImg.height = 256;
			}

			lvlSpan.textContent = damageSource.level.value.toString();

			const { primary, primarySlots, secondary } = damageSource.runes.value.paths;
			if (primary && primarySlots[0]) {
				const { icon } = RUNES.paths[primary].slots[0]![primarySlots[0]]!;
				runePrimary.src = imgUrl(`/game/${icon}`);
				runePrimary.width = 256;
				runePrimary.height = 256;
			} else {
				runePrimary.src = imgUrl('plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png');
				runePrimary.width = 80;
				runePrimary.height = 80;
			}

			if (secondary) {
				const { iconColor } = RUNES.paths[secondary]!;
				const { name } = TEXT.runes.paths[secondary]!;
				runeSecondary.style.display = '';
				runeSecondary.style.backgroundColor = iconColor;
				runeSecondary.style.mask = `url(${imgUrl(`plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`)}) no-repeat center`;
			} else {
				runeSecondary.style.display = 'none';
			}

			for (let i = 0; i < 7; i++) {
				const li = itemList.children.item(i) as HTMLLIElement;
				const img = li.firstElementChild as HTMLImageElement;
				const item = damageSource.items.value[i];

				if (isMasterworkSlot(damageSource, i)) {
					li.classList.add('data-masterwork', '');
				} else {
					li.classList.remove('data-masterwork');
				}

				if (item) {
					img.src = imgUrl(`img/item/${item.image}`, true);
					img.style.display = '';
				} else {
					img.style.display = 'none';
				}
			}

			const lastLi = itemList.lastElementChild as HTMLLIElement;
			if (damageSource.roleQuest.value === 'bot') {
				lastLi.style.display = '';
				itemList.style.paddingInlineEnd = `calc(6 * var(--spacing))`;
			} else {
				lastLi.style.display = 'none';
				itemList.style.paddingInlineEnd = '';
			}
		},
		DamageSourceThumbnail,
	};
}
