<script setup lang="ts">
import type { IShopItem } from '~/utils/types';

const target = defineModel<DamageSource>();

const itemVariableCalculationTarget = computed(() => target.value?.getItemVariableCalculationTarget());

type IAllItemCategory = IItemCategory | 'all';

const { version, minorVersion } = usePatchVersion();
const items = useItems();
const maps = useMaps();
const ui = useUi();

const vDialog = useTemplateRef('vDialog');
const mapMask = ref<number>(maps.sr.mask);
const selectedCategory = ref<IAllItemCategory>('all');
const sortOrderSwapped = ref(false);
const appliedStatFilters = ref<Record<IItemShopStatFilter, boolean>>(Object.fromEntries(
	Object.entries(ITEM_SHOP_STAT_FILTERS).map(([name]) => [name, false]),
) as Record<IItemShopStatFilter, boolean>);

const ITEM_EPICNESSES: [number, string][] = [
	[7, 'unique'],
	[1, 'starter'],
	[0, 'basic'],
	[4, 'epic'],
	[5, 'legendary'],
];

const BOOT_ITEM_IDS = [
	'1001', // boots
	'3047', // plated steelcaps
	'3111', // mercury's treads
	'3006', // berserker's greaves
	'3009',	// boots of swiftness
	'3020', // sorcerer's shoes
	'3158', // ionian boots of lucidity
];

const sortedByPriceForMap = computed(() => Object
	.values(items)
	.sort((a, b) => a.gold.total - b.gold.total)
	.filter(item => (item.mapMask & mapMask.value) !== 0));

// TODO only items which components are present, update prices
// calculate item total
// add locks, ideally pseudo elements
// add sr-only (not buyable, inventory full?)
// check look of search unavailable items, check
// stop `buyItem` if can't buy
// use calculated prices in places (build path, others)
const shopItems = computed<IShopItem[]>(() => sortedByPriceForMap.value.map((item) => {
	let buyability: -1 | 0 | 1 = 1;

	if (target.value?.inventoryFull.value) {
		buyability = 0;
	}

	return [item, buyability, item.gold.total];
}));
const shopItemsMap = computed(() => new Map<string, IShopItem>(Object.values(shopItems.value).map(v => [v[0].id, v])));
const filteredByCategory = computed(() =>
	selectedCategory.value === 'all'
		? shopItems.value
		: shopItems.value.filter(([item]) => item.categories?.[selectedCategory.value as IItemCategory]),
);
const filteredByStats = computed(() => {
	const filterFunctions = Object.entries(appliedStatFilters.value).filter(([, isEnabled]) => isEnabled).map(([filter]) => ITEM_SHOP_STAT_FILTERS[filter as IItemShopStatFilter].filter);

	return filterFunctions.length ? filteredByCategory.value.filter(([item]) => filterFunctions.every(f => f(item))) : filteredByCategory.value;
});
const groupedByEpicness = computed(() => filteredByStats.value.reduce((acc, itemWithBuyability) => {
	const { epicness = 0 } = itemWithBuyability[0];

	if (itemWithBuyability[0].isBoots && epicness !== 7) {
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
		appliedStatFilters.value[filter as IItemShopStatFilter] || filteredByStats.value.some(([item]) => filterFunction(item)),
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

const targetShopItems = computed<IShopItem<false>[] | undefined>(() => target.value?.items.value.map(item =>
	shopItemsMap.value.get(item.id)!,
));

const selectedItemId = ref<string>();
const displayedItemId = ref<string>();
const selectedItem = computed(() => selectedItemId.value ? shopItemsMap.value.get(selectedItemId.value) : undefined);
const displayedItem = computed(() => displayedItemId.value ? shopItemsMap.value.get(displayedItemId.value) : undefined);

function selectItem(item: IShopItem<boolean>, overwriteDisplayed: boolean) {
	selectedItemId.value = item[0].id;
	if (overwriteDisplayed) {
		displayedItemId.value = item[0].id;
	}
}

function buyItem(item: IItem, buyability: IShopItem[1]) {
	if (target.value && !target.value.inventoryFull.value) {
		target.value.items.value.push(markRaw(item));
	}
}

function sellItem(event: MouseEvent, index: number) {
	if (target.value?.items.value?.[index]) {
		target.value.items.value.splice(index, 1);
		leaveTooltipableElement();
		if (target.value.items.value?.[index]) {
			enterTooltipableElement(event, shopItemsMap.value.get(target.value.items.value[index].id)!);
		}
	}
}

function rightClickItem(event: MouseEvent, item: IItem, buyability: IShopItem[1]) {
	!event.shiftKey && buyItem(item, buyability);
}

const displayedItemBuildsFrom = computed<IShopItem<true>[] | undefined>(() =>
	displayedItem.value?.[0].from?.map((secondLevelItemId) => {
		const secondLevelItem = shopItemsMap.value.get(secondLevelItemId)!;
		return [...secondLevelItem, (secondLevelItem[0].from || []).map((thirdLevelItemId) => {
			const thirdLevelItem = shopItemsMap.value.get(thirdLevelItemId)!;
			return thirdLevelItem;
		})];
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
	return shopItems.value.filter(([item]) => splitSearch.every(word => item.searchString.includes(word)));
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

function selectSearchResult(event: MouseEvent, index: number) {
	const item = searchResults.value[index]!;
	if (event.button === 2) {
		selectedItemId.value = item[0].id;
		searchCursoredOverIndex.value = undefined;
		selectItem(item, true);
		buyItem(item[0], item[1]);
		closeSearch();
		searchInput.value?.blur();
	} else {
		searchCursoredOverIndex.value = index;
		searchSelectedIndex.value = index;
		if (selectOrBuyIfDouble(item, true)) {
			closeSearch();
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
				buyItem(searchCursoredOverItem.value[0], searchCursoredOverItem.value[1]);
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

function onSearchHeaderClick(isRightClick: boolean) {
	if (isRightClick) {
		buyItem(searchCursoredOverItem.value![0], searchCursoredOverItem.value![1]);
	} else {
		selectOrBuyIfDouble(searchCursoredOverItem.value!, true);
	}
}

let lastLeftClicked: [time: number, itemId: string] | undefined;

function selectOrBuyIfDouble(item: IShopItem, overwriteDisplayed: boolean): boolean {
	const now = Date.now();
	if (lastLeftClicked && item[0].id === lastLeftClicked[1] && ((now - lastLeftClicked[0]) < 500)) {
		buyItem(item[0], item[1]);
		lastLeftClicked = undefined;
		return true;
	}

	lastLeftClicked = [now, item[0].id];
	selectItem(item, overwriteDisplayed);
	return false;
}

let itemTooltipAnchor: undefined | HTMLElement;
const itemTooltip = useTemplateRef('itemTooltip');
const hoveredItem = shallowRef<IShopItem<boolean>>();

function enterTooltipableElement(eventLike: { target: HTMLElement } | MouseEvent, item: IShopItem<boolean>) {
	const { target } = eventLike as { target: HTMLElement };
	itemTooltip.value?.showPopover();
	itemTooltipAnchor = target;
	itemTooltipAnchor?.addEventListener('mouseleave', leaveTooltipableElement, { passive: true, once: true });
	itemTooltipAnchor?.addEventListener('mousemove', updateTooltipPosition, { passive: true });
	hoveredItem.value = item;
	'clientX' in eventLike && updateTooltipPosition(eventLike);
}

function leaveTooltipableElement() {
	itemTooltip.value?.hidePopover();
	itemTooltipAnchor?.removeEventListener('mousemove', updateTooltipPosition);
	itemTooltipAnchor = undefined;
}

function updateTooltipPosition(event: MouseEvent) {
	const { clientX, clientY } = event;
	itemTooltip.value!.style.setProperty('--left', `${clientX + 10}px`);
	itemTooltip.value!.style.setProperty('--top', `${clientY + 10}px`);
	itemTooltip.value!.style.setProperty('--height', `${itemTooltip.value!.clientHeight}px`);
}

const buildsIntoMoreList = useTemplateRef('buildsIntoMoreList');

const buildsIntoItems = computed(() => selectedItem.value?.[0].into
	?.filter(id => (items[id]!.mapMask & mapMask.value) !== 0)
	.map(id => shopItemsMap.value.get(id)!)
	.sort((a, b) => a[0].gold.total - b[0].gold.total) || []);

function closeBuildsIntoMoreListIfOutside(event: FocusEvent) {
	const target = event.relatedTarget as HTMLElement | null;
	if (!target || !buildsIntoMoreList.value?.contains(target)) {
		buildsIntoMoreList.value?.hidePopover();
	}
}

function selectBuildsIntoMoreItem(item: IShopItem) {
	selectOrBuyIfDouble(item, true);
	leaveTooltipableElement();
}

const displayedItemBuildPath2ndLevelItemCount = computed(() => displayedItem.value?.[0].from?.length || 0);
const displayedItemBuildPath3rdLevelHasTwo3Items = computed(() => {
	let has3Components = false;
	for (const itemId of displayedItem.value?.[0].from || []) {
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
		@contextmenu.prevent=""
	>
		<header style="grid-area: header;" class="grid col-span-2 auto-rows-min grid-cols-[1fr_auto] items-center">
			<h1 class="col-span-full">
				Item shop
			</h1>
			<form method="dialog" class="end-0 top-0 absolute" autofocus>
				<button value="cancel" title="Close">
					<Icon class="i-ph:x size-6" />
					<span class="sr-only">
						close
					</span>
				</button>
			</form>
			<div class="inline-search-label col-span-full" @focusout="closeSearchIfOutside">
				<input
					id="item-shop-search"
					ref="searchInput"
					v-model="search"
					type="text"
					class="py-0.5 pe-2 ps-8 b bg-black w-full"
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
				<label id="item-shop-search-lbl" for="item-shop-search" class="px-2 py-0.5 b b-transparent">
					<Icon class="i-ph:magnifying-glass-bold me-2 size-4" />
					<span>
						Click Here to Search
					</span>
				</label>
				<button class="px-2 grid h-full end-0 top-0 place-items-center absolute" @mousedown.prevent="clearSearch">
					<span class="sr-only">
						Clear
					</span>
					<Icon class="i-ph:x size-4" />
				</button>
				<div
					v-show="searchExpanded"
					ref="searchResultsContainer"
					class="bg-blue-950 grid grid-flow-col grid-cols-[auto_1fr] grid-rows-[auto_1fr] h-[50vh] w-full translate-y-full start-0 bottom-0 absolute z-10"
					@mousedown.prevent=""
				>
					<p id="item-shop-results-lbl">
						Results
					</p>
					<ul
						id="item-shop-search-listbox"
						role="listbox"
						aria-labelledby="item-shop-results-lbl"
						class="h-full of-y-auto *:grid *:grid-cols-[auto_1fr] *:grid-rows-2"
					>
						<!-- TODO style with buyability -->
						<li
							v-for="(shopItem, index) in searchResults"
							:id="`item-shop-search-result-${index}`"
							:key="shopItem[0].id"
							role="option"
							class="hover:bg-white/10"
							:class="{
								'bg-white/10': searchSelectedIndex === index,
								'selected': searchSelectedIndex === index || (searchCursoredOverIndex !== undefined ? searchCursoredOverIndex === index : false),
							}"
							@mouseenter="enterTooltipableElement($event, shopItem)"
							@mousedown.stop.prevent="selectSearchResult($event, index)"
						>
							<img
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem[0].image}`"
								width="64"
								height="64"
								class="item-shop-item-img row-span-full"
								aria-hidden="true"
								loading="lazy"
							>
							{{ shopItem[0].name }}
							<span>{{ shopItem[2] }}</span>
						</li>
					</ul>
					<section aria-live="polite" aria-atomic="true" class="row-span-full">
						<ItemDescription
							ref="searchItemDescription"
							:item="searchCursoredOverItem?.[0]"
							header-class="hoverable:bg-white/10"
							header-tag="button"
							:target="itemVariableCalculationTarget"
							@header-click="onSearchHeaderClick"
						/>
					</section>
				</div>
			</div>
			<VButtonRadiogroup
				id="item-shop-category-filter"
				v-model="selectedCategory"
				class="row-start-3"
				label="Category"
				:options="['all', ...ALL_ITEM_CATEGORIES].map((category) => ({ category: category as IAllItemCategory, texture: ui.shop.categories[category as IAllItemCategory] }))"
				value-key="category"
				required
			>
				<template #default="{ option: { category, texture }, isSelected }">
					<img
						v-bind="textureBgImageAttrs(texture, 20)"
						:class="{ 'bg-pink': isSelected }"
					>
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
				<span class="sr-only">Swap item order</span>
				<img
					v-bind="textureBgImageAttrs(ui.shop.swapItemOrder.default, 32)"
					:style="`--txt-hover-uv-start-x: -${ui.shop.swapItemOrder.hover.uv[0]}px; --txt-hover-uv-start-y: -${ui.shop.swapItemOrder.hover.uv[1]}px`"
				>
			</button>
		</header>
		<aside style="grid-area: aside;" class="row-start-2">
			<button id="item-shop-clear-stat-filters" title="Clear stat filters" @click="clearStatFilters">
				<span class="sr-only">Clear stat filters</span>
				<img
					v-bind="textureBgImageAttrs(ui.shop.clearFilters.default, 28)"
					:style="`--txt-hover-uv-start-x: -${ui.shop.clearFilters.hover.uv[0]}px; --txt-hover-uv-start-y: -${ui.shop.clearFilters.hover.uv[1]}px`"
				>
			</button>
			<fieldset id="item-shop-stat-filters">
				<legend class="sr-only">
					Stat filters
				</legend>
				<template v-for="({ name, texture, selectedUvStartX, selectedUvStartY }, filter) in computedStatFilters" :key="filter">
					<input :id="`item-shop-stat-${filter}`" v-model="appliedStatFilters[filter]" type="checkbox" :disabled="!availableStatFilters[filter]">
					<label :for="`item-shop-stat-${filter}`" :title="name">
						<span>{{ name }}</span>
						<img
							v-bind="texture"
							:style="`--txt-selected-uv-start-x: -${selectedUvStartX}px; --txt-selected-uv-start-y: -${selectedUvStartY}px`"
						>
					</label>
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
					<li v-for="shopItem in bootItems" :key="shopItem[0].id">
						<button
							class="item-shop-item-btn"
							:class="{ selected: selectedItem?.[0].id === shopItem[0].id }"
							:data-buyability="shopItem[1]"
							@mouseenter="enterTooltipableElement($event, shopItem)"
							@click="selectOrBuyIfDouble(shopItem, true)"
							@click.right="rightClickItem($event, shopItem[0], shopItem[1])"
						>
							<span>{{ shopItem[0].name }}</span>
							<img
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem[0].image}`"
								:alt="shopItem[0].name"
								width="64"
								height="64"
								aria-hidden="true"
								loading="lazy"
							>
							<span>{{ shopItem[2] }}</span>
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
					<li v-for="shopItem in groupedByEpicness[epicness]" :key="shopItem[0].id">
						<button
							class="item-shop-item-btn"
							:class="{ selected: selectedItem?.[0].id === shopItem[0].id }"
							:data-buyability="shopItem[1]"
							@mouseenter="enterTooltipableElement($event, shopItem)"
							@mousedown.left="selectOrBuyIfDouble(shopItem, true)"
							@mousedown.right="rightClickItem($event, shopItem[0], shopItem[1])"
							@keydown.space="selectItem(shopItem, true)"
							@keydown.enter="buyItem(shopItem[0], shopItem[1])"
						>
							<span>{{ shopItem[0].name }}</span>
							<img
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem[0].image}`"
								width="64"
								height="64"
								aria-hidden="true"
								loading="lazy"
							>
							<span>{{ shopItem[2] }}</span>
						</button>
					</li>
				</ul>
			</template>
		</section>
		<section style="grid-area: builds-into" class="flex flex-col">
			<ItemDescription
				:item="selectedItem?.[0]"
				header-class="order-5"
				header-tag="h2"
				description-class="order-6"
				:target="itemVariableCalculationTarget"
			/>
			<button
				:disabled="!selectedItem"
				class="text-lg py-0.5 b-2 b-[gold] bg-cyan-900 hoverable:bg-cyan-800 uppercase order-4 disabled:bg-neutral-950"
				@click="buyItem(selectedItem![0], selectedItem![1])"
			>
				Purchase
			</button>
			<h3 class="order-1">
				Builds into
			</h3>
			<ul id="item-shop-builds-into-list" class="flex gap-3 h-(--item-img-size) justify-around order-2 relative *:shrink-0">
				<li v-for="i in 6" :key="i">
					<button
						:disabled="!buildsIntoItems[i - 1]"
						:data-buyability="buildsIntoItems[i - 1]?.[1]"
						@mouseenter="buildsIntoItems[i - 1] && enterTooltipableElement($event, buildsIntoItems[i - 1]!)"
						@click="selectOrBuyIfDouble(buildsIntoItems[i - 1]!, true)"
						@click.right="rightClickItem($event, buildsIntoItems[i - 1]![0], buildsIntoItems[i - 1]![1])"
					>
						<span v-if="buildsIntoItems[i - 1]" class="sr-only">{{ buildsIntoItems[i - 1]![0].name }}</span>
						<img
							v-if="buildsIntoItems[i - 1]"
							:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${buildsIntoItems[i - 1]![0].image}`"
							:alt="buildsIntoItems[i - 1]![0].name"
							class="item-shop-item-img"
							width="64"
							height="64"
							aria-hidden="true"
							loading="lazy"
						>
					</button>
				</li>
				<li>
					<button
						v-if="buildsIntoItems.length <= 7"
						:disabled="!buildsIntoItems[6]"
						:data-buyability="buildsIntoItems[6]?.[1]"
						@click="selectOrBuyIfDouble(buildsIntoItems[6]!, true)"
						@click.right="rightClickItem($event, buildsIntoItems[6]![0], buildsIntoItems[6]![1])"
						@mouseenter="buildsIntoItems[6] && enterTooltipableElement($event, buildsIntoItems[6]!)"
					>
						<span v-if="buildsIntoItems[6]" class="sr-only">{{ buildsIntoItems[6][0].name }}</span>
						<img
							v-if="buildsIntoItems[6]"
							:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${buildsIntoItems[6][0].image}`"
							:alt="buildsIntoItems[6][0].name"
							class="item-shop-item-img"
							width="64"
							height="64"
							aria-hidden="true"
							loading="lazy"
						>
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
						<li v-for="shopItem in buildsIntoItems.slice(6)" :key="shopItem[0].id">
							<button
								:data-buyability="shopItem[1]"
								@mouseenter="enterTooltipableElement($event, shopItem)"
								@click="selectBuildsIntoMoreItem(shopItem)"
								@click.right="rightClickItem($event, shopItem[0], shopItem[1])"
							>
								<img
									:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem[0].image}`"
									:alt="shopItem[0].name"
									class="item-shop-item-img"
									width="64"
									height="64"
									aria-hidden="true"
									loading="lazy"
								>
								<span>{{ shopItem[0].name }}</span>
							</button>
						</li>
					</ul>
				</li>
			</ul>
			<h3 v-show="displayedItem" class="sr-only">
				{{ displayedItem?.[0].name }} build path
			</h3>
			<div id="item-shop-build-path" class="text-center flex basis-[40%] flex-col items-center justify-center order-3">
				<ItemBuildPathButton
					v-if="displayedItem"
					:shop-item="displayedItem"
					:is-selected="selectedItem?.[0].id === displayedItem[0].id"
					@click="selectItem(displayedItem, false)"
					@click.right="rightClickItem($event, displayedItem[0], displayedItem[1])"
					@mouseenter="enterTooltipableElement($event, displayedItem)"
				/>
				<ul
					v-if="displayedItemBuildsFrom?.length"
					class="grid grid-flow-col w-full"
					:class="{ 'auto-cols-[1fr]': !(displayedItemBuildPath2ndLevelItemCount >= 3 && displayedItemBuildPath3rdLevelHasTwo3Items) }"
				>
					<li
						v-for="(secondLevelBuildsFromItem, index) in displayedItemBuildsFrom"
						:key="`${displayedItem![0].id}-${secondLevelBuildsFromItem[0].id}-${index}`"
					>
						<ItemBuildPathButton
							:shop-item="secondLevelBuildsFromItem"
							:is-selected="selectedItem?.[0].id === secondLevelBuildsFromItem[0].id"
							@click="selectItem(secondLevelBuildsFromItem, false)"
							@click.right="rightClickItem($event, secondLevelBuildsFromItem[0], secondLevelBuildsFromItem[1])"
							@mouseenter="enterTooltipableElement($event, secondLevelBuildsFromItem)"
						/>
						<ul v-if="secondLevelBuildsFromItem[3].length" class="grid auto-cols-[1fr] grid-flow-col w-full">
							<li
								v-for="thirdLevelBuildsFromItem in secondLevelBuildsFromItem[3]"
								:key="`${displayedItem![0].id}-${secondLevelBuildsFromItem[0].id}-${thirdLevelBuildsFromItem[0].id}`"
							>
								<ItemBuildPathButton
									:shop-item="thirdLevelBuildsFromItem"
									:is-selected="selectedItem?.[0].id === thirdLevelBuildsFromItem[0].id"
									@click="selectItem(thirdLevelBuildsFromItem, false)"
									@click.right="rightClickItem($event, thirdLevelBuildsFromItem[0], thirdLevelBuildsFromItem[1])"
									@mouseenter="enterTooltipableElement($event, thirdLevelBuildsFromItem)"
								/>
							</li>
						</ul>
					</li>
				</ul>
			</div>
		</section>
		<footer style="grid-area: footer">
			<button>Sell</button>
			<button>Undo</button>
			<section id="item-shop-panel-eq" :data-pinned="inventoryPanelPinned || undefined">
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
						<li v-for="i in 6" :key="i">
							<component
								:is="targetShopItems?.[i - 1] ? 'button' : 'div'"
								:class="targetShopItems?.[i - 1] && targetShopItems[i - 1]![0].id === displayedItem?.[0].id ? 'selected' : undefined"
								@mouseenter="targetShopItems?.[i - 1] && enterTooltipableElement($event, targetShopItems[i - 1]!)"
								@click="targetShopItems?.[i - 1] && selectItem(targetShopItems[i - 1]!, true)"
								@click.right="targetShopItems?.[i - 1] && sellItem($event, i - 1)"
							>
								<span>{{ targetShopItems?.[i - 1]?.[0].name }}</span>
								<img
									v-if="targetShopItems?.[i - 1]"
									:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${targetShopItems[i - 1]![0].image}`"
									width="64"
									height="64"
									aria-hidden="true"
									loading="lazy"
								>
							</component>
						</li>
					</ul>
					<div>
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
		</footer>
		<div id="item-shop-hover-tooltip" ref="itemTooltip" popover="hint" class="hover-tooltip">
			<ItemDescription :item="hoveredItem?.[0]" :target="itemVariableCalculationTarget" header-subtitles />
		</div>
	</VDialog>
</template>

<style>
@layer components {
	:root {
		--item-img-size: 3.5rem;
	}

	[data-sprite-image] {
		--at-apply: object-none bg-no-repeat;
		background-position: calc(var(--txt-uv-start-x) * var(--txt-scale)) calc(var(--txt-uv-start-y) * var(--txt-scale));
	}

	#dialog-item-shop {
		--at-apply: 'bg-[--bg-clr] max-h-[80vh] max-w-[90vw] shadow-lg relative of-visible';
		--bg-clr: theme('colors.cyan.950');
		--item-button-img-b-w: 3px;

		&[open] {
			--at-apply: 'grid';
		}

		grid-template-areas:
			'header header builds-into'
			'aside items builds-into'
			'footer footer builds-into';
		grid-template-rows: auto 1fr auto;
		grid-template-columns: auto 1fr 32rem;
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

	#item-shop-stat-filters {
		label {
			--at-apply: cursor-pointer hover: brightness-200;
		}

		input,
		label > span {
			--at-apply: sr-only;
		}

		input {
			&:disabled + label,
			&:checked + label {
				--at-apply: hover: brightness-100;
			}

			&:focus-visible + label {
				--at-apply: brightness-200;
				outline: auto;
			}

			&:disabled + label {
				--at-apply: cursor-default;

				img {
					--at-apply: brightness-50;
				}
			}

			&:checked + label img {
				--txt-uv-start-x: var(--txt-selected-uv-start-x) !important;
				--txt-uv-start-y: var(--txt-selected-uv-start-y) !important;
			}
		}
	}

	#item-shop-search[data-empty='true'] ~ button {
		display: none;
	}

	#item-shop-panel-boots,
	#item-shop-panel-eq {
		--at-apply: 'bg-[--bg-clr]';

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
					background-image: url('https://raw.communitydragon.org/latest/game/assets/ux/minimap/pings/need_ward_gray.png');
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
		--at-apply: 'p-1 -m-1';

		> span:first-child {
			--at-apply: 'sr-only';
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
		--at-apply: 'size-12.5 min-w-12.5 m-0.75 text-xs text-center break-words';
	}

	#item-shop-panel-eq > div > ul > li > *,
	#item-shop-panel-eq > div > div,
	.item-shop-item-btn img,
	.item-shop-item-img {
		box-shadow:
			0 0 0 2px var(--inner-border, theme('colors.neutral.600')),
			0 0 0 var(--item-button-img-b-w) black;
	}

	#builds-into-more-list > li > button:is(:hover, :focus-visible),
	#item-shop-panel-eq > div > ul > li > button:is(:hover, :focus-visible, .selected),
	.item-shop-item-btn:is(:hover, :focus-visible, .selected) img,
	#item-shop-search-listbox > li:is(:hover, :focus-visible, .selected) img,
	.item-shop-item-img:hover {
		--inner-border: white;
	}

	#item-shop-builds-into-list > li > button {
		--at-apply: 'bg-black size-(--item-img-size) block';
	}

	#item-shop-builds-into-list > li:last-child {
		--at-apply: 'relative';
		anchor-name: --last-builds-into-button;
	}

	#builds-into-more-list {
		--at-apply: 'h-max max-h-[60vh] w-max of-y-auto z-10';
		position-anchor: --last-builds-into-button;
		inset-block-start: calc(anchor(bottom) + 2px);
		inset-inline-end: anchor(right);

		> li {
			> button {
				--at-apply: 'hoverable:bg-white/10 flex w-full items-center';
			}
		}
	}

	#item-shop-hover-tooltip {
		--at-apply: 'w-(--width) fixed';
		--width: 36rem;
		inset-inline-start: clamp(0px, var(--left), calc(100vw - min(100vw, var(--width))));
		inset-block-start: clamp(0px, var(--top), calc(100vh - min(100vh, var(--height))));
	}

	#builds-into-more-list > li > button,
	#item-shop-builds-into-list > li > button,
	.item-shop-item-btn {
		&[data-buyability='0'],
		&[data-buyability='-1'] {
			--at-apply: 'text-neutral-400';

			> img {
				--at-apply: 'brightness-60';
			}
		}
	}

	.item-shop-item-btn {
		&[data-buyability='-1'] {
			> span:last-of-type {
				--at-apply: 'relative text-transparent';

			&::before {
				--at-apply: 'content-empty absolute bottom-0 start-1/2 -translate-x-1/2 rounded-1/2 size-5 bg-neutral-900 b b-2 b-[--ui-button-border-clr] brightness-80';
					box-shadow: 0 2px 3px 2px theme('colors.black/0.45');
			}

			&::after {
				mask: var(--lock-icon-url) center / 100% 100% no-repeat;
					--at-apply: 'content-empty absolute bottom-0.75 start-1/2 -translate-x-1/2 size-3.5 bg-amber-100 saturate-60 brightness-80';
			}
			}

			&:hover > span:last-of-type {
				&::before {
					--at-apply: 'brightness-100';
				}

				&::after {
					--at-apply: 'bg-white saturate-100 brightness-100';
				}
			}
		}
	}
}
</style>
