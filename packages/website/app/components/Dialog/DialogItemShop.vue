<script setup lang="ts">
// TODO top right map select, sr/aram
defineEmits<{
	selectItem: [item: IItem];
}>();

const { version, items } = useItems();

const vDialog = useTemplateRef('vDialog');
const search = ref('');

const sortedByPrice = computed(() => Object.values(items).sort((a, b) => a.gold.total - b.gold.total));
const computedItems = computed(() => {
	const splitSearch = search.value.split(' ').filter(v => v);

	return search.value
		? sortedByPrice.value.filter(item => splitSearch.every(word => item.name.toLocaleLowerCase().includes(word)))
		: sortedByPrice.value;
});

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog ref="vDialog" class="px-3 pb-2 bg-cyan-950 grid-cols-[repeat(auto-fit,_minmax(4rem,_1fr))] max-h-[80vh] w-xl shadow-lg of-y-auto [&[open]]-grid">
		<header class="py-2 pb-2 bg-inherit flex col-span-full items-center top-0 sticky">
			<label for="item-shop-search">Search</label>
			<input id="item-shop-search" v-model="search" class="ml-2 bg-black">
			<form method="dialog" class="ml-auto">
				<button autofocus value="cancel">
					close
				</button>
			</form>
		</header>
		<button
			v-for="item in computedItems"
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
	</VDialog>
</template>
