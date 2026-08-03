<script setup lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';
import { roundVariable } from '@lolcalc/shared/utils';

defineProps<{
	idPrefix: string;
	imgSrc: IGameImageData;
	label: string;
	derivedValue: number;
}>();

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>({ required: true });
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
			v-model.number="value"
			type="range"
			min="0"
			max="100"
		>
		<output :for="`veprgr-${idPrefix}`" aria-live="off">
			{{ roundVariable(derivedValue, 1) }}%
		</output>
	</article>
</template>

<style>
@layer components {
	.v-extras-progress {
		--at-apply: 'grid grid-cols-[max-content_minmax(0,1fr)_5ch] grid-rows-2 relative';

		> label {
			--at-apply: 'col-span-2 self-center of-hidden leading-none pb-[0.2em] -mb-[0.2em]';
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		> input {
			--at-apply: '';
		}

		> output {
			--at-apply: 'self-center text-end leading-none';
		}
	}
}
</style>
