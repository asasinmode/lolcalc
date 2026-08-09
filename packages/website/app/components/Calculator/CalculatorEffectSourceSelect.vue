<script setup lang="ts">
const props = defineProps<{
	idSuffix: string;
	invalidMessage?: string;
}>();

const value = defineModel<string>();

let tooltipAnchor: HTMLElement | undefined;
const hoverTooltipEl = useTemplateRef('hoverTooltip');

function showTooltip(event: MouseEvent) {
	const { target } = event as unknown as { target: HTMLElement };
	hoverTooltipEl.value?.showPopover();
	tooltipAnchor = target;
	tooltipAnchor?.addEventListener('mouseleave', hideTooltiop, { passive: true, once: true });
}

function hideTooltiop() {
	hoverTooltipEl.value?.hidePopover();
	tooltipAnchor?.removeEventListener('mouseleave', hideTooltiop);
	tooltipAnchor = undefined;
}

const showInvalid = computed(() => value.value && props.invalidMessage);
</script>

<template>
	<VSelect
		:id="`effect-src-select-${idSuffix}`"
		v-model="value"
		class="effect-src-select"
		label="effect source"
		title="effect source"
		clearable
		:data-empty="value ? undefined : ''"
		:aria-errormessage="showInvalid ? `effect-src-select-err-${idSuffix}` : undefined"
		:options="[['a', 'option 1'], ['b', 'option 2'], ['c', 'option 3']]"
		@label-mouseenter="showTooltip"
	>
		<template #post>
			<div v-show="showInvalid" class="invalid-indicator">
				<span>(issue)</span>
				<Icon class="i-ph:exclamation-mark-bold" />
			</div>
			<div ref="hoverTooltip" popover="hint">
				<p v-show="showInvalid" :id="`effect-src-select-err-${idSuffix}`" class="alert warning">
					effect may not be applied properly<br>
					{{ invalidMessage }}
					<Icon class="i-ph:warning-light" />
				</p>
			</div>
		</template>
	</VSelect>
</template>

<style>
@layer components {
	.effect-src-select {
		--at-apply: 'absolute start-[--p] inset-bs-[--p] z-1 size-5.5 b b-[--ui-btn-border-clr]';
		--hover-brightness: var(--champion-hover-brightness);
		anchor-scope: --effect-src-select;
		anchor-name: --effect-src-select;

		&[data-empty] {
			--hover-brightness: var(--empty-champion-hover-brightness);
		}

		> label {
			--at-apply: 'size-full';
			background: var(--empty-champion-url) no-repeat center / 120%;
		}

		&:hover,
		&:focus-within {
			> label {
				--at-apply: 'brightness-[--hover-brightness]';
			}
		}

		.invalid-indicator {
			--at-apply: 'absolute text-white outline-2 outline-amber-600 outline-offset-1 rounded-full bg-amber-600 grid-center absolute end-0 inset-bs-0 z-1 -translate-y-1/3 translate-x-1/3';

			> span {
				&:nth-child(1) {
					--at-apply: 'sr-only';
				}

				&:nth-child(2) {
					--at-apply: 'size-3';
				}
			}
		}

		> [popover] {
			--at-apply: 'pointer-events-none';
			position-anchor: --effect-src-select;
			inset-block-start: calc(anchor(end) - 1px);
			justify-self: anchor-center;
		}
	}
}
</style>
