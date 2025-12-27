<script setup lang="ts">
defineEmits<{
	selectItem: [item: IItem];
}>();

type IAllItemCategory = IItemCategory | 'all';

const items = useItems();
const maps = useMaps();
const ui = useUi();
const { version, minorVersion } = usePatchVersion();

const vDialog = useTemplateRef('vDialog');
const mapMask = ref<number>(maps.sr.mask);
const selectedCategory = ref<IAllItemCategory>('all');
const sortOrderSwapped = ref(false);
const appliedStatFilters = ref<Record<IItemShopStatFilter, boolean>>(Object.fromEntries(
	Object.entries(ITEM_SHOP_STAT_FILTERS).map(([name]) => [name, false]),
) as Record<IItemShopStatFilter, boolean>);
const search = ref('');

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
const searchedItems = computed(() => {
	const splitSearch = search.value.toLocaleLowerCase().split(' ').filter(v => v);

	return search.value
		? sortedByPriceForMap.value.filter(item => splitSearch.every(word => item.name.replaceAll(/['. ]/g, '').toLocaleLowerCase().includes(word)))
		: sortedByPriceForMap.value;
});

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
		texture: textureBgImageAttrs(texture),
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

function closeCleanup() {
	search.value = '';
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-item-shop" ref="vDialog" class="bg-cyan-950 auto-rows-min grid-cols-[auto_1fr] max-h-[80vh] shadow-lg of-y-auto [&[open]]-grid" @close="closeCleanup">
		<header class="bg-inherit grid col-span-full grid-cols-[1fr_auto_auto] grid-rows-[min-content_min-content] items-center top-0 sticky z-10">
			<form method="dialog" class="col-start-3 row-start-1">
				<button value="cancel">
					close
				</button>
			</form>
			<div class="col-span-2 col-start-1 row-start-1 relative">
				<label for="item-shop-search">Click Here to Search</label>
				<input
					id="item-shop-search"
					v-model="search"
					autofocus
					class="ml-2 bg-black"
					placeholder="Click Here to Search"
				>
			</div>
			<VButtonRadiogroup
				id="item-shop-category-filter"
				v-model="selectedCategory"
				class="row-start-2"
				label="Category"
				:options="['all', ...ALL_ITEM_CATEGORIES].map((category) => ({ category: category as IAllItemCategory, texture: ui.shop.categories[category as IAllItemCategory] }))"
				value-key="category"
				required
			>
				<template #default="{ option: { category, texture }, isSelected }">
					<img
						v-bind="textureBgImageAttrs(texture)"
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
				<img
					v-bind="textureBgImageAttrs(ui.shop.swapItemOrder, '--fluid-32-32')"
				>
				<span class="sr-only">Swap item order</span>
			</button>
		</header>
		<aside :style="`grid-row: 2 / span ${Object.keys(groupedByEpicness).length}`">
			<button id="item-shop-clear-stat-filters" title="Clear stat filters" @click="clearStatFilters">
				<img
					v-bind="textureBgImageAttrs(ui.shop.clearFilters)"
				>
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
		<section
			v-for="[epicness, epicnessName] in computedEpicnesses"
			:key="epicness"
			class="grid auto-rows-min grid-cols-[repeat(auto-fit,_minmax(4rem,_1fr))]"
		>
			<h2 class="col-span-full">
				{{ epicnessName }}
			</h2>
			<button
				v-for="item in groupedByEpicness[epicness]"
				:key="item.id"
				class="leading-tight text-center min-w-0 block hyphens-auto"
				@click="$emit('selectItem', item)"
			>
				<img
					:title="item.name"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`"
					class="w-full"
					width="64"
					height="64"
					loading="lazy"
				>
				{{ item.gold.total }}
			</button>
		</section>
	</VDialog>
</template>

<style>
[data-sprite-image] {
	@apply object-none bg-no-repeat;
	object-position: var(--txt-width) var(--txt-height);
	background-position: var(--txt-uv-start-x) var(--txt-uv-start-y);
	margin: calc(-0.5 * (var(--txt-width) - var(--target-size, var(--txt-width))))
		calc(-0.5 * (var(--txt-height) - var(--target-size, var(--txt-width))));
	scale: calc(var(--target-size, var(--txt-width)) / var(--txt-width))
		calc(var(--target-size, var(--txt-height)) / var(--txt-height));
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
		&:disabled + label {
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
			background-position: var(--txt-selected-uv-start-x) var(--txt-selected-uv-start-y);
		}
	}
}
</style>
