<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'en' } });
useSeoMeta({
	title: 'Collector - League of Legends Damage Calculator',
});

const { version, champions } = useChampions();

const itemShopDialog = useTemplateRef('itemShopDialog');
const runeDialog = useTemplateRef('runeDialog');

const selectedChampionId = ref<IChampionId>();
const selectedChampionLevel = ref(1);
const selectedChampionItems = ref<IItem[]>([]);
const selectedChampionMiniRunes = ref<IMiniRunes>({
	slot1: 'adaptive',
	slot2: 'adaptive',
	slot3: 'instantHealth',
});

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
			runes {{ Object.values(selectedChampionMiniRunes) }}
		</button>
		<DialogRunes ref="runeDialog" v-model="selectedChampionMiniRunes" />

		<div>
			<img
				v-if="selectedChampion"
				:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${selectedChampion.image.full}`"
				width="128"
				height="128"
				class="size-32"
			>
			<img
				v-else
				src="https://cdn.communitydragon.org/latest/champion/generic/square"
				width="256"
				height="256"
				class="size-32"
			>
			<template v-if="stats">
				<a :href="`https://wiki.leagueoflegends.com/en-us/${selectedChampion!.name.replaceAll(' ', '_')}`" target="_blank" class="text-blue">
					wiki
				</a>
				<div class="flex gap-3 *:pr-2 *:border-r *:border-r-gray last:*:pr-0 last:*:border-r-0">
					<code class="whitespace-pre">
						total: {{ JSON.stringify(stats.totalStats, null, 2) }}
					</code>
					<code class="whitespace-pre">
						item: {{ JSON.stringify(stats.itemStats, null, 2) }}
					</code>
					<code class="whitespace-pre">
						base + level: {{ JSON.stringify(stats.baseOnLevelStats, null, 2) }}
					</code>
					<code class="whitespace-pre">
						level: {{ JSON.stringify(stats.levelStats, null, 2) }}
					</code>
					<code class="whitespace-pre">
						base: {{ JSON.stringify(stats.baseStats, null, 2) }}
					</code>
				</div>
			</template>
		</div>
	</main>
</template>
