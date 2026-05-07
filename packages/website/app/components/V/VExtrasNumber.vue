<script setup lang="ts">
withDefaults(defineProps<{
	idPrefix: string;
	imgSrc: string;
	imgSize: string | number;
	label: string;
	usedNumberInput: ReturnType<typeof useNumberInput>;
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
</script>

<template>
	<article class="v-extras-number">
		<img
			:src="imgSrc"
			:width="imgSize"
			:height="imgSize"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<label :for="`venmbr-${idPrefix}`">
			{{ label }}
		</label>
		<slot />
		<input
			:id="`venmbr-${idPrefix}`"
			:value="value"
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
			:disabled="disabled || max === undefined || value === max"
			@click="value = max!"
		>
			max
		</button>
	</article>
</template>

<style>
@layer components {
	.v-extras-number {
		--at-apply: 'grid grid-cols-[auto_auto_1fr_min-content] grid-rows-2 relative';

		> label {
			--at-apply: 'col-span-3 self-center of-hidden leading-[1] pb-[0.2em] -mb-[0.2em]';
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		> input {
			--at-apply: 'box-content h-min w-[--venmbr-input-w] px-[--venmbr-input-px] py-[--venmbr-input-py] bg-white text-black me-[--venmbr-gap-x]';

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
