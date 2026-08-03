<script setup lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';

withDefaults(defineProps<{
	idPrefix: string;
	imgSrc: IGameImageData;
	label: string;
	// usedNumberInput: ReturnType<typeof useNumberInput>;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
}>(), {
	min: 0,
});

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>({ required: true });

function onInput(event: Event){
	console.log('input', event.target?.value, event);
}
</script>

<template>
	<article class="v-extras-progress">
		<img
			v-bind="gameImageAttrs(imgSrc, 56)"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<label :for="`veprgr-${idPrefix}`">
			{{ label }}
		</label>
		<slot />
		<input
			:id="`veprgr-${idPrefix}`"
			:value="value"
			type="range"
			min="0"
			max="100"
			@input="onInput"
		>
	</article>
</template>

<style>
@layer components {
	.v-extras-progress {
		--at-apply: 'grid grid-cols-[max-content_minmax(0,1fr)] grid-rows-2 relative';

		> label {
			--at-apply: 'col-span-3 self-center of-hidden leading-none pb-[0.2em] -mb-[0.2em]';
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		> input {
			--at-apply: 'box-content bg-white text-black';
		}
	}
}
</style>
