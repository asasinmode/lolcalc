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
// TODO make array
const selectedStat = ref<IItemShopStatFilter>();
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
const groupedByEpicness = computed(() => filteredByCategory.value.reduce((acc, item) => {
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

function closeCleanup() {
	search.value = '';
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-item-shop" ref="vDialog" class="bg-cyan-950 auto-rows-min grid-cols-[auto_1fr] max-h-[80vh] shadow-lg of-y-auto [&[open]]-grid" @close="closeCleanup">
		<header class="bg-inherit flex col-span-full items-center top-0 sticky">
			<VButtonRadiogroup
				id="item-shop-category-filter"
				v-model="selectedCategory"
				label="Category"
				:options="['all', ...ALL_ITEM_CATEGORIES].map((category) => ({ category: category as IAllItemCategory, texture: ui.shop.categories[category as IAllItemCategory] }))"
				value-key="category"
				required
			>
				<template #default="{ option: { category, texture }, isSelected }">
					<img
						v-bind="textureBgImageAttrs(texture, `https://raw.communitydragon.org/${minorVersion}/game/${texture.spriteSheet}`)"
						class="object-none"
						:class="{ 'bg-pink': isSelected }"
					>
					<span class="sr-only">{{ category }}</span>
				</template>
			</VButtonRadiogroup>
			<div class="relative">
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
			<form method="dialog" class="ml-auto">
				<button value="cancel">
					close
				</button>
			</form>
		</header>
		<aside :style="`grid-row: 2 / span ${Object.keys(groupedByEpicness).length}`">
			<!-- TODO clear stat filters -->
			<button id="item-shop-clear-stat-filters" title="Clear stat filters">
				<img
					v-bind="textureBgImageAttrs(ui.shop.clearFilters, `https://raw.communitydragon.org/${minorVersion}/game/${ui.shop.clearFilters.spriteSheet}`)"
					class="object-none"
				>
				<span class="sr-only">Clear stat filters</span>
			</button>
			<VButtonRadiogroup
				id="item-shop-stat-filter"
				v-model="selectedStat"
				label="Stats"
				:options="Object.entries(ITEM_SHOP_STAT_FILTERS).map(([filter, { name }]) => ({ filter: filter as IItemShopStatFilter, name, texture: ui.shop.stats[filter as IItemShopStatFilter] }))"
				value-key="filter"
				title-key="name"
				class="flex flex-col"
			>
				<template #default="{ option: { name, texture }, isSelected }">
					<img
						v-bind="textureBgImageAttrs(texture, `https://raw.communitydragon.org/${minorVersion}/game/${texture.spriteSheet}`)"
						class="object-none"
						:class="{ 'bg-pink': isSelected }"
					>
					<span class="sr-only">{{ name }}</span>
				</template>
			</VButtonRadiogroup>
		</aside>
		<section
			v-for="[epicness, epicnessName] in ITEM_EPICNESSES.filter(([epicness]) => groupedByEpicness[epicness]?.length)"
			:key="epicness"
			class="grid grid-cols-[repeat(auto-fit,_minmax(4rem,_1fr))]"
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
#item-shop-category-filter img,
#item-shop-clear-stat-filters img,
#item-shop-stat-filter img {
	background-repeat: no-repeat;
	object-position: var(--txt-width, 64px) var(--txt-height, 64px);
}
</style>
