<script setup lang="ts">
import type { IGameImageData } from '@lolcalc/core/misc';
import { simpleDescriptionFormatting } from '@lolcalc/core/misc';

const props = defineProps<{
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

const computedTooltip = ref<string>();
if (props.tooltip) {
	simpleDescriptionFormatting(props.tooltip).then(value => computedTooltip.value = value);
}

const { showTooltip, hideTooltip } = useInfoTooltip();
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
			<template v-if="tooltip">
				<span
					:aria-describedby="`xtrbln-tooltip-${idSuffix}`"
					class="info-tooltip-trigger"
					tabindex="0"
					@focus="showTooltip($event, true)"
					@mouseenter="showTooltip($event, true)"
					@mouseleave="hideTooltip($event, true)"
					@blur="hideTooltip($event, true)"
				>
					<span>additional info</span>
					<Icon class="i-ph:info-fill" />
				</span>
				<p
					:id="`xtrbln-tooltip-${idSuffix}`"
					popover="hint"
					class="hover-tooltip"
					@focus="showTooltip($event, false)"
					@mouseenter="showTooltip($event, false)"
					@mouseleave="hideTooltip($event, false)"
					@focusout="hideTooltip($event, false)"
					@click.stop.prevent=""
					v-html="computedTooltip ?? 'loading...'"
				/>
			</template>
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
