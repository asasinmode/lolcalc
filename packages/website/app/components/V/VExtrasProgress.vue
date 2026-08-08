<script setup lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';
import { roundVariable } from '@lolcalc/shared/utils';

defineProps<{
	idPrefix: string;
	imgSrc: IGameImageData;
	label: string;
	derivedValue?: number;
	derivedSymbolSuffix?: string;
}>();

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>();
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
			:value="value ?? 0"
			type="range"
			min="0"
			max="100"
		>
		<output :for="`veprgr-${idPrefix}`" aria-live="off">
			{{ derivedValue !== undefined ? roundVariable(derivedValue, 1) : 0 }}{{ derivedSymbolSuffix }}
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

		> output {
			--at-apply: 'self-center text-end leading-none';
		}

		&[data-inactive] {
			> output {
				--at-apply: 'text-neutral-400';
			}

			> input {
				--at-apply: 'brightness-50';
			}
		}
	}
}
</style>
