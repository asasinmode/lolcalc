<script setup lang="ts">
import { data as champions, version } from '~/assets/champion.json';

useSeoMeta({
	title: 'Collector - League of Legends Damage Calculator',
});

const selectedChampionId = ref<keyof typeof champions>();
const selectedChampion = computed(() => selectedChampionId.value ? champions[selectedChampionId.value] : undefined);
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
		<br>
		<code class="whitespace-pre">
			{{ JSON.stringify(selectedChampion || {}, null, 2) }}
		</code>
	</main>
</template>
