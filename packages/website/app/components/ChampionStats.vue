<script setup lang="ts">
// TODO TMP for hot reload preservation
const props = defineProps<{
	champion?: IChampion;
	items: IItem[];
	runes: IChampionRunes;
	level: number;
}>();

const version = usePatchVersion();
const stats = computed(() => props.champion ? useChampionStats(props.champion, props.level, props.items, props.runes) : undefined);

defineExpose({ value: stats });
</script>

<template>
	<div>
		<img
			v-if="champion"
			:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`"
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
			<a :href="`https://wiki.leagueoflegends.com/en-us/${champion!.name.replaceAll(' ', '_')}`" target="_blank" class="text-blue">
				wiki
			</a>
			<div class="flex gap-3 *:pr-2 *:border-r *:border-r-gray *:whitespace-pre last:*:pr-0 last:*:border-r-0">
				<code>
					total: {{ JSON.stringify(stats.totalStats, null, 2) }}
				</code>
				<code>
					item: {{ JSON.stringify(stats.itemStats, null, 2) }}
				</code>
				<code>
					base,level,runes: {{ JSON.stringify(stats.levelAndRunesStats, null, 2) }}
				</code>
				<code>
					base: {{ JSON.stringify(stats.baseStats, null, 2) }}
				</code>
				<code>
					level: {{ JSON.stringify(stats.levelStats, null, 2) }}
				</code>
				<code>
					rune shards: {{ JSON.stringify(stats.runeShardStats, null, 2) }}
				</code>
			</div>
		</template>
	</div>
</template>
