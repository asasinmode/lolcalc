<script setup lang="ts">
defineEmits<{
	selectItem: [item: IItem];
}>();

type IAllItemCategory = IItemCategory | 'all';

const { version, minorVersion } = usePatchVersion();
const items = useItems();
const maps = useMaps();
const ui = useUi();

const vDialog = useTemplateRef('vDialog');
const mapMask = ref<number>(maps.sr.mask);
const selectedItem = shallowRef<IItem>();
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
})) as unknown as Record<IItemShopStatFilter, { name: string; texture: ITexture; selectedUvStartX: number; selectedUvStartY: number }>);

const computedEpicnesses = computed(() => (sortOrderSwapped.value
	? ITEM_EPICNESSES.toReversed()
	: ITEM_EPICNESSES).filter(([epicness]) => groupedByEpicness.value[epicness]?.length));

function clearStatFilters() {
	for (const key in ITEM_SHOP_STAT_FILTERS) {
		appliedStatFilters.value[key as IItemShopStatFilter] = false;
	}
}

const search = ref('');
const searchListbox = useTemplateRef('searchListbox');
const searchExpanded = ref(false);
const searchCursoredOverIndex = ref<number>();

const searchResults = computed(() => {
	if (!search.value) {
		return [];
	}

	const splitSearch = search.value.toLocaleLowerCase().replaceAll(/[^a-z]/g, '').split(' ').filter(v => v);
	return sortedByPriceForMap.value.filter(item => splitSearch.every(word => item.name.replaceAll(/['. ]/g, '').toLocaleLowerCase().includes(word)));
});

function closeSearch() {
	search.value = '';
	searchExpanded.value = false;
	searchCursoredOverIndex.value = 0;
}

function closeCleanup() {
	search.value = '';
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-item-shop" ref="vDialog" class="bg-cyan-950 max-h-[80vh] shadow-lg relative of-visible [&[open]]-grid" @close="closeCleanup">
		<header style="grid-area: header;" class="bg-inherit grid col-span-2 auto-rows-min grid-cols-[1fr_auto_auto] items-center">
			<h1 class="col-span-full">
				Item shop
			</h1>
			<form method="dialog" class="right-0 top-0 absolute">
				<button value="cancel">
					close
				</button>
			</form>
			<div class="col-span-full" data-inline-search-label="">
				<input
					id="item-shop-search"
					v-model="search"
					autofocus
					type="text"
					class="py-0.5 pl-8 pr-2 b bg-black"
					role="combobox"
					autocomplete="list"
					:aria-expanded="searchExpanded"
					aria-controls="item-shop-search-listbox"
					:data-empty="!search"
					@focus="searchExpanded = true"
					@focusout="closeSearch"
				>
				<label id="item-shop-search-lbl" for="item-shop-search" class="px-2 py-0.5 b b-transparent">
					<Icon name="ph:magnifying-glass-bold" class="mr-2 size-4" />
					<span>
						Click Here to Search
					</span>
				</label>
				<div
					v-show="searchExpanded"
					class="bg-blue-950 absolute"
				>
					<p id="item-shop-results-lbl">
						Results
					</p>
					<ul
						id="item-shop-search-listbox"
						ref="searchListbox"
						role="listbox"
						aria-labelledby="item-shop-results-lbl"
						class="bg-blue-950 absolute"
					>
						<li
							v-for="item in searchResults"
							:key="item.id"
						>
							{{ item.name }}
						</li>
					</ul>
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
			<VButtonRadiogroup
				id="item-shop-map-filter"
				v-model="mapMask"
				:options="Object.values(maps)"
				value-key="mask"
				title-key="name"
				label="Map"
				required
			>
				<template #default="{ option, isSelected }">
					<img
						:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets/${option.iconDirUrl}/img/${isSelected ? 'game-select-icon-active' : 'icon-empty'}.png`"
						:width="isSelected ? 100 : 200"
						:height="isSelected ? 100 : 200"
						class="size-5"
					>
					<span class="sr-only">{{ option.name }}</span>
				</template>
			</VButtonRadiogroup>
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
			<h2 class="sr-only">
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
					@click.left="selectedItem = item"
					@click.right="$emit('selectItem', item)"
				>
					<img
						:title="item.name"
						:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`"
						:alt="`${item.name} icon`"
						class="w-full"
						width="64"
						height="64"
						loading="lazy"
					>
					{{ item.gold.total }}
				</button>
			</section>
		</section>
		<section style="grid-area: builds-into" class="flex flex-col">
			<h2 class="grid grid-flow-col grid-cols-[auto_1fr] grid-rows-2 order-5">
				<img
					v-if="selectedItem"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${selectedItem.image.full}`"
					:alt="`${selectedItem.name} icon`"
					width="64"
					height="64"
					class="row-span-full"
				>
				{{ selectedItem?.name }}
				<span>{{ selectedItem?.gold.total }}</span>
			</h2>
			<button :disabled="!selectedItem" class="order-4" @click="$emit('selectItem', selectedItem!)">
				Purchase
			</button>
			<h3 class="order-1">
				Builds into
			</h3>
			<div class="flex gap-3 order-2">
				<button v-for="i in 7" :key="i" class="bg-black size-9 truncate">
					{{ selectedItem?.into?.[i - 1] || '' }}
				</button>
			</div>
			<div class="whitespace-pre order-3">
				{{ selectedItem?.image.full }}
				{{ selectedItem?.from ? JSON.stringify(selectedItem.from, null, 2) : '' }}
			</div>
			<p class="order-6">
				<template v-for="(statValue, statName) in selectedItem?.stats" :key="statName">
					<span>{{ statName }}: {{ statValue }}</span>
					<br>
				</template>
			</p>
		</section>
		<footer style="grid-area: footer">
			<button>Sell</button>
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
}
</style>
