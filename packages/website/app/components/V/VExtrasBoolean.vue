<script setup lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';

defineProps<{
	idPrefix: string;
	imgSrc: IGameImageData;
	label: string;
	labelPrefixApply?: boolean;
}>();

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>({ required: true });
</script>

<template>
	<article class="v-extras-boolean">
		<img
			v-bind="gameImageAttrs(imgSrc, 56)"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<input
			:id="`vebln-${idPrefix}`"
			v-model="value"
			type="checkbox"
			:true-value="1"
			:false-value="0"
		>
		<label :for="`vebln-${idPrefix}`">
			{{ labelPrefixApply ? 'apply ' : '' }}{{ label }}
		</label>
		<slot />
	</article>
</template>

<style>
@layer components {
	.v-extras-boolean {
		--at-apply: 'grid grid-cols-[auto_max-content_1fr] grid-rows-1 items-center relative';

		> input {
			--at-apply: 'mt-px';
		}

		> label {
			--at-apply: 'ps-[0.5ch] leading-[1.1]';
		}
	}
}
</style>
