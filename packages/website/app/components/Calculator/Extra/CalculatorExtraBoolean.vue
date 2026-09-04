<script setup lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';

defineProps<{
	idSuffix: string;
	imgSrc: IGameImageData;
	label: string;
	labelPrefixApply?: boolean;
	tooltip?: string;
}>();

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>();
</script>

<template>
	<article class="calc-extra-boolean">
		<img
			v-bind="gameImageAttrs(imgSrc, 56)"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<input
			:id="`xtrbln-${idSuffix}`"
			v-model="value"
			type="checkbox"
			:true-value="1"
			:false-value="0"
		>
		<label :for="`xtrbln-${idSuffix}`">
			{{ labelPrefixApply ? 'apply ' : '' }}{{ label }}
			<InfoTooltip id-prefix="xtrbln" :id-suffix :tooltip />
		</label>
		<slot />
	</article>
</template>

<style>
@layer components {
	.calc-extra-boolean {
		--at-apply: 'grid grid-cols-[max-content_auto_minmax(0,1fr)] grid-rows-1 items-center relative';

		> input {
			--at-apply: 'mt-px';
		}

		> label {
			--at-apply: 'ps-[0.5ch] leading-[1.1]';
		}
	}
}
</style>
