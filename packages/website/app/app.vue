<script setup lang="ts">
import { data as champions, version } from '~/assets/champion.json';

useSeoMeta({
	title: 'Collector - League of Legends Damage Calculator',
});
</script>

<template>
	<main>
		current patch: {{ version }}

		<section>
			<button
				v-for="champion in champions"
				:key="champion.id"
			>
				{{ champion.name }}
			</button>
		</section>
	</main>
</template>
