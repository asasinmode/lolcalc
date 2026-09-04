<script setup lang="ts">
import { simpleDescriptionFormatting } from '@lolcalc/core/misc';

const props = defineProps<{
	idPrefix: string;
	idSuffix: string;
	tooltip?: string;
}>();

const computedTooltip = ref<string>();
if (props.tooltip) {
	simpleDescriptionFormatting(props.tooltip).then(value => computedTooltip.value = value);
}

const { showTooltip, hideTooltip } = useInfoTooltip();
</script>

<template>
	<template v-if="tooltip">
		<span
			:aria-describedby="`${idPrefix}-tooltip-${idSuffix}`"
			class="info-tooltip-trigger"
			tabindex="0"
			@focus="showTooltip($event, true)"
			@mouseenter="showTooltip($event, true)"
			@mouseleave="hideTooltip($event, true)"
			@blur="hideTooltip($event, true)"
		>
			<slot name="trigger">
				<span>additional info</span>
			</slot>
			<Icon class="i-ph:info-fill" />
		</span>
		<p
			:id="`${idPrefix}-tooltip-${idSuffix}`"
			popover="hint"
			class="hover-tooltip game-description"
			@focus="showTooltip($event, false)"
			@mouseenter="showTooltip($event, false)"
			@mouseleave="hideTooltip($event, false)"
			@focusout="hideTooltip($event, false)"
			@click.stop.prevent=""
			v-html="computedTooltip ?? 'loading...'"
		/>
	</template>
</template>
