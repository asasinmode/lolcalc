<script setup lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';
import { roundNumber } from '@lolcalc/shared/utils';

const props = withDefaults(defineProps<{
	idSuffix: string;
	imgSrc: IGameImageData;
	label: string;
	deriveValue: (value: number) => number | undefined;
	derivedSymbolSuffix?: string;
	max?: number;
}>(), {
	max: 100,
});

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>();
const localValue = ref(value.value);

let isMouseDown: boolean = false;

function updateModelValue(event: Event) {
	const newValue = Number.parseInt((event.target as HTMLInputElement).value);
	if (value.value === undefined && isMouseDown) {
		localValue.value = newValue;
	} else {
		value.value = newValue;
	}
}

function updateMousedown(newValue: boolean) {
	isMouseDown = newValue;
	if (!newValue && value.value === undefined && localValue.value) {
		value.value = localValue.value;
	}
}

const derivedValue = computed(() => {
	const rv = value.value ?? localValue.value;
	return rv && props.deriveValue(rv);
});
</script>

<template>
	<article class="calc-extra-progress">
		<img
			v-bind="gameImageAttrs(imgSrc, 56)"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<label :for="`xtrprgr-${idSuffix}`">
			{{ label }}
		</label>
		<slot />
		<input
			:id="`xtrprgr-${idSuffix}`"
			:value="value ?? localValue ?? 0"
			type="range"
			min="0"
			:max
			@mousedown="updateMousedown(true)"
			@mouseup="updateMousedown(false)"
			@input="updateModelValue"
		>
		<output :for="`xtrprgr-${idSuffix}`" aria-live="off">
			{{ derivedValue !== undefined ? roundNumber(derivedValue, 1) : 0 }}{{ derivedSymbolSuffix }}
		</output>
	</article>
</template>

<style>
@layer components {
	.calc-extra-progress {
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
