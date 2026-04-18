<script setup lang="ts">
import type { IShopItem } from '~/utils/types';

const damageSource = defineModel<DamageSource>();

type IAllItemCategory = IItemCategory | 'all';

const { version, minorVersion } = usePatchVersion();
const items = useItems();
const maps = useMaps();
const ui = useUi();

const inventoryValue = computed(() => damageSource.value?.items.value.reduce((acc, item) => acc + (item?.gold.total ?? 0), 0) ?? 0);

const vDialog = useTemplateRef('vDialog');
const mapMask = ref<number>(maps.sr.mask);
const selectedCategory = ref<IAllItemCategory>('all');
const sortOrderSwapped = ref(false);
const appliedStatFilters = ref<Record<IItemShopStatFilter, boolean>>(Object.fromEntries(
	Object.entries(ITEM_SHOP_STAT_FILTERS).map(([name]) => [name, false]),
) as Record<IItemShopStatFilter, boolean>);

const ITEM_EPICNESS_LEGENDARY = 5;
const ITEM_EPICNESSES: [number, string][] = [
	[7, 'unique'],
	[1, 'starter'],
	[0, 'basic'],
	[4, 'epic'],
	[ITEM_EPICNESS_LEGENDARY, 'legendary'],
];

const BOOT_ITEM_IDS = [
	'1001', /* boots */
	'3047', /* plated steelcaps */
	'3111', /* mercury's treads */
	'3006', /* berserker's greaves */
	'3009',	/* boots of swiftness */
	'3020', /* sorcerer's shoes */
	'3158', /* ionian boots of lucidity */
];

const TRANSFORMED_TEAR_ITEM_IDS = [
	ITEM_NAME_TO_ID.diademOfSongs,
	ITEM_NAME_TO_ID.seraphsEmbrace,
	ITEM_NAME_TO_ID.muramana,
	ITEM_NAME_TO_ID.fimbulwinter,
] as string[];

const sortedByPriceForMap = computed(() => Object
	.values(items)
	.sort((a, b) => a.gold.total - b.gold.total)
	.filter(item => (item.mapMask & mapMask.value) !== 0));

const shopItems = computed<IShopItem[]>(() => sortedByPriceForMap.value.map((item) => {
	const discount = damageSource.value ? calculateItemDiscount(item.id, damageSource.value.items.value, items) : 0;
	const buyability = itemBuyability(item, damageSource.value, items);
	const isBought = damageSource.value?.items.value.some(inventoryItem => inventoryItem?.id === item.id);

	const statuses: string[] = [];
	if (isBought && item.epicness === ITEM_EPICNESS_LEGENDARY) {
		statuses.push('bought');
	}
	if (buyability === -1) {
		statuses.push('locked');
	} else if (buyability === 0) {
		statuses.push('unavailable');
	}

	return {
		item,
		buyability,
		isBought,
		srStatus: statuses.join(', '),
		calculatedPrice: item.gold.total - discount,
		isLegendary: item.epicness === ITEM_EPICNESS_LEGENDARY,
	};
}));
const shopItemsMap = computed(() => new Map<string, IShopItem>(Object.values(shopItems.value).map(v => [v.item.id, v])));
const filteredByCategory = computed(() =>
	selectedCategory.value === 'all'
		? shopItems.value.filter(({ item }) => !TRANSFORMED_TEAR_ITEM_IDS.includes(item.id))
		: shopItems.value.filter(({ item }) => !TRANSFORMED_TEAR_ITEM_IDS.includes(item.id) && item.categories?.[selectedCategory.value as IItemCategory]),
);
const filteredByStats = computed(() => {
	const filterFunctions = Object.entries(appliedStatFilters.value).filter(([, isEnabled]) => isEnabled).map(([filter]) => ITEM_SHOP_STAT_FILTERS[filter as IItemShopStatFilter].filter);

	return filterFunctions.length ? filteredByCategory.value.filter(({ item }) => filterFunctions.every(f => f(item))) : filteredByCategory.value;
});
const groupedByEpicness = computed(() => filteredByStats.value.reduce((acc, itemWithBuyability) => {
	const { epicness = 0 } = itemWithBuyability.item;

	if (itemWithBuyability.item.isBoots && epicness !== 7) {
		return acc;
	}

	if (acc[epicness]) {
		acc[epicness].push(itemWithBuyability);
		return acc;
	}

	return { ...acc, [epicness]: [itemWithBuyability] };
}, {} as Record<number, IShopItem[]>));

const availableStatFilters = computed(() => Object.fromEntries(
	Object.entries(ITEM_SHOP_STAT_FILTERS).map(([filter, { filter: filterFunction }]) => [
		filter,
		appliedStatFilters.value[filter as IItemShopStatFilter] || filteredByStats.value.some(({ item }) => filterFunction(item)),
	]),
) as Record<IItemShopStatFilter, boolean>);
const computedStatFilters = computed(() => Object.fromEntries(Object.entries(ITEM_SHOP_STAT_FILTERS).map(([filter, { name }]) => {
	const texture = ui.shop.stats[filter as IItemShopStatFilter].default;
	const [selectedUvStartX, selectedUvStartY] = ui.shop.stats[filter as IItemShopStatFilter].selected.uv;

	return [filter, {
		name,
		texture: textureBgImageAttrs(texture, 18),
		selectedUvStartX,
		selectedUvStartY,
	}];
})) as unknown as Record<IItemShopStatFilter, { name: string; texture: ReturnType<typeof textureBgImageAttrs>; selectedUvStartX: number; selectedUvStartY: number }>);

const computedEpicnesses = computed(() => (sortOrderSwapped.value
	? ITEM_EPICNESSES.toReversed()
	: ITEM_EPICNESSES).filter(([epicness]) => groupedByEpicness.value[epicness]?.length));

function clearStatFilters() {
	for (const key in ITEM_SHOP_STAT_FILTERS) {
		appliedStatFilters.value[key as IItemShopStatFilter] = false;
	}
}

const targetShopItems = computed<(IShopItem | undefined)[]>(() => Array.from(
	{ length: damageSource.value?.items.value.length ?? 0 },
	(_, i) => damageSource.value!.items.value[i] && shopItemsMap.value.get(damageSource.value!.items.value[i].id)!,
),
);

function undo() {
	if (damageSource.value) {
		damageSource.value.items.value = damageSource.value.itemsUndoSnapshots.value.pop()!;
	}
}

const selectedItemId = ref<string>();
const selectedItemInventoryIndex = ref<number>();
const displayedItemId = ref<string>();
const selectedItem = computed(() => selectedItemId.value ? shopItemsMap.value.get(selectedItemId.value) : undefined);
const displayedItem = computed(() => displayedItemId.value ? shopItemsMap.value.get(displayedItemId.value) : undefined);

function selectItem(item: IShopItem, overwriteDisplayed: boolean, inventoryIndex?: number) {
	selectedItemId.value = item.item.id;
	selectedItemInventoryIndex.value = inventoryIndex;
	if (overwriteDisplayed) {
		displayedItemId.value = item.item.id;
	}
}

function buyItem(item: IItem, buyability: IShopItem['buyability']) {
	if (damageSource.value && buyability === 1) {
		damageSource.value.addItem(item, items);
	}
}

function sellItem(event: MouseEvent, index: number) {
	event.preventDefault();
	if (selectedItemInventoryIndex.value === index) {
		selectedItemInventoryIndex.value = undefined;
	}
	damageSource.value?.removeItem(index);
	leaveTooltipableElement();
	if (damageSource.value?.items.value[index]) {
		enterTooltipableElement(event, shopItemsMap.value.get(damageSource.value.items.value[index].id)!);
	}
}

function rightClickItem(event: MouseEvent, item: IItem, buyability: IShopItem['buyability']) {
	event.preventDefault();
	!event.shiftKey && buyItem(item, buyability);
}

const displayedItemBuildsFrom = computed<IShopItem[] | undefined>(() =>
	displayedItem.value?.item.from?.map((secondLevelItemId) => {
		const secondLevelItem = shopItemsMap.value.get(secondLevelItemId)!;
		return {
			...secondLevelItem,
			from: (secondLevelItem.item.from || []).map(thirdLevelItemId => shopItemsMap.value.get(thirdLevelItemId)!),
		} satisfies IShopItem;
	}),
);

const search = ref('');
const searchInput = useTemplateRef('searchInput');
const searchResultsContainer = useTemplateRef('searchResultsContainer');
const searchItemDescription = useTemplateRef('searchItemDescription');
const searchExpanded = ref(false);
const searchCursoredOverIndex = ref<number>();
const searchSelectedIndex = ref<number>();

const searchResults = computed(() => {
	if (!search.value) {
		return [];
	}

	const splitSearch = search.value.toLocaleLowerCase().replaceAll(/[^a-z ]/g, '').split(' ').filter(v => v);
	return shopItems.value.filter(({ item }) =>
		item.id !== ITEM_NAME_TO_ID.slightlyMagicalFootwear
		&& !TRANSFORMED_TEAR_ITEM_IDS.includes(item.id)
		&& splitSearch.every(word => item.searchString.includes(word)),
	);
});

const searchCursoredOverItem = computed(() => searchCursoredOverIndex.value !== undefined ? searchResults.value[searchCursoredOverIndex.value] : undefined);

function closeSearch() {
	searchExpanded.value = false;
	clearSearch();
}

function clearSearch() {
	search.value = '';
	searchCursoredOverIndex.value = undefined;
	searchSelectedIndex.value = undefined;
}

function selectSearchResult(event: MouseEvent, index: number, isRightClick: boolean) {
	event.preventDefault();
	const shopItem = searchResults.value[index]!;
	if (isRightClick) {
		selectedItemId.value = shopItem.item.id;
		searchCursoredOverIndex.value = undefined;
		selectItem(shopItem, true);
		buyItem(shopItem.item, shopItem.buyability);
		closeSearch();
		leaveTooltipableElement();
		searchInput.value?.blur();
	} else {
		searchCursoredOverIndex.value = index;
		searchSelectedIndex.value = index;
		if (selectOrBuyIfDouble(shopItem, true)) {
			closeSearch();
			leaveTooltipableElement();
			searchInput.value?.blur();
		}
	}
}

function searchCursorOver(index?: number) {
	searchCursoredOverIndex.value = index;
}

function closeSearchIfOutside(event: FocusEvent) {
	const target = event.relatedTarget as HTMLElement | null;
	if (!target || (target === searchItemDescription.value?.header) || !searchResultsContainer.value?.contains(target)) {
		closeSearch();
	}
}

function onSearchKeydown(event: KeyboardEvent) {
	const resultsLength = searchResults.value.length;
	switch (event.key) {
		case 'Enter': {
			if (searchCursoredOverItem.value) {
				buyItem(searchCursoredOverItem.value.item, searchCursoredOverItem.value.buyability);
				closeSearch();
			} else {
				closeSearch();
			}
			break;
		}
		case 'Escape': {
			if (search.value) {
				search.value = '';
				searchCursoredOverIndex.value = undefined;
			} else {
				closeSearch();
			}
			break;
		}
		case 'Down':
		case 'ArrowDown': {
			searchExpanded.value = true;
			if (resultsLength) {
				searchCursoredOverIndex.value = (
					(searchCursoredOverIndex.value === undefined ? -1 : searchCursoredOverIndex.value) + 1
				) % resultsLength;
				document.getElementById(`item-shop-search-result-${searchCursoredOverIndex.value}`)?.scrollIntoView({ block: 'nearest' });
			}
			break;
		}
		case 'Up':
		case 'ArrowUp': {
			searchExpanded.value = true;
			if (resultsLength) {
				searchCursoredOverIndex.value = (
					(searchCursoredOverIndex.value === undefined ? (resultsLength + 1) : searchCursoredOverIndex.value) - 1 + resultsLength
				) % resultsLength;
				document.getElementById(`item-shop-search-result-${searchCursoredOverIndex.value}`)?.scrollIntoView({ block: 'nearest' });
			}
			break;
		}
		default: {
			searchExpanded.value = true;
			return;
		}
	}
	event.preventDefault();
}

function onSearchHeaderClick(event: MouseEvent, isRightClick: boolean) {
	event.preventDefault();
	if (isRightClick) {
		buyItem(searchCursoredOverItem.value!.item, searchCursoredOverItem.value!.buyability);
	} else {
		selectOrBuyIfDouble(searchCursoredOverItem.value!, true);
	}
}

let lastLeftClicked: [time: number, itemId: string] | undefined;

function selectOrBuyIfDouble(item: IShopItem, overwriteDisplayed: boolean): boolean {
	const now = Date.now();
	if (lastLeftClicked && item.item.id === lastLeftClicked[1] && ((now - lastLeftClicked[0]) < 500)) {
		buyItem(item.item, item.buyability);
		lastLeftClicked = undefined;
		return true;
	}

	lastLeftClicked = [now, item.item.id];
	selectItem(item, overwriteDisplayed);
	return false;
}

const { addItemTooltipViewListeners, removeItemTooltipViewListeners } = useItemHoverTooltipView('Shop');
let itemTooltipAnchor: undefined | HTMLElement;
const itemTooltip = useTemplateRef('itemTooltip');
const hoveredItem = shallowRef<IShopItem>();

function enterTooltipableElement(eventLike: { target: HTMLElement } | MouseEvent, item: IShopItem) {
	const { target } = eventLike as { target: HTMLElement };
	itemTooltip.value?.showPopover();
	itemTooltipAnchor = target;
	itemTooltipAnchor?.addEventListener('mouseleave', leaveTooltipableElement, { passive: true, once: true });
	itemTooltipAnchor?.addEventListener('mousemove', updateTooltipPosition, { passive: true });
	addItemTooltipViewListeners();
	hoveredItem.value = item;
	'clientX' in eventLike && updateTooltipPosition(eventLike);
}

function leaveTooltipableElement() {
	itemTooltip.value?.hidePopover();
	itemTooltipAnchor?.removeEventListener('mousemove', updateTooltipPosition);
	removeItemTooltipViewListeners();
	itemTooltipAnchor = undefined;
}

function updateTooltipPosition(event: MouseEvent) {
	const { clientX, clientY } = event;
	itemTooltip.value!.style.setProperty('--left', `${clientX + 10}px`);
	itemTooltip.value!.style.setProperty('--top', `${clientY + 10}px`);
	itemTooltip.value!.style.setProperty('--height', `${itemTooltip.value!.clientHeight}px`);
}

const buildsIntoMoreList = useTemplateRef('buildsIntoMoreList');

const buildsIntoItems = computed(() => selectedItem.value?.item.into
	?.filter(id => (items[id]!.mapMask & mapMask.value) !== 0 && !TRANSFORMED_TEAR_ITEM_IDS.includes(id))
	.map(id => shopItemsMap.value.get(id)!)
	.sort((a, b) => a.item.gold.total - b.item.gold.total) || []);

function closeBuildsIntoMoreListIfOutside(event: FocusEvent) {
	const target = event.relatedTarget as HTMLElement | null;
	if (!target || !buildsIntoMoreList.value?.contains(target)) {
		buildsIntoMoreList.value?.hidePopover();
	}
}

function selectBuildsIntoMoreItem(item: IShopItem) {
	selectItem(item, true);
	leaveTooltipableElement();
	buildsIntoMoreList.value?.hidePopover();
}

const displayedItemBuildPath2ndLevelItemCount = computed(() => displayedItem.value?.item.from?.length || 0);
const displayedItemBuildPath3rdLevelHasTwo3Items = computed(() => {
	let has3Components = false;
	for (const itemId of displayedItem.value?.item.from || []) {
		const currentHas3Components = (items[itemId]?.from?.length || 0) >= 3;
		if (has3Components && currentHas3Components) {
			return true;
		}
		has3Components ||= currentHas3Components;
	}

	return false;
});

const bootItems = computed<IShopItem[]>(() => BOOT_ITEM_IDS.map((id) => {
	const item = shopItemsMap.value.get(id);
	if (!item) {
		console.warn(`boot item not found ${id}`);
	}
	return item!;
}));

const bootsPanelPinned = ref(false);
const inventoryPanelPinned = ref(true);

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog
		id="dialog-item-shop"
		ref="vDialog"
		:style="`--lock-icon-url: url(https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champion-details/global/default/mastery/lock-icon-closed.svg)`"
		@close="closeSearch"
	>
		<header>
			<h1>
				all items
			</h1>
			<form method="dialog">
				<button value="cancel" title="close" autofocus>
					<Icon class="i-ph:x-bold" />
					<span>
						close
					</span>
				</button>
			</form>
			<div class="inline-search-label" @focusout="closeSearchIfOutside">
				<input
					id="item-shop-search"
					ref="searchInput"
					v-model="search"
					type="text"
					role="combobox"
					autocomplete="list"
					:aria-expanded="searchExpanded"
					aria-controls="item-shop-search-listbox"
					:aria-activedescendant="searchCursoredOverIndex !== undefined ? `item-shop-search-result-${searchCursoredOverIndex}` : undefined"
					:data-empty="!search"
					@focus="searchExpanded = true"
					@update:model-value="searchCursorOver(searchResults.length ? 0 : undefined)"
					@keydown="onSearchKeydown"
				>
				<label id="item-shop-search-lbl" for="item-shop-search">
					<Icon class="i-ph:magnifying-glass-bold" />
					Click Here to Search
				</label>
				<button title="clear" @mousedown.prevent="clearSearch">
					<span>
						clear
					</span>
					<Icon class="i-ph:x-bold" />
				</button>
				<div
					v-show="searchExpanded"
					ref="searchResultsContainer"
					@mousedown.prevent=""
				>
					<p id="item-shop-results-lbl">
						Results
					</p>
					<ul
						id="item-shop-search-listbox"
						role="listbox"
						aria-labelledby="item-shop-results-lbl"
					>
						<li
							v-for="(shopItem, index) in searchResults"
							:id="`item-shop-search-result-${index}`"
							:key="shopItem.item.id"
							role="option"
							:data-buyability="shopItem.buyability"
							:data-bought="shopItem.isBought ? '' : undefined"
							:data-legendary="shopItem.isLegendary ? '' : undefined"
							:class="{
								selected: searchSelectedIndex === index || (searchCursoredOverIndex !== undefined ? searchCursoredOverIndex === index : false),
							}"
							@mouseenter="enterTooltipableElement($event, shopItem)"
							@click="selectSearchResult($event, index, false)"
							@click.right="selectSearchResult($event, index, true)"
						>
							<img
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem.item.image}`"
								width="64"
								height="64"
								class="item-shop-item-img"
								aria-hidden="true"
								loading="lazy"
							>
							<span>{{ shopItem.item.name }}</span>
							<span class="sr-status">{{ shopItem.srStatus }}</span>
							<span>{{ shopItem.isBought && shopItem.buyability === -1 ? '' : shopItem.calculatedPrice }}</span>
						</li>
					</ul>
					<section aria-live="polite" aria-atomic="true">
						<LolItemDescription
							ref="searchItemDescription"
							:item="searchCursoredOverItem?.item"
							:gold="searchCursoredOverItem?.calculatedPrice"
							:damage-source="damageSource"
							header-tag="button"
							source="Shop"
							@header-click="onSearchHeaderClick"
						/>
					</section>
				</div>
			</div>
			<VButtonRadiogroup
				id="item-shop-category-filter"
				v-model="selectedCategory"
				label="Category"
				:options="['all', ...ALL_ITEM_CATEGORIES].map((category) => ({ category: category as IAllItemCategory, texture: ui.shop.categories[category as IAllItemCategory] }))"
				value-key="category"
				required
			>
				<template #default="{ option: { category, texture } }">
					<img v-bind="textureBgImageAttrs(texture, 24)">
					<span class="sr-only">{{ category }}</span>
				</template>
			</VButtonRadiogroup>
			<!-- <VButtonRadiogroup -->
			<!-- 	id="item-shop-map-filter" -->
			<!-- 	v-model="mapMask" -->
			<!-- 	:options="Object.values(maps)" -->
			<!-- 	value-key="mask" -->
			<!-- 	title-key="name" -->
			<!-- 	label="Map" -->
			<!-- 	required -->
			<!-- > -->
			<!-- 	<template #default="{ option, isSelected }"> -->
			<!-- 		<img -->
			<!-- 			:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets/${option.iconDirUrl}/img/${isSelected ? 'game-select-icon-active' : 'icon-empty'}.png`" -->
			<!-- 			:width="isSelected ? 100 : 200" -->
			<!-- 			:height="isSelected ? 100 : 200" -->
			<!-- 			aria-hidden="true" -->
			<!-- 			class="size-5" -->
			<!-- 		> -->
			<!-- 		<span class="sr-only">{{ option.name }}</span> -->
			<!-- 	</template> -->
			<!-- </VButtonRadiogroup> -->
			<button id="item-shop-swap-sort-order" title="Swap item order" @click="sortOrderSwapped = !sortOrderSwapped">
				<span>Swap item order</span>
				<img
					v-bind="textureBgImageAttrs(ui.shop.swapItemOrder.default, 32)"
					:style="`--txt-hover-uv-start-x: -${ui.shop.swapItemOrder.hover.uv[0]}px; --txt-hover-uv-start-y: -${ui.shop.swapItemOrder.hover.uv[1]}px`"
				>
			</button>
		</header>
		<aside>
			<button id="item-shop-clear-stat-filters" title="Clear stat filters" @click="clearStatFilters">
				<span>Clear stat filters</span>
				<img
					v-bind="textureBgImageAttrs(ui.shop.clearFilters.default, 28)"
					:style="`--txt-hover-uv-start-x: -${ui.shop.clearFilters.hover.uv[0]}px; --txt-hover-uv-start-y: -${ui.shop.clearFilters.hover.uv[1]}px`"
				>
			</button>
			<fieldset id="item-shop-stat-filters">
				<legend>
					Stat filters
				</legend>
				<template v-for="({ name, texture, selectedUvStartX, selectedUvStartY }, filter, i) in computedStatFilters" :key="filter">
					<input :id="`item-shop-stat-${filter}`" v-model="appliedStatFilters[filter]" type="checkbox" :disabled="!availableStatFilters[filter]">
					<label :for="`item-shop-stat-${filter}`" :title="name">
						<span>{{ name }}</span>
						<img
							v-bind="texture"
							:style="`--txt-selected-uv-start-x: -${selectedUvStartX}px; --txt-selected-uv-start-y: -${selectedUvStartY}px`"
						>
					</label>
					<hr v-if="i === 4 || i === 7 || i === 10">
				</template>
			</fieldset>
		</aside>
		<section id="item-shop-panel-boots" :data-pinned="bootsPanelPinned || undefined">
			<h2>boots</h2>
			<button
				class="pin-button"
				@click="bootsPanelPinned = !bootsPanelPinned"
			>
				<span>Pin boots panel</span>
				<img
					v-bind="textureBgImageAttrs(ui.shop.pin.default, 28)"
					:style="`--txt-hover-uv-start-x: -${ui.shop.pin.hover.uv[0]}px; --txt-hover-uv-start-y: -${ui.shop.pin.hover.uv[1]}px; --txt-slcHover-uv-start-x: -${ui.shop.pin.slcHover.uv[0]}px; --txt-slcHover-uv-start-y: -${ui.shop.pin.slcHover.uv[1]}px`"
				>
			</button>
			<Icon class="i-ph:caret-left-bold caret" />
			<div>
				<ul>
					<li v-for="shopItem in bootItems" :key="shopItem.item.id">
						<button
							class="item-shop-item-btn"
							:class="{ selected: selectedItem?.item.id === shopItem.item.id }"
							:data-buyability="shopItem.buyability"
							:data-bought="shopItem.isBought ? '' : undefined"
							@mouseenter="enterTooltipableElement($event, shopItem)"
							@click="selectOrBuyIfDouble(shopItem, true)"
							@click.right="rightClickItem($event, shopItem.item, shopItem.buyability)"
						>
							<span>{{ shopItem.item.name }}</span>
							<img
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem.item.image}`"
								:alt="shopItem.item.name"
								width="64"
								height="64"
								aria-hidden="true"
								loading="lazy"
							>
							<span class="sr-status">{{ shopItem.srStatus }}</span>
							<span>{{ shopItem.calculatedPrice }}</span>
						</button>
					</li>
				</ul>
			</div>
		</section>
		<section style="grid-area: items;" class="px-3 py-2 overflow-y-auto">
			<h2 class="sr-only" aria-live="polite">
				{{ selectedCategory }} items
			</h2>
			<template
				v-for="[epicness, epicnessName] in computedEpicnesses"
				:key="epicness"
			>
				<h3 class="font-700 mb-1 uppercase">
					{{ epicnessName }}
				</h3>
				<ul class="mb-5 gap-3 grid grid-cols-10 last:mb-0">
					<li v-for="shopItem in groupedByEpicness[epicness]" :key="shopItem.item.id">
						<button
							class="item-shop-item-btn"
							:class="{ selected: selectedItem?.item.id === shopItem.item.id }"
							:data-buyability="shopItem.buyability"
							:data-bought="shopItem.isBought ? '' : undefined"
							:data-legendary="shopItem.isLegendary ? '' : undefined"
							@mouseenter="enterTooltipableElement($event, shopItem)"
							@click="selectOrBuyIfDouble(shopItem, true)"
							@click.right="rightClickItem($event, shopItem.item, shopItem.buyability)"
							@keydown.space="selectItem(shopItem, true)"
							@keydown.enter="buyItem(shopItem.item, shopItem.buyability)"
						>
							<span>{{ shopItem.item.name }}</span>
							<img
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem.item.image}`"
								width="64"
								height="64"
								aria-hidden="true"
								loading="lazy"
							>
							<span class="sr-status">{{ shopItem.srStatus }}</span>
							<span>{{ shopItem.calculatedPrice }}</span>
						</button>
					</li>
				</ul>
			</template>
		</section>
		<section>
			<LolItemDescription
				:item="selectedItem?.item"
				:gold="selectedItem?.calculatedPrice"
				:damage-source="damageSource"
				header-class="order-5"
				header-tag="h2"
				description-class="order-6"
				source="Shop"
			/>
			<button
				:disabled="selectedItem?.buyability !== 1"
				@click="buyItem(selectedItem!.item, selectedItem!.buyability)"
			>
				{{ !selectedItem ? 'purchase' : selectedItem?.buyability === 1 ? 'purchase item' : 'item unavailable' }}
			</button>
			<h3 class="order-1">
				Builds into
			</h3>
			<ul id="item-shop-builds-into-list">
				<li v-for="i in 6" :key="i">
					<button
						:disabled="!buildsIntoItems[i - 1]"
						:data-buyability="buildsIntoItems[i - 1]?.buyability"
						:data-bought="buildsIntoItems[i - 1]?.isBought ? '' : undefined"
						:data-legendary="buildsIntoItems[i - 1]?.isLegendary ? '' : undefined"
						@mouseenter="buildsIntoItems[i - 1] && enterTooltipableElement($event, buildsIntoItems[i - 1]!)"
						@click="selectOrBuyIfDouble(buildsIntoItems[i - 1]!, true)"
						@click.right="rightClickItem($event, buildsIntoItems[i - 1]!.item, buildsIntoItems[i - 1]!.buyability)"
					>
						<span v-if="buildsIntoItems[i - 1]" class="sr-only">{{ buildsIntoItems[i - 1]!.item.name }}</span>
						<img
							v-if="buildsIntoItems[i - 1]"
							:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${buildsIntoItems[i - 1]!.item.image}`"
							:alt="buildsIntoItems[i - 1]!.item.name"
							class="item-shop-item-img"
							width="64"
							height="64"
							aria-hidden="true"
							loading="lazy"
						>
						<span class="sr-status">{{ buildsIntoItems[i - 1]?.srStatus }}</span>
					</button>
				</li>
				<li>
					<button
						v-if="buildsIntoItems.length <= 7"
						:disabled="!buildsIntoItems[6]"
						:data-buyability="buildsIntoItems[6]?.buyability"
						:data-bought="buildsIntoItems[6]?.isBought ? '' : undefined"
						:data-legendary="buildsIntoItems[6]?.isLegendary ? '' : undefined"
						@click="selectOrBuyIfDouble(buildsIntoItems[6]!, true)"
						@click.right="rightClickItem($event, buildsIntoItems[6]!.item, buildsIntoItems[6]!.buyability)"
						@mouseenter="buildsIntoItems[6] && enterTooltipableElement($event, buildsIntoItems[6]!)"
					>
						<span v-if="buildsIntoItems[6]" class="sr-only">{{ buildsIntoItems[6].item.name }}</span>
						<img
							v-if="buildsIntoItems[6]"
							:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${buildsIntoItems[6].item.image}`"
							:alt="buildsIntoItems[6].item.name"
							class="item-shop-item-img"
							width="64"
							height="64"
							aria-hidden="true"
							loading="lazy"
						>
						<span class="sr-status">{{ buildsIntoItems[6]?.srStatus }}</span>
					</button>
					<button v-else popovertarget="builds-into-more-list" @focusout="closeBuildsIntoMoreListIfOutside">
						+{{ buildsIntoItems.length - 6 }}
					</button>
					<ul
						id="builds-into-more-list"
						ref="buildsIntoMoreList"
						popover
						@focusout="closeBuildsIntoMoreListIfOutside"
					>
						<li v-for="shopItem in buildsIntoItems.slice(6)" :key="shopItem.item.id">
							<button
								:data-buyability="shopItem.buyability"
								:data-bought="shopItem.isBought ? '' : undefined"
								:data-legendary="shopItem.isLegendary ? '' : undefined"
								@mouseenter="enterTooltipableElement($event, shopItem)"
								@click="selectBuildsIntoMoreItem(shopItem)"
								@click.right="rightClickItem($event, shopItem.item, shopItem.buyability)"
							>
								<img
									:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem.item.image}`"
									:alt="shopItem.item.name"
									class="item-shop-item-img"
									width="64"
									height="64"
									aria-hidden="true"
									loading="lazy"
								>
								<span class="sr-status">{{ shopItem.srStatus }}</span>
								<span>{{ shopItem.item.name }}</span>
							</button>
						</li>
					</ul>
				</li>
			</ul>
			<h3 v-show="displayedItem">
				{{ displayedItem?.item.name }} build path
			</h3>
			<div id="item-shop-build-path">
				<LolItemBuildPathButton
					v-if="displayedItem"
					:shop-item="displayedItem"
					:data-legendary="displayedItem.isLegendary ? '' : undefined"
					:class="{ selected: selectedItem?.item.id === displayedItem.item.id }"
					@click="selectOrBuyIfDouble(displayedItem, false)"
					@click.right="rightClickItem($event, displayedItem.item, displayedItem.buyability)"
					@mouseenter="enterTooltipableElement($event, displayedItem)"
				/>
				<ul
					v-if="displayedItemBuildsFrom?.length"
					class="grid grid-flow-col w-full"
					:class="{ 'auto-cols-[1fr]': !(displayedItemBuildPath2ndLevelItemCount >= 3 && displayedItemBuildPath3rdLevelHasTwo3Items) }"
				>
					<li
						v-for="(secondLevelBuildsFromItem, secondLevelIndex) in displayedItemBuildsFrom"
						:key="secondLevelIndex"
					>
						<LolItemBuildPathButton
							component
							:shop-item="secondLevelBuildsFromItem"
							:class="{ selected: selectedItem?.item.id === secondLevelBuildsFromItem.item.id }"
							@click="selectOrBuyIfDouble(secondLevelBuildsFromItem, false)"
							@click.right="rightClickItem($event, secondLevelBuildsFromItem.item, secondLevelBuildsFromItem.buyability)"
							@mouseenter="enterTooltipableElement($event, secondLevelBuildsFromItem)"
						/>
						<ul v-if="secondLevelBuildsFromItem.from?.length" class="grid auto-cols-[1fr] grid-flow-col w-full">
							<li
								v-for="(thirdLevelBuildsFromItem, thirdLevelIndex) in secondLevelBuildsFromItem.from"
								:key="`${secondLevelIndex}-${thirdLevelIndex}`"
							>
								<LolItemBuildPathButton
									component
									:shop-item="thirdLevelBuildsFromItem"
									:class="{ selected: selectedItem?.item.id === thirdLevelBuildsFromItem.item.id }"
									@click="selectOrBuyIfDouble(thirdLevelBuildsFromItem, false)"
									@click.right="rightClickItem($event, thirdLevelBuildsFromItem.item, thirdLevelBuildsFromItem.buyability)"
									@mouseenter="enterTooltipableElement($event, thirdLevelBuildsFromItem)"
								/>
							</li>
						</ul>
					</li>
				</ul>
			</div>
		</section>
		<footer>
			<button
				:disabled="selectedItemInventoryIndex === undefined"
				@click="sellItem($event, selectedItemInventoryIndex!)"
			>
				sell
			</button>
			<button
				:disabled="!damageSource?.itemsUndoSnapshots.value.length"
				@click="undo"
			>
				undo
			</button>
			<section
				id="item-shop-panel-eq"
				:data-pinned="inventoryPanelPinned || undefined"
				:style="`--inventory-ward-icon: url('https://raw.communitydragon.org/${minorVersion}/game/assets/ux/minimap/pings/need_ward_gray.png')`"
			>
				<h2>inventory</h2>
				<button class="pin-button" @click="inventoryPanelPinned = !inventoryPanelPinned">
					<span>Pin inventory panel</span>
					<img
						v-bind="textureBgImageAttrs(ui.shop.pin.default, 28)"
						:style="`--txt-hover-uv-start-x: -${ui.shop.pin.hover.uv[0]}px; --txt-hover-uv-start-y: -${ui.shop.pin.hover.uv[1]}px; --txt-slcHover-uv-start-x: -${ui.shop.pin.slcHover.uv[0]}px; --txt-slcHover-uv-start-y: -${ui.shop.pin.slcHover.uv[1]}px`"
					>
				</button>
				<Icon class="i-ph:caret-left-bold caret" />
				<div>
					<ul>
						<li v-for="i in damageSource?.roleQuest.value === 'bot' ? 7 : 6" :key="i">
							<component
								:is="targetShopItems[i - 1] ? 'button' : 'div'"
								:class="targetShopItems[i - 1] && targetShopItems[i - 1]!.item.id === displayedItem?.item.id ? 'selected' : undefined"
								@mouseenter="targetShopItems[i - 1] && enterTooltipableElement($event, targetShopItems[i - 1]!)"
								@click="targetShopItems[i - 1] && selectItem(targetShopItems[i - 1]!, true, i - 1)"
								@click.right="targetShopItems[i - 1] && sellItem($event, i - 1)"
							>
								<span>{{ targetShopItems[i - 1]?.item.name }}</span>
								<img
									v-if="targetShopItems[i - 1]"
									:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${targetShopItems[i - 1]!.item.image}`"
									width="64"
									height="64"
									aria-hidden="true"
									loading="lazy"
								>
							</component>
						</li>
					</ul>
					<div v-if="damageSource?.roleQuest.value !== 'bot'">
						<span>ward slot (n/a)</span>
					</div>
					<img
						:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-static-assets/global/default/images/nav-icon-collections.svg`"
						width="26"
						height="24"
						loading="lazy"
					>
				</div>
			</section>
			<p>
				<img
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/tft/goldcoinslarge.png`"
					width="32"
					height="28"
					alt="gold coins"
					loading="lazy"
				>
				<span> {{ inventoryValue }}</span>
				inventory value
			</p>
		</footer>
		<div id="item-shop-hover-tooltip" ref="itemTooltip" popover="hint" class="hover-tooltip">
			<LolItemDescription
				:item="hoveredItem?.item"
				:damage-source="damageSource"
				header-subtitles
				hover-tooltip
				source="Shop"
			/>
		</div>
	</VDialog>
</template>

<style>
@layer components {
	:root {
		--item-img-size: 3.5rem;
		--item-img-text-gap: calc(0.5 * var(--spacing));
		--item-img-text-h: calc(5 * var(--spacing));
	}

	[data-sprite-image] {
		--at-apply: object-none bg-no-repeat;
		background-position: calc(var(--txt-uv-start-x) * var(--txt-scale)) calc(var(--txt-uv-start-y) * var(--txt-scale));
	}

	#dialog-item-shop {
		--at-apply: 'bg-[--bg-clr] h-200 max-w-[90vw] relative of-visible b b-[--ui-btn-border-clr]';
		--bg-clr: var(--cyan-bg);
		--item-button-img-b-w: 3px;
		--item-img-borderless-size: calc(var(--item-img-size) - 2 * var(--item-button-img-b-w));
		--header-px: calc(3 * var(--spacing));

		&[open] {
			--at-apply: 'grid';
		}

		grid-template-areas:
			'header header builds-into'
			'aside items builds-into'
			'footer footer builds-into';
		grid-template-rows: auto 1fr auto;
		grid-template-columns: auto 1fr 32rem;

		> header {
			--at-apply: 'grid col-span-2 auto-rows-min grid-cols-[1fr_auto] items-center';
			grid-area: header;

			> h1 {
				--at-apply: 'col-span-full font-700 text-xl uppercase text-neutral-200 px-[--header-px] pt-3 pb-2 mb-5 text-center b-b-2 b-cyan-400/70';

				border-image: linear-gradient(
						90deg,
						transparent 0%,
						theme('colors.cyan.400/0.7') 40%,
						theme('colors.cyan.400') 50%,
						theme('colors.cyan.400/0.7') 60%,
						transparent 100%
					)
					1;
			}

			> form {
				--at-apply: 'end-0 top-0 absolute';

				> button {
					--at-apply: 'p-1 text-neutral-200 hoverable:text-white';

					> span:first-child {
						--at-apply: 'size-6';
					}

					> span:last-child {
						--at-apply: 'sr-only';
					}
				}
			}

			> div.inline-search-label {
				--at-apply: 'col-span-full mx-[--header-px]';

				> div {
					--at-apply: 'bg-[--bg-clr] grid grid-flow-col grid-cols-[1fr_2fr] grid-rows-[auto_1fr] h-[50vh] w-full translate-y-full start-0 bottom-0 absolute z-10 b b-[--ui-btn-border-clr] b-t-0 shadow-xl';
					--px: calc(3 * var(--spacing));
					--hover-bg: theme('colors.cyan.400/0.2');

					> p {
						--at-apply: 'uppercase px-[--px] font-700 text-neutral-200 py-2';
					}

					> ul {
						--at-apply: 'h-full of-y-auto';

						> li {
							--at-apply: 'grid grid-cols-[auto_1fr] grid-rows-2 ps-[--px] pe-1 py-2 hover:bg-[--hover-bg] gap-x-2 mb-1 last:mb-0';

							&.selected {
								--at-apply: 'bg-[--hover-bg]';
							}

							> img {
								--at-apply: 'row-span-full';
							}

							> span:first-of-type {
								--at-apply: 'w-full block truncate text-ellipsis font-500 text-lg';
							}

							> span:last-of-type {
								--at-apply: 'text-neutral-300 font-500';
							}
						}
					}

					> section {
						--at-apply: 'row-span-full px-3 py-2 b-s b-neutral-400 of-y-auto';

						> .item-description-header {
							--at-apply: 'hoverable:bg-[--hover-bg] py-2';
						}

						> .item-description > :first-child {
							border-image: linear-gradient(
									90deg,
									transparent 0%,
									var(--ui-btn-border-clr) 30%,
									var(--ui-btn-border-clr) 70%,
									transparent 100%
								)
								1;
						}
					}
				}
			}

			> #item-shop-category-filter {
				--at-apply: 'row-start-3 h-12 flex items-start';

				> button {
					--at-apply: 'h-12 w-10 grid-center relative';

					&::after {
						--at-apply: 'absolute bottom-0 h-1 bg-amber-300 inset-x-1.75';
					}

					&:first-of-type {
						--at-apply: 'mx-1.5';
					}

					&[aria-checked='true'] {
						background: linear-gradient(
							180deg,
							theme('colors.amber.100/0.02') 0%,
							theme('colors.amber.100/0.1') 15%,
							theme('colors.amber.100/0.1') 65%,
							theme('colors.amber.100/0.3') 100%
						);

						&::after {
							--at-apply: 'content-empty';
						}
					}

					&[aria-checked='true'],
					&:hover,
					&:focus-visible {
						> img {
							--at-apply: 'brightness-150';
						}
					}
				}
			}

			> #item-shop-swap-sort-order {
				--at-apply: 'self-center me-[--header-px]';

				> span {
					--at-apply: 'sr-only';
				}
			}
		}

		> aside {
			--at-apply: 'row-start-2 b-e b-e-neutral-500 flex flex-col items-center py-2 of-y-auto b-t b-t-[--ui-btn-border-clr]';
			grid-area: aside;

			> button {
				--at-apply: 'mx-[--header-px] mb-2';

				> span {
					--at-apply: 'sr-only';
				}
			}

			> fieldset {
				--at-apply: 'flex flex-col gap-px w-full';

				> legend {
					--at-apply: 'sr-only';
				}

				> hr {
					--at-apply: 'b-[--ui-btn-border-clr] my-0.5 mx-[--header-px]';
				}

				> label {
					--at-apply: 'relative';

					&::after {
						--at-apply: 'inset-y-0 absolute end-0 w-0.5 bg-cyan-400';
					}

					> span {
						--at-apply: 'sr-only';
					}

					> img {
						--at-apply: 'mx-auto my-1.5';
					}
				}

				> input {
					--at-apply: 'sr-only';

					&:focus-visible + label {
						outline: auto;
					}

					&:checked + label > img {
						--txt-uv-start-x: var(--txt-selected-uv-start-x) !important;
						--txt-uv-start-y: var(--txt-selected-uv-start-y) !important;
					}
				}

				> input:disabled + label > img {
					--at-apply: 'brightness-40';
				}

				> input:not(:checked):focus-visible + label,
				> input:not(:checked, :disabled) + label:hover {
					> img {
						--at-apply: 'brightness-200';
					}
				}

				> input:not(:disabled):is(:focus-visible, :checked) + label,
				> input:not(:disabled) + label:hover {
					background: linear-gradient(
						90deg,
						transparent 55%,
						theme('colors.cyan.400/0.2') 80%,
						theme('colors.cyan.400/0.7') 100%
					);

					&::after {
						--at-apply: 'content-empty';
					}
				}
			}
		}

		#item-shop-swap-sort-order:hover,
		#item-shop-swap-sort-order:focus-visible,
		#item-shop-clear-stat-filters:hover,
		#item-shop-clear-stat-filters:focus-visible {
			img {
				--txt-uv-start-x: var(--txt-hover-uv-start-x) !important;
				--txt-uv-start-y: var(--txt-hover-uv-start-y) !important;
			}
		}

		#item-shop-panel-boots,
		#item-shop-panel-eq {
			--at-apply: 'bg-[--bg-clr] b b-[--ui-btn-border-clr]';

			--side-panel-gap: calc(2 * var(--spacing));
			--side-panel-py: calc(4 * var(--spacing));
			--side-panel-gap: calc(var(--spacing) * 3);
			--side-panel-row-h: calc(var(--item-img-size) + 1.5rem);
			--side-panel-p: calc(var(--spacing) * 4);
			--side-panel-inner-p: calc(var(--spacing) * 1.25);
			--side-panel-w: calc(var(--item-img-size) + 2 * var(--side-panel-inner-p));

			--side-panel-eq-gap: calc(1 * var(--spacing));
			--side-panel-eq-button-size: calc(
				(var(--side-panel-inner-p) + 2 * var(--item-img-size) + var(--side-panel-gap)) / 3
			);
			--side-panel-eq-h: calc(var(--side-panel-eq-button-size) * 2 + var(--side-panel-eq-gap));

			:where(&[data-pinned]) {
				> .pin-button img {
					--txt-uv-start-x: var(--txt-hover-uv-start-x) !important;
					--txt-uv-start-y: var(--txt-hover-uv-start-y) !important;
				}
			}
		}

		#item-shop-panel-boots {
			--at-apply: 'p-[--side-panel-p] ps-6 start-0 bottom-[calc(var(--side-panel-eq-h)+2*var(--side-panel-p)+14*var(--spacing))] absolute z-10 -translate-x-full';
			--side-panel-h: calc(var(--side-panel-row-h) * 3 + 2 * var(--side-panel-gap) + 2 * var(--side-panel-inner-p));

			> div {
				--at-apply: 'relative w-(--side-panel-w) h-(--side-panel-h) box-content of-hidden';

				> ul {
					--at-apply: 'absolute start-0 top-0 grid grid-cols-[repeat(3,_max-content)] grid-rows-[repeat(3,_max-content)] grid-flow-col gap-3 p-1.25';

					direction: rtl;
				}
			}
		}

		#item-shop-panel-eq {
			--at-apply: 'p-[--side-panel-p] ps-6 start-0 bottom-8 absolute z-10 -translate-x-full';

			> div {
				--at-apply: 'relative pe-[calc(var(--side-panel-w)-var(--side-panel-inner-p)-var(--item-button-img-b-w))] h-(--side-panel-eq-h) box-content of-hidden';

				> ul {
					--at-apply: 'absolute ps-[calc(var(--side-panel-inner-p)+var(--item-button-img-b-w))] end-[--side-panel-w] top-0 grid grid-cols-[repeat(3,_max-content)] grid-rows-[repeat(2,_max-content)] gap-[--side-panel-eq-gap] z-0';

					> li {
						--at-apply: 'size-[--side-panel-eq-button-size]';

						> * {
							--at-apply: 'bg-black m-[--item-button-img-b-w] size-[calc(var(--side-panel-eq-button-size)-6px)]';

							> span {
								--at-apply: 'sr-only';
							}
						}

						&:nth-child(7) {
							--at-apply: 'absolute end-[--side-panel-inner-p] top-1/2 -translate-y-[calc(50%-var(--item-button-img-b-w))]';

							> * {
								--at-apply: 'rounded-1/2';

								> img {
									--at-apply: 'rounded-inherit';
								}
							}
						}
					}
				}

				> img {
					--at-apply: 'absolute size-[--side-panel-eq-button-size] top-1/2 -translate-y-1/2 end-[--side-panel-inner-p]';
				}

				> div {
					--at-apply: 'hidden absolute end-[--side-panel-inner-p] top-1/2 -translate-y-1/2 m-[--item-button-img-b-w] size-[calc(var(--side-panel-eq-button-size)-6px)] bg-black cursor-not-allowed';

					> span {
						--at-apply: 'sr-only';
					}

					&::before {
						--at-apply: 'block size-full brightness-80 content-empty';
						background-image: var(--inventory-ward-icon);
						background-repeat: no-repeat;
						background-size: 60%;
						background-position: center;
					}
				}
			}

			&[data-pinned],
			&:hover,
			&:has(li > button:focus-visible) {
				> div {
					> img {
						--at-apply: 'hidden';
					}

					> div {
						--at-apply: 'block';
					}
				}
			}
		}

		#item-shop-panel-boots,
		#item-shop-panel-eq {
			> h2 {
				--at-apply: 'sr-only';
			}

			> .pin-button {
				--at-apply: 'op-0 start-0 top-0 absolute z-10 -translate-x-1/2 -translate-y-1/5';

				&:hover img,
				&:focus-visible img {
					--txt-uv-start-x: var(--txt-slcHover-uv-start-x) !important;
					--txt-uv-start-y: var(--txt-slcHover-uv-start-y) !important;
				}

				> span {
					--at-apply: 'sr-only';
				}
			}

			> .icon.caret {
				--at-apply: 'size-5 bg-cyan-400 start-1 top-1/2 absolute -translate-y-1/2';
			}

			&[data-pinned],
			&:hover,
			&:focus-within {
				> .pin-button {
					--at-apply: 'op-100';
				}
			}

			&[data-pinned],
			&:hover,
			&:has(li > button:focus-visible) {
				--at-apply: 'ps-4';

				> .icon.caret {
					--at-apply: 'hidden';
				}

				> div {
					--at-apply: 'w-auto of-visible';

					ul {
						--at-apply: 'static w-auto';
					}
				}
			}
		}

		.item-shop-item-btn {
			--at-apply: 'p-[--p] -m-1';
			--p: calc(1 * var(--spacing));
			direction: ltr;

			> span:first-child {
				--at-apply: 'sr-only';
			}

			> span:last-of-type {
				--at-apply: 'block leading-[--item-img-text-h] pt-[--item-img-text-gap] text-center font-500';
			}

			&:hover,
			&:focus-visible {
				--at-apply: 'bg-blue/10';
			}

			&.selected {
				box-shadow: 0 0 0 1px theme('colors.blue');
				background-image: linear-gradient(0deg, theme('colors.blue/0.1'), transparent);
			}
		}

		.item-shop-item-btn > img,
		.item-shop-item-img {
			--size: calc(var(--item-img-size) - 2 * var(--item-button-img-b-w));
			--at-apply: 'size-[--size] min-w-[--size] m-[--item-button-img-b-w] text-xs text-center break-words';
		}

		#item-shop-panel-eq > div > ul > li > *,
		#item-shop-panel-eq > div > div,
		.item-shop-item-btn img,
		.item-shop-item-img {
			box-shadow:
				0 0 0 2px var(--inner-border, theme('colors.neutral.600')),
				0 0 0 var(--item-button-img-b-w) black;
		}

		#item-shop-builds-into-list > li > button[popovertarget]:is(:hover, :focus-visible, :has(+ [popover]:popover-open)),
		#builds-into-more-list > li > button:is(:hover, :focus-visible),
		#item-shop-panel-eq > div > ul > li > button:is(:hover, :focus-visible, .selected),
		.item-shop-item-btn:is(:hover, :focus-visible, .selected) img,
		#item-shop-search-listbox > li:is(:hover, :focus-visible, .selected) img,
		.item-shop-item-img:hover {
			--inner-border: white;
		}

		#item-shop-builds-into-list {
			> li {
				--at-apply: 'bg-black size-(--item-img-size)';

				> button {
					--at-apply: 'size-full';

					&:disabled,
					&[popovertarget] {
						--at-apply: 'm-[--item-button-img-b-w] size-(--item-img-borderless-size)';
						box-shadow:
							0 0 0 2px var(--inner-border, theme('colors.neutral.600')),
							0 0 0 var(--item-button-img-b-w) black;
					}

					&[popovertarget]:is(:hover, :focus-visible),
					&[popovertarget]:has(+ [popover]:popover-open) {
						background-image: linear-gradient(0deg, theme('colors.white/0.2'), transparent);
					}
				}

				&:last-child {
					--at-apply: 'relative';
					anchor-name: --last-builds-into-button;
				}
			}
		}

		#builds-into-more-list {
			--at-apply: 'h-max max-h-[max(calc(60*var(--spacing)),60vh)] max-w-screen w-66 of-y-auto z-10 py-1 b b-[--ui-btn-border-clr] bg-[--bg-clr] shadow-lg';
			position-anchor: --last-builds-into-button;
			inset-block-start: calc(anchor(bottom) + 2px);
			inset-inline-end: anchor(right);

			> li {
				> button {
					--at-apply: 'text-start flex w-full items-center py-[--py] px-[--px] gap-2 hoverable:bg-white/10';
					--px: calc(var(--spacing) * 5);
					--py: calc(var(--spacing) * 2);

					&[data-bought] {
						--at-apply: 'bg-black/20';
					}

					> span {
						--at-apply: 'truncate font-500';
					}
				}
			}
		}

		#item-shop-hover-tooltip {
			--at-apply: 'w-(--width) fixed p-2';
			--width: 36rem;
			inset-inline-start: clamp(0px, var(--left), calc(100vw - min(100vw, var(--width))));
			inset-block-start: clamp(0px, var(--top), calc(100vh - min(100vh, var(--height))));
		}

		#item-shop-search-listbox > li,
		#builds-into-more-list > li > button,
		#item-shop-builds-into-list > li > button,
		.item-shop-item-btn {
			--at-apply: 'relative';

			> .sr-status {
				--at-apply: 'block text-transparent tracking-[-1em] absolute size-[calc(0.6*var(--item-img-size))] z-2 translate-center start-[calc(var(--check-icon-start,0px)+0.5*var(--item-img-size))] top-[calc(var(--check-icon-top,0px)+0.5*var(--item-img-size))] pointer-events-none';
			}
		}

		:is(
				#item-shop-search-listbox > li,
				#builds-into-more-list > li > button,
				#item-shop-builds-into-list > li > button,
				.item-shop-item-btn
			):where([data-bought], [data-buyability='0'], [data-buyability='-1'])
			> img,
		#item-shop-build-path ul .item-shop-item-btn[data-bought] > img,
		#item-shop-build-path .item-shop-item-btn[data-bought] + ul .item-shop-item-btn > img {
			--at-apply: 'brightness-60';
		}

		:is(
				#item-shop-search-listbox > li,
				#builds-into-more-list > li > button,
				#item-shop-builds-into-list > li > button,
				.item-shop-item-btn
			)[data-bought][data-legendary]
			> .sr-status,
		#item-shop-build-path ul .item-shop-item-btn[data-bought] > .sr-status,
		#item-shop-build-path .item-shop-item-btn[data-bought] + ul .item-shop-item-btn > .sr-status {
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 256 256'%3E%3C!-- Icon from Phosphor by Phosphor Icons - https://github.com/phosphor-icons/core/blob/main/LICENSE --%3E%3Cg%3E%3Cpath fill='oklch(78.9%25 0.154 211.53)' d='m237.66 85.26l-128.4 128.4a8 8 0 0 1-11.32 0l-71.6-72a8 8 0 0 1 0-11.31l24-24a8 8 0 0 1 11.32 0L104 147.43l98.34-97.09a8 8 0 0 1 11.32 0l24 23.6a8 8 0 0 1 0 11.32'/%3E%3Cpath fill='%23000' d='m243.28 68.24l-24-23.56a16 16 0 0 0-22.59 0L104 136.23l-36.69-35.6a16 16 0 0 0-22.58.05l-24 24a16 16 0 0 0 0 22.61l71.62 72a16 16 0 0 0 22.63 0L243.33 90.91a16 16 0 0 0-.05-22.67M103.62 208L32 136l24-24a.6.6 0 0 1 .08.08l42.35 41.09a8 8 0 0 0 11.19 0L208.06 56L232 79.6Z'/%3E%3C/g%3E%3C/svg%3E"); /* cyan-400 fill */
			background-size: 100% 100%;
			background-position: center;
			background-repeat: no-repeat;
		}

		.item-shop-item-btn {
			--check-icon-start: var(--p);
			--check-icon-top: var(--p);
		}

		#builds-into-more-list > li > button {
			--check-icon-start: var(--px);
			--check-icon-top: var(--py);
		}

		:is(#builds-into-more-list > li > button, #item-shop-builds-into-list > li > button, .item-shop-item-btn):where(
			&[data-bought],
			&[data-buyability='0'],
			&[data-buyability='-1']
		),
		#item-shop-search-listbox
			> li:where([data-bought], [data-buyability='0'], [data-buyability='-1'])
			> span:last-of-type {
			--at-apply: 'text-neutral-400';
		}

		:where(#builds-into-more-list > li > button[data-buyability='-1']),
		:where(.item-shop-item-btn[data-buyability='-1'] > span:last-of-type) {
			--at-apply: 'relative';

			&::before {
				--at-apply: 'content-empty absolute rounded-1/2 size-5 bg-neutral-900 b b-2 b-[--ui-btn-border-clr] brightness-80';
				box-shadow: 0 2px var(--item-button-img-b-w) 2px theme('colors.black/0.45');
			}

			&::after {
				--at-apply: 'content-empty absolute size-3.5 bg-amber-100 saturate-60 brightness-80';
				mask: var(--lock-icon-url) center / 100% 100% no-repeat;
			}
		}

		.item-shop-item-btn[data-buyability='-1'] {
			> span:last-of-type {
				--at-apply: 'text-transparent tracking-[-1em]';

				&::before {
					--at-apply: '-bottom-0.25 start-1/2 -translate-x-1/2';
				}

				&::after {
					--at-apply: 'bottom-0.5 start-1/2 -translate-x-1/2';
				}
			}
		}

		#builds-into-more-list > li > button[data-buyability='-1'] {
			--lock-inline-start: calc(var(--px) + 0.5 * (var(--item-img-size) + var(--item-button-img-b-w)));

			&::before {
				--at-apply: 'bottom-[--py] start-[--lock-inline-start] -translate-x-1/2 z-1 translate-y-1';
			}

			&::after {
				--at-apply: 'bottom-[calc(var(--py)+0.75*var(--spacing))] start-[--lock-inline-start] -translate-x-1/2 z-1 translate-y-1';
			}
		}

		#builds-into-more-list > li > button[data-buyability='-1']:where(:hover, :focus-visible),
		.item-shop-item-btn[data-buyability='-1']:where(:hover, :focus-visible) > span:last-of-type {
			&::before {
				--at-apply: 'brightness-100';
			}

			&::after {
				--at-apply: 'bg-white saturate-100 brightness-100';
			}
		}

		> section {
			&:nth-of-type(2) {
				--at-apply: 'b-t b-[--ui-btn-border-clr]';
			}

			&:nth-of-type(3) {
				--at-apply: 'flex flex-col p-3 pt-4 of-y-auto b-s b-[--ui-btn-border-clr]';
				grid-area: builds-into;

				> h3 {
					--at-apply: 'font-700 text-lg uppercase mb-1 text-neutral-200';

					&:nth-of-type(2) {
						--at-apply: 'sr-only';
					}
				}

				> button {
					--at-apply: 'text-lg py-0.5 b-2 b-[--ui-btn-border-clr] bg-cyan-900 hoverable:bg-cyan-800 uppercase order-4 font-600 text-cyan-300';
				}

				> .item-description-header {
					--at-apply: 'pt-2 mt-3 b-t';
				}

				#item-shop-builds-into-list {
					--at-apply: 'flex gap-3 min-h-(--item-img-size) justify-around order-2 relative *:shrink-0';
				}

				#item-shop-build-path {
					--at-apply: 'b-t box-content py-3 mt-3 text-center flex flex-col items-center justify-center order-3 shrink-0';
					min-height: calc(
						3 * (var(--item-img-size) + var(--item-mb) + var(--item-img-text-gap) + var(--item-img-text-h)) + 2 *
							var(--item-mt)
					);
					--item-mb: calc(1.5 * var(--spacing));
					--item-mt: calc(4 * var(--spacing));
				}

				> .item-description-header,
				> .item-description > :first-child,
				> #item-shop-build-path {
					border-image: linear-gradient(
							90deg,
							transparent 10%,
							theme('colors.cyan.400/0.7') 30%,
							theme('colors.cyan.400/0.7') 70%,
							transparent 90%
						)
						1;
				}
			}
		}

		> footer {
			--at-apply: 'flex items-center py-2.5 px-3 b-t b-[--ui-btn-border-clr]';
			grid-area: footer;

			> button {
				--at-apply: 'b-2 b-[--ui-btn-border-clr] text-amber-100 font-500 py-0.5 px-2 uppercase text-center w-24';

				&:nth-of-type(1) {
					--at-apply: 'bg-yellow-950 hoverable:bg-yellow-900';
				}

				&:nth-of-type(2) {
					--at-apply: 'bg-[--placeholder-champion-bg-clr] hoverable:bg-neutral-800 ms-2.5 me-5';
				}
			}

			> p {
				--at-apply: 'text-neutral-400 font-500 flex items-center';

				> img {
					--at-apply: 'inline-block h-3.5 w-auto';
					vertical-align: -0.0625em;
				}

				> span {
					--at-apply: 'text-amber-200 font-500 text-lg mx-1.5';
				}
			}
		}

		> section:nth-of-type(3) > button,
		> footer > button {
			&:disabled {
				--at-apply: 'b-neutral-500 text-neutral-400 bg-neutral-800 hoverable:bg-neutral-800';
			}
		}
	}
}
</style>
