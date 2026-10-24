<script setup vapor lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';
import { gameImageAttrs } from '~/utils/image';

defineProps<{
	idSuffix: string;
	imgSrc: IGameImageData;
	label: string;
	labelPrefixApply?: boolean;
	tooltip?: string;
	inactive?: boolean;
	tooltipTriggerAttrs?: any;
}>();

const value = defineModel<number>();
</script>

<template>
	<article class="calc-extra-boolean" :data-inactive="inactive || undefined">
		<img v-bind="{ ...gameImageAttrs(imgSrc, 56), ...tooltipTriggerAttrs }" aria-hidden="true" />
		<input :id="`xtrbln-${idSuffix}`" v-model="value" type="checkbox" :true-value="1" :false-value="0" />
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

@layer overrides {
	.calc-extra-boolean[data-inactive='true'] > label {
		--at-apply: 'text-neutral-400';
	}
}
</style>
