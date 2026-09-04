<script setup lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';

withDefaults(defineProps<{
	idSuffix: string;
	imgSrc: IGameImageData;
	label: string;
	usedNumberInput: ReturnType<typeof useNumberInput>;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	tooltip?: string;
}>(), {
	min: 0,
});

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>();
</script>

<template>
	<article class="calc-extra-number">
		<img
			v-bind="gameImageAttrs(imgSrc, 56)"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<label :for="`xtrnmbr-${idSuffix}`">
			{{ label }}
			<InfoTooltip id-prefix="xtrnmbr" :id-suffix :tooltip />
		</label>
		<slot />
		<input
			:id="`xtrnmbr-${idSuffix}`"
			:value="value ?? 0"
			type="number"
			:min
			:max
			:step
			:disabled
			@input="usedNumberInput"
		>
		<button
			class="pretend-ui-btn"
			:disabled="disabled || value === min"
			@click="value = min"
		>
			min
		</button>
		<button
			class="pretend-ui-btn"
			:disabled="disabled || max === undefined || value === max || max === Number.POSITIVE_INFINITY"
			@click="value = max!"
		>
			max
		</button>
	</article>
</template>

<style>
@layer components {
	.calc-extra-number {
		--at-apply: 'grid grid-cols-[max-content_minmax(0,1fr)_auto_min-content] grid-rows-2 relative';

		> label {
			--at-apply: 'col-span-3 self-center of-hidden leading-none pb-[0.2em] -mb-[0.2em]';
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		> input {
			--at-apply: 'box-content block-min px-[--venmbr-input-px] py-[--venmbr-input-py] bg-white text-black me-[--venmbr-gap-x]';

			&:disabled {
				--at-apply: 'bg-neutral-200 text-neutral-600';
			}
		}

		> button {
			--at-apply: 'w-[--venmbr-btn-w] h-7';

			&:not(:disabled) {
				--at-apply: 'z-1';
			}

			&:nth-last-of-type(2) {
				--at-apply: 'justify-self-end -me-px';
			}
		}
	}
}
</style>
