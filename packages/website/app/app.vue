<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'en' } });
useSeoMeta({
	title: 'Collector - League of Legends Damage Calculator',
});

const { version, champions } = useChampions();

const itemShopDialog = useTemplateRef('itemShopDialog');

const selectedChampionId = ref<IChampionId>();
const selectedChampionLevel = ref(1);
const selectedChampionItems = ref<IItem[]>([]);

const selectedChampion = computed(() => selectedChampionId.value ? champions[selectedChampionId.value] : undefined);
const stats = computed(() => selectedChampion.value
	? useChampionStats(selectedChampion.value, selectedChampionLevel.value, selectedChampionItems.value)
	: undefined);

function addItem(item: IItem) {
	if (selectedChampionItems.value.length < 6) {
		selectedChampionItems.value.push(markRaw(item));
	}
}
</script>

<template>
	<main>
		<p>
			current patch: {{ version }}
		</p>

		<label for="selected-champion">Selected champion: </label>
		<select id="selected-champion" v-model="selectedChampionId" class="*:text-black *:hover:text-black">
			<option v-for="champion in champions" :key="champion.id" :value="champion.id">
				{{ champion.name }}
			</option>
		</select>
		<label for="selected-champion-level">Level: </label>
		<select id="selected-champion-level" v-model="selectedChampionLevel" class="*:text-black *:hover:text-black">
			<option v-for="i in 18" :key="i" :value="i">
				{{ i }}
			</option>
		</select>
		<button @click="itemShopDialog?.open()">
			item shop
		</button>
		<DialogItemShop ref="itemShopDialog" @select-item="addItem" />
		<button
			v-for="i in 6"
			:key="i"
			class="border-gray-7 border size-8 inline-block"
			@click.right.prevent="selectedChampionItems.splice(i - 1, 1)"
		>
			<img
				v-if="selectedChampionItems[i - 1]"
				:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${selectedChampionItems[i - 1]!.image.full}`"
				:title="selectedChampionItems[i - 1]!.name"
				width="64"
				height="64"
			>
		</button>

		<br>

		<div v-if="selectedChampion">
			<img
				:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${selectedChampion.image.full}`"
				width="128"
				height="128"
			>
			<code class="whitespace-pre">
				{{ JSON.stringify(stats, null, 2) }}
			</code>
		</div>
	</main>
</template>
