<script setup vapor lang="ts">
import { simpleDescriptionFormatting } from '@lolcalc/core/misc';

const props = defineProps<{
	idPrefix: string;
	idSuffix: string;
	tooltip?: string;
}>();

const computedTooltip = ref<string>();
if (props.tooltip) {
	simpleDescriptionFormatting(props.tooltip).then((value) => (computedTooltip.value = value));
}

const { bindTrigger, bindPopover } = useInfoTooltip();
</script>

<template>
	<template v-if="tooltip">
		<span :aria-describedby="`${idPrefix}-tooltip-${idSuffix}`" class="info-tooltip-trigger" tabindex="0" v-bind="bindTrigger(undefined, true)">
			<slot name="trigger">
				<span>additional info</span>
			</slot>
			<Icon class="i-ph:info-fill" />
		</span>
		<p :id="`${idPrefix}-tooltip-${idSuffix}`" popover="hint" class="hover-tooltip game-description" v-bind="bindPopover" v-html="computedTooltip ?? 'loading...'" @click.stop.prevent="" />
	</template>
</template>
