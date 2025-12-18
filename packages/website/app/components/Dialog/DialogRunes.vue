<script setup lang="ts">
const value = defineModel<IChampionRunes>({ required: true });

const vDialog = useTemplateRef('vDialog');

const { runes } = useRunes();

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog ref="vDialog" class="px-3 pb-2 bg-cyan-950 shadow-lg">
		<header class="py-2 pb-2 bg-inherit flex col-span-full items-center top-0 sticky">
			<form method="dialog" class="ml-auto">
				<button autofocus value="cancel">
					close
				</button>
			</form>
		</header>
		<select v-model="value.shards.offensive" class="block">
			<option v-for="(_, runeValue) in runes.shards.offensive" :key="runeValue" :value="runeValue">
				{{ value }}
			</option>
		</select>
		<select v-model="value.shards.flex" class="block">
			<option v-for="(_, runeValue) in runes.shards.flex" :key="runeValue" :value="runeValue">
				{{ runeValue }}
			</option>
		</select>
		<select v-model="value.shards.defensive" class="block">
			<option v-for="(_, runeValue) in runes.shards.defensive" :key="runeValue" :value="runeValue">
				{{ runeValue }}
			</option>
		</select>
	</VDialog>
</template>
