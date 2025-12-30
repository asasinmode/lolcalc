<script setup lang="ts">
const emit = defineEmits<{
	buyItem: [item: IItem];
}>();

type IAllItemCategory = IItemCategory | 'all';

const { version } = usePatchVersion();
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

const sortedByPriceForMap = computed(() => Object
	.values(items)
	.sort((a, b) => a.gold.total - b.gold.total)
	.filter(item => (item.mapMask & mapMask.value) !== 0));
const filteredByCategory = computed(() =>
	selectedCategory.value === 'all'
		? sortedByPriceForMap.value
		: sortedByPriceForMap.value.filter(item => item.categories?.[selectedCategory.value as IItemCategory]),
);
const filteredByStats = computed(() => {
	const filterFunctions = Object.entries(appliedStatFilters.value).filter(([, isEnabled]) => isEnabled).map(([filter]) => ITEM_SHOP_STAT_FILTERS[filter as IItemShopStatFilter].filter);

	return filterFunctions.length ? filteredByCategory.value.filter(item => filterFunctions.every(f => f(item))) : filteredByCategory.value;
});
const groupedByEpicness = computed(() => filteredByStats.value.reduce((acc, item) => {
	const { epicness = 0 } = item;

	if (item.isBoots && epicness !== 7) {
		return acc;
	}

	if (acc[epicness]) {
		acc[epicness].push(item);
		return acc;
	}

	return { ...acc, [epicness]: [item] };
}, {} as Record<number, IItem[]>));

const availableStatFilters = computed(() => Object.fromEntries(
	Object.entries(ITEM_SHOP_STAT_FILTERS).map(([filter, { filter: filterFunction }]) => [
		filter,
		appliedStatFilters.value[filter as IItemShopStatFilter] || filteredByStats.value.some(filterFunction),
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

const selectedItem = shallowRef<IItem>();
const displayedItem = shallowRef<IItem>();

function selectItem(item: IItem, overwriteDisplayed: boolean) {
	selectedItem.value = item;
	if (overwriteDisplayed) {
		displayedItem.value = item;
	}
}

function buyItem(item: IItem) {
	emit('buyItem', item);
}

function rightClickItem(event: MouseEvent, item: IItem) {
	!event.shiftKey && buyItem(item);
}

const search = ref('');
const searchInput = useTemplateRef('searchInput');
const searchResultsContainer = useTemplateRef('searchResultsContainer');
const searchExpanded = ref(false);
const searchCursoredOverIndex = ref<number>();
const searchSelectedIndex = ref<number>();

const searchResults = computed(() => {
	if (!search.value) {
		return [];
	}

	const splitSearch = search.value.toLocaleLowerCase().replaceAll(/[^a-z ]/g, '').split(' ').filter(v => v);
	return sortedByPriceForMap.value.filter(item => splitSearch.every(word => item.searchString.includes(word)));
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
		selectedItem.value = item;
		searchCursoredOverIndex.value = undefined;
		buyItem(item);
		closeSearch();
		searchInput.value?.blur();
	} else {
		searchCursoredOverIndex.value = index;
		searchSelectedIndex.value = index;
		displayedItem.value = item;
		selectedItem.value = item;
	}
}

function searchCursorOver(index?: number) {
	searchCursoredOverIndex.value = index;
}

function closeSearchIfOutside(event: FocusEvent) {
	const target = event.relatedTarget as HTMLElement | null;
	if (!target || !searchResultsContainer.value?.contains(target)) {
		// closeSearch();
	}
}

function onSearchKeydown(event: KeyboardEvent) {
	const resultsLength = searchResults.value.length;
	switch (event.key) {
		case 'Enter': {
			if (searchCursoredOverItem.value) {
				buyItem(searchCursoredOverItem.value);
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
				scrollSearchResultIntoView(searchCursoredOverIndex.value);
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
				scrollSearchResultIntoView(searchCursoredOverIndex.value);
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

function scrollSearchResultIntoView(index: number) {
	document.getElementById(`item-shop-search-result-${index}`)?.scrollIntoView({ block: 'nearest' });
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog
		id="dialog-item-shop"
		ref="vDialog"
		class="bg-cyan-950 max-h-[80vh] w-[min(60vw,64rem)] shadow-lg relative of-visible [&[open]]-grid"
		@close="closeSearch"
		@contextmenu.prevent=""
	>
		<header style="grid-area: header;" class="bg-inherit grid col-span-2 auto-rows-min grid-cols-[1fr_auto] items-center">
			<h1 class="col-span-full">
				Item shop
			</h1>
			<form method="dialog" class="right-0 top-0 absolute" autofocus>
				<button value="cancel" title="Close">
					<Icon name="ph:x" class="size-6" />
					<span class="sr-only">
						close
					</span>
				</button>
			</form>
			<div class="col-span-full" data-inline-search-label="" @focusout="closeSearchIfOutside">
				<input
					id="item-shop-search"
					ref="searchInput"
					v-model="search"
					type="text"
					class="py-0.5 pl-8 pr-2 b bg-black w-full"
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
					<Icon name="ph:magnifying-glass-bold" class="mr-2 size-4" />
					<span>
						Click Here to Search
					</span>
				</label>
				<button class="px-2 grid h-full right-0 top-0 place-items-center absolute" @mousedown.prevent="clearSearch">
					<span class="sr-only">
						Clear
					</span>
					<Icon name="ph:x" class="size-4" />
				</button>
				<div
					v-show="searchExpanded"
					ref="searchResultsContainer"
					class="bg-blue-950 grid grid-flow-col grid-cols-[auto_1fr] grid-rows-[auto_1fr] h-[50vh] w-full translate-y-full bottom-0 left-0 absolute"
					@mousedown.prevent=""
				>
					<p id="item-shop-results-lbl">
						Results
					</p>
					<ul
						id="item-shop-search-listbox"
						role="listbox"
						aria-labelledby="item-shop-results-lbl"
						class="bg-blue-950 h-full of-y-auto *:grid *:grid-cols-[auto_1fr] *:grid-rows-2"
					>
						<li
							v-for="(item, index) in searchResults"
							:id="`item-shop-search-result-${index}`"
							:key="item.id"
							role="option"
							class="hover:bg-white/10"
							:class="{
								'bg-white/10': searchSelectedIndex === index,
							}"
							@mousedown.stop.prevent="selectSearchResult($event, index)"
						>
							<img
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image}`"
								:alt="`${item.name} icon`"
								width="64"
								height="64"
								:class="{ b: searchCursoredOverIndex !== undefined ? searchCursoredOverIndex === index : false }"
								class="row-span-full"
								aria-hidden="true"
								loading="lazy"
							>
							{{ item.name }}
							<span>{{ item.gold.total }}</span>
						</li>
					</ul>
					<section
						aria-live="polite"
						aria-atomic="true"
						class="bg-pink-950 row-span-full"
					>
						<ItemDescription
							:item="searchCursoredOverItem"
							header-class="hoverable:bg-white/10"
							header-button
							@header-click="selectItem(searchCursoredOverItem!, true)"
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
				<img v-bind="textureBgImageAttrs(ui.shop.swapItemOrder, 32)">
				<span class="sr-only">Swap item order</span>
			</button>
		</header>
		<aside style="grid-area: aside;" class="row-start-2">
			<button id="item-shop-clear-stat-filters" title="Clear stat filters" @click="clearStatFilters">
				<img v-bind="textureBgImageAttrs(ui.shop.clearFilters, 28)">
				<span class="sr-only">Clear stat filters</span>
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
		<section style="grid-area: items;" class="overflow-y-auto">
			<h2 class="sr-only" aria-live="polite">
				{{ selectedCategory }} items
			</h2>
			<section
				v-for="[epicness, epicnessName] in computedEpicnesses"
				:key="epicness"
				class="grid auto-rows-min grid-cols-[repeat(auto-fit,_minmax(4rem,_1fr))]"
			>
				<h3 class="col-span-full">
					{{ epicnessName }}
				</h3>
				<button
					v-for="item in groupedByEpicness[epicness]"
					:key="item.id"
					class="leading-tight text-center min-w-0 block hyphens-auto"
					@mousedown.left="selectItem(item, true)"
					@mousedown.right="rightClickItem($event, item)"
					@keydown.space="selectItem(item, true)"
					@keydown.enter="buyItem(item)"
				>
					<span class="sr-only">{{ item.name }}</span>
					<img
						:title="item.name"
						:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image}`"
						:alt="`${item.name} icon`"
						class="w-full"
						width="64"
						height="64"
						aria-hidden="true"
						loading="lazy"
					>
					{{ item.gold.total }}
				</button>
			</section>
		</section>
		<section style="grid-area: builds-into" class="flex flex-col">
			<ItemDescription :item="selectedItem" header-class="order-5" description-class="order-6" />
			<button :disabled="!selectedItem" class="order-4" @click="buyItem(selectedItem!)">
				Purchase
			</button>
			<h3 class="order-1">
				Builds into
			</h3>
			<div class="flex gap-3 order-2">
				<button v-for="i in 7" :key="i" class="bg-black size-9 truncate" :disabled="!selectedItem?.into?.[i - 1]">
					{{ selectedItem?.into?.[i - 1] || '' }}
				</button>
			</div>
			<div class="whitespace-pre order-3">
				{{ selectedItem?.image }}
				{{ selectedItem?.from ? JSON.stringify(selectedItem.from, null, 2) : '' }}
			</div>
		</section>
		<footer style="grid-area: footer">
			<button>Sell</button>
			<button>Undo</button>
		</footer>
	</VDialog>
</template>

<style>
@layer components {
	[data-sprite-image] {
		@apply object-none bg-no-repeat;
		background-position: calc(var(--txt-uv-start-x) * var(--txt-scale)) calc(var(--txt-uv-start-y) * var(--txt-scale));
	}

	#dialog-item-shop {
		grid-template-areas:
			'header header builds-into'
			'aside items builds-into'
			'footer footer builds-into';
		grid-template-rows: auto 1fr auto;
		grid-template-columns: auto 1fr auto;
	}

	#item-shop-stat-filters {
		label {
			@apply cursor-pointer hover:brightness-200;
		}

		input,
		label > span {
			@apply sr-only;
		}

		input {
			&:disabled + label,
			&:checked + label {
				@apply hover:brightness-100;
			}

			&:focus-visible + label {
				@apply brightness-200;
				outline: auto;
			}

			&:disabled + label {
				@apply cursor-default;

				img {
					@apply brightness-50;
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
}
</style>
