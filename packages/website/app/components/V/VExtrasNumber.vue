<script setup lang="ts">
withDefaults(defineProps<{
	idPrefix: string;
	img: string;
	imgSize: string | number;
	label: string;
	usedNumberInput: ReturnType<typeof useNumberInput>;
	min?: number;
	max?: number;
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
		<label :for="`ven-${idPrefix}-input`">
			{{ label }}
		</label>
		<input
			:id="`ven-${idPrefix}-input`"
			:value="value"
			min="0"
			type="number"
			@input="usedNumberInput"
		>
		<button class="pretend-ui-button" :disabled="value === min" @click="value = min">
			min
		</button>
		<button class="pretend-ui-button" :disabled="max === undefined || value === max" @click="value = max!">
			max
		</button>
	</article>
</template>

<style>
@layer components {
	.v-extras-number {
		--at-apply: 'grid grid-cols-[auto_auto_min-content_1fr] grid-rows-[min-content_min-content]';

		> img {
			--at-apply: 'row-span-full b b-[--ui-button-border-clr] size-[--ability-size] me-2';
		}

		> label {
			--at-apply: 'col-span-3';
		}

		> input {
			--at-apply: 'box-content h-min w-[6ch] px-1 py-0.5 row-span-2 bg-white text-black me-2';
		}

		> button {
			--at-apply: 'w-12 h-7';
		}
	}
}
</style>
