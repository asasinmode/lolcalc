<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'en' } });
useSeoMeta({
	title: 'Collector - League of Legends Damage Calculator',
});

const champions = useChampions();
const version = usePatchVersion();

const itemShopDialog = useTemplateRef('itemShopDialog');
const runeDialog = useTemplateRef('runeDialog');

const selectedChampionId = ref<IChampionId>();
const selectedChampionLevel = ref(1);
const selectedChampionItems = ref<IItem[]>([]);
const selectedChampionRunes = ref<IChampionRunes>({
	shards: {
		offensive: 'percentAttackSpeed',
		flex: 'adaptiveForce',
		defensive: 'flatHealth',
	},
});

const selectedChampion = computed(() => selectedChampionId.value ? champions[selectedChampionId.value] : undefined);

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
		<select id="selected-champion" v-model="selectedChampionId">
			<option v-for="champion in champions" :key="champion.id" :value="champion.id">
				{{ champion.name }}
			</option>
		</select>
		<label for="selected-champion-level">Level: </label>
		<select id="selected-champion-level" v-model="selectedChampionLevel">
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
		<button @click="runeDialog?.open()">
			runes {{ Object.values(selectedChampionRunes.shards) }}
		</button>
		<DialogRunes ref="runeDialog" v-model="selectedChampionRunes" />

		<ChampionStats
			:champion="selectedChampion"
			:level="selectedChampionLevel"
			:items="selectedChampionItems"
			:runes="selectedChampionRunes"
		/>
	</main>
</template>
