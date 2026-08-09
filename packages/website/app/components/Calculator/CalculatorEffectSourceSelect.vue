<script setup lang="ts">
defineProps<{
	idSuffix: string;
}>();

const value = defineModel<string>();
</script>

<template>
	<VSelect
		:id="`effect-src-${idSuffix}`"
		v-model="value"
		class="effect-src"
		label="effect source"
		title="effect source"
		:data-empty="value ? undefined : ''"
		:options="[['a', 'option 1'], ['b', 'option 2'], ['c', 'option 3']]"
	/>
</template>

<style>
@layer components {
	.effect-src-select {
		--at-apply: 'absolute of-hidden start-[--p] inset-bs-[--p] z-1 size-5.5 b b-[--ui-btn-border-clr]';
		--hover-brightness: var(--champion-hover-brightness);

		&[data-empty] {
			--hover-brightness: var(--empty-champion-hover-brightness);
		}

		> label {
			--at-apply: 'size-full';
			background: var(--empty-champion-url) no-repeat center / 120%;
		}

		&:hover,
		&:focus-within {
			> label {
				--at-apply: 'brightness-[--hover-brightness]';
			}
		}
	}
}
</style>
