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
			--at-apply: 'col-span-3 self-center of-hidden leading-[1]';
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		> input {
			--at-apply: 'box-content h-min w-[6ch] px-1 py-0.5 row-span-2 bg-white text-black me-2';

			&:disabled {
				--at-apply: 'bg-neutral-200 text-neutral-600';
			}
		}

		> button {
			--at-apply: 'w-10 h-7';

			&:nth-last-of-type(2) {
				--at-apply: 'justify-self-end';
			}
		}
	}
}
</style>
