<script setup vapor lang="ts">
const props = withDefaults(
	defineProps<{
		isTooltipPinned: boolean;
		isTooltipExpanded: boolean;
		toShow?: string;
		kbd?: string;
		tapCb?: () => void;
	}>(),
	{
		toShow: 'more info',
		kbd: '[Shift]',
	},
);

const { isTooltipExpanded: stateIsExpanded } = useTooltipState();
const toggle = props.tapCb ?? (() => (stateIsExpanded.value = !stateIsExpanded.value));
</script>

<template>
	<p class="expanded-ctl" @touchstart.stop.prevent="toggle">
		<span class="kbd-only">
			{{ isTooltipPinned ? 'Press' : 'Hold' }} <kbd>{{ kbd }}</kbd>
		</span>
		<span class="touch-only">Tap here</span>
		to {{ isTooltipExpanded ? 'hide' : 'show' }} {{ toShow }}
	</p>
</template>

<style>
@layer components {
	.hover-tooltip {
		:is(&[data-pinned], [data-pinned] > &)[data-expanded] .expanded-ctl:not(:first-child) {
			--at-apply: 'mbs-1';
		}

		@media (hover: hover) and (pointer: fine) {
			&[data-expanded]:not([data-pinned]):not([data-pinned] > &) .expanded-ctl {
				--at-apply: 'hidden';
			}
		}

		@media not ((hover: hover) and (pointer: fine)) {
			[data-expanded] .expanded-ctl {
				--at-apply: 'bg-[--unknown-clr]';
			}
		}
	}
}
</style>
