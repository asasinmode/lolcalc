<script setup lang="ts">
import type { IExtraComponentProps } from '~/utils/types';

defineProps<Pick<IExtraComponentProps, 'idSuffix'> & { noApply?: boolean }>();

const emit = defineEmits<{
	refresh: [];
}>();

const value = defineModel<boolean>({ required: false });
const clicks = ref(0);

function refresh() {
	clicks.value += 1;
	emit('refresh');
}

function showControlsTooltip(event: Event) {
	const popover = (event.currentTarget as HTMLElement).lastElementChild as HTMLElement | null;
	popover?.showPopover();
}

function hideControlsTooltip(event: Event) {
	const popover = (event.currentTarget as HTMLElement).lastElementChild as HTMLElement | null;
	popover?.hidePopover();
}
</script>

<template>
	<div
		class="effect-ctl"
		@mouseenter="showControlsTooltip"
		@focusin="showControlsTooltip"
		@mouseleave="hideControlsTooltip"
		@focusout="hideControlsTooltip"
	>
		<button class="pretend-ui-btn" @click="refresh">
			<span>refresh</span>
			<Icon class="i-ph:arrow-clockwise-bold" :style="`--clicks: ${clicks}`" />
		</button>
		<slot>
			<label v-if="!noApply" :for="`effect-ctl-tgl-${idSuffix}`" class="pretend-ui-btn">
				<input :id="`effect-ctl-tgl-${idSuffix}`" v-model="value" type="checkbox">
				<span>apply</span>
			</label>
		</slot>
		<p popover="manual" class="hover-tooltip">
			applying this effects uses the stats at the moment of application<br>
			to recalculate the effect (like applying it again with the stats gained from it), use the <span class="pretend-ui-btn"><span>refresh</span><Icon class="i-ph:arrow-clockwise-bold" /></span> button
		</p>
	</div>
</template>

<style>
@layer components {
	.effect-ctl {
		--at-apply: 'flex';

		> button:first-of-type {
			&:has(+ button) {
				--at-apply: '-me-px';
			}

			.icon {
				--at-apply: 'transition-[rotate] duration-[--transition-duration]';
				rotate: z calc(360deg * var(--clicks));
			}
		}

		> label {
			--at-apply: 'cursor-pointer';

			&::before {
				--at-apply: 'content-empty size-4 bg-[--ui-pretend-button-icon-clr]';
				mask: icon('i-ph:check-fat') center / 100% 100% no-repeat;
			}

			&:has(> input:checked)::before {
				mask: icon('i-ph:check-fat-fill') center / 100% 100% no-repeat;
			}

			> * {
				--at-apply: 'sr-only';
			}
		}

		[popover] {
			--at-apply: 'p-[--default-hover-tooltip-p]';
			position-anchor: --extra-container;
			justify-self: anchor-center;
			inset-block-start: calc(anchor(end) - 1px);

			> .pretend-ui-btn {
				--at-apply: 'size-5 inline-grid align-middle place-items-center';

				.icon {
					--at-apply: 'size-3.5';
				}
			}
		}
	}
}
</style>
