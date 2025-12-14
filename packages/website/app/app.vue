<script setup lang="ts">
import { data as champions } from '~/assets/champion.json';

useSeoMeta({
	title: 'Collector - League of Legends Damage Calculator',
});

const version = usePatchVersion();

const selectedChampionId = ref<keyof typeof champions>();
const selectedChampion = computed(() => selectedChampionId.value ? champions[selectedChampionId.value] : undefined);
const selectedChampionLevel = ref(1);
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

		<br>

		<div v-if="selectedChampion">
			<img
				:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${selectedChampion.image.full}`"
				width="128"
				height="128"
			>
			<code class="whitespace-pre">
				{{ JSON.stringify(selectedChampion, null, 2) }}
			</code>
		</div>
	</main>
</template>
