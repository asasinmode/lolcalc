<script setup lang="ts">
const runes = useRunes();

const value = defineModel<IChampionRunes>();
const vDialog = useTemplateRef('vDialog');

const defaultRunes: IChampionRunes = {
	shards: {
		offensive: 'adaptiveForce',
		flex: 'adaptiveForce',
		defensive: 'flatHealth',
	},
};

type PathTuple<T, K extends keyof T = keyof T>
	= | [K]
		| (K extends any ? (T[K] extends object ? [K, ...PathTuple<T[K]>] : [K]) : never);

function updateValue<P extends PathTuple<IChampionRunes>>(
	path: P,
	event: Event,
) {
	if (value.value) {
		const lastKey = path.at(-1);
		let reference = value.value[path[0]!];
		for (const key of path.slice(1, -1)) {
			// @ts-expect-error reference navigating should be ok
			reference = reference[key];
		}
		// @ts-expect-error key/value should be fine
		reference[lastKey] = (event.target as HTMLSelectElement).value;
	}
}

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
		<select
			:value="value?.shards.offensive ?? defaultRunes.shards.offensive"
			class="block"
			@change="updateValue(['shards', 'offensive'], $event)"
		>
			<option v-for="(_, shardName) in runes.shards.offensive" :key="shardName" :value="shardName">
				{{ shardName }}
			</option>
		</select>
		<select
			:value="value?.shards.flex ?? defaultRunes.shards.flex"
			class="block"
			@change="updateValue(['shards', 'flex'], $event)"
		>
			<option v-for="(_, shardName) in runes.shards.flex" :key="shardName" :value="shardName">
				{{ shardName }}
			</option>
		</select>
		<select
			:value="value?.shards.defensive ?? defaultRunes.shards.defensive"
			class="block"
			@change="updateValue(['shards', 'defensive'], $event)"
		>
			<option v-for="(_, shardName) in runes.shards.defensive" :key="shardName" :value="shardName">
				{{ shardName }}
			</option>
		</select>
	</VDialog>
</template>
