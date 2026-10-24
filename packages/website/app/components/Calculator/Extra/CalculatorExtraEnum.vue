<script setup vapor lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';
import { gameImageAttrs } from '~/utils/image';

defineProps<{
	idSuffix: string;
	imgSrc: IGameImageData;
	label: string;
	options: [value: number, label: string | number][];
	disabled?: boolean;
	tooltipTriggerAttrs?: any;
}>();

const value = defineModel<number>();

function updateValue(event: Event) {
	value.value = Number.parseInt((event.target as HTMLSelectElement).value);
}
</script>

<template>
	<article class="calc-extra-enum">
		<img v-bind="{ ...gameImageAttrs(imgSrc, 56), ...tooltipTriggerAttrs }" aria-hidden="true" />
		<label :for="`xtrenum-${idSuffix}`">
			{{ label }}
		</label>
		<slot />
		<select :id="`xtrenum-${idSuffix}`" :value="value ?? 0" :disabled @change="updateValue">
			<option v-for="[optionValue, optionLabel] in options" :selected="optionValue === value" :key="optionValue" :value="optionValue">
				{{ optionLabel }}
			</option>
		</select>
	</article>
</template>

<style>
@layer components {
	.calc-extra-enum {
		--at-apply: 'grid grid-cols-[max-content_auto_minmax(0,1fr)_min-content] grid-rows-2 relative';

		> label {
			--at-apply: 'col-span-3 self-center of-hidden leading-[1.1]';
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		> select {
			--at-apply: 'box-content h-min px-1 py-0.5 row-span-2 bg-white text-black col-span-2';
			color-scheme: light;

			> option {
				--at-apply: 'text-black';
			}
		}
	}
}
</style>
