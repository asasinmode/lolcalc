<script setup lang="ts">
defineProps<{
	idPrefix: string;
	imgSrc: string;
	imgSize: string | number;
	label: string;
	/**
	 * values have to be numbers
	 * ```ts
	 * {
	 *   [value1]: 'option 1 label',
	 *   [value2]: 'option 2 label',
	 * }
	 * ```
	 */
	options: Record<number, string>;
}>();

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>({ required: true });

function updateValue(event: Event) {
	value.value = Number.parseInt((event.target as HTMLSelectElement).value);
}
</script>

<template>
	<article class="v-extras-enum">
		<img
			:src="imgSrc"
			:width="imgSize"
			:height="imgSize"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<label :for="`veenum-${idPrefix}`">
			{{ label }}
		</label>
		<slot />
		<select
			:id="`veenum-${idPrefix}`"
			:value="value"
			@change="updateValue"
		>
			<option v-for="(optionLabel, optionValue) in options" :key="optionValue" :value="optionValue">
				{{ optionLabel }}
			</option>
		</select>
	</article>
</template>

<style>
@layer components {
	.v-extras-enum {
		--at-apply: 'grid grid-cols-[auto_auto_1fr_min-content] grid-rows-2 relative';

		> label {
			--at-apply: 'col-span-3 self-center of-hidden leading-[1]';
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		> select {
			--at-apply: 'box-content h-min min-w-[8ch] px-1 py-0.5 row-span-2 bg-white text-black';
			color-scheme: light;

			> option {
				--at-apply: 'text-black';
			}
		}
	}
}
</style>
