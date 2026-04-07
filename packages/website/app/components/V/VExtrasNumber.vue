<script setup lang="ts">
withDefaults(defineProps<{
	idPrefix: string;
	img: string;
	imgSize: string | number;
	imgText?: string | number;
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
			:src="img"
			:width="imgSize"
			:height="imgSize"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<span v-if="imgText" aria-hidden="true">{{ imgText }}</span>
		<label :for="`ven-${idPrefix}-input`">
			{{ label }}
		</label>
		<slot />
		<input
			:id="`ven-${idPrefix}-input`"
			:value="value"
			type="number"
			:min
			:max
			:step
			:disabled
			@input="usedNumberInput"
		>
		<button
			class="pretend-ui-button"
			:disabled="disabled || value === min"
			@click="value = min"
		>
			min
		</button>
		<button
			class="pretend-ui-button"
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
		--at-apply: 'grid grid-cols-[auto_auto_min-content_1fr] grid-rows-[min-content_min-content] relative';

		> img {
			--at-apply: 'row-span-full b b-[--ui-button-border-clr] size-[--ability-size] me-2';
		}

		> span {
			--at-apply: 'text-sm z-1 text-white leading-[1.1] absolute bottom-[--p] start-[calc(var(--p)+var(--ability-size)-var(--spacing))] -translate-x-full pointer-events-none';
			paint-order: stroke fill;
			-webkit-text-stroke: 0.15em black;
		}

		> label {
			--at-apply: 'col-span-3';
		}

		> input {
			--at-apply: 'box-content h-min w-[6ch] px-1 py-0.5 row-span-2 bg-white text-black me-2';

			&:disabled {
				--at-apply: 'bg-neutral-200 text-neutral-600';
			}
		}

		> button {
			--at-apply: 'w-12 h-7';
		}
	}
}
</style>
