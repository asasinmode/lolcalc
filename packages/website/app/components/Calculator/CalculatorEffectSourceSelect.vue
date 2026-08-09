<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import { CHAMPION_IMAGES } from '@lolcalc/data';

const props = defineProps<{
	idSuffix: string;
	invalidMessage?: string;
}>();

const { damageSources, damageTargets } = useCalculatorState();
const { championImage } = CHAMPION_IMAGES;

function formatSourceOptions(sources: DamageSource[]): [string, string][] {
	return sources.map((source, index) => [source.id, `(${index + 1}) ${source.listedChampion.value?.name ?? '<empty>'}`]);
}

const value = defineModel<string>();

let tooltipAnchor: HTMLElement | undefined;
const hoverTooltipEl = useTemplateRef('hoverTooltip');

function showTooltip(event: MouseEvent) {
	const { target } = event as unknown as { target: HTMLElement };
	hoverTooltipEl.value?.showPopover();
	tooltipAnchor = target;
	tooltipAnchor?.addEventListener('mouseleave', hideTooltip, { passive: true, once: true });
}

function hideTooltip() {
	hoverTooltipEl.value?.hidePopover();
	tooltipAnchor?.removeEventListener('mouseleave', hideTooltip);
	tooltipAnchor = undefined;
}

const showInvalid = computed(() => value.value && props.invalidMessage);

// TODO use one from props/value/applied effect
const selectedSource = computed(() => value.value ? damageSources.value.find(source => source.id === value.value) ?? damageTargets.value.find(source => source.id === value.value) : undefined);

const thumbnail = useTemplateRef('thumbnail');
const { DamageSourceThumbnail, updateThumbnail } = useDamageSourceThumbnail(thumbnail);

const selectedText = computed(() => {
	if (selectedSource.value && !selectedSource.value?.listedChampion.value) {
		let index = damageSources.value.indexOf(selectedSource.value);
		if (~index) {
			return `s${index + 1}`;
		}

		index = damageTargets.value.indexOf(selectedSource.value);
		if (~index) {
			return `t${index + 1}`;
		}

		console.warn('[CalculatorEffectSourceSelect] could not find selected source in sources/targets', selectedSource.value);
	}
	return undefined;
});

function updateThumbnailHideTooltip() {
	selectedSource.value && updateThumbnail(selectedSource.value);
	hideTooltip();
}
</script>

<template>
	<VSelect
		:id="`effect-src-select-${idSuffix}`"
		v-model="value"
		class="effect-src-select"
		label="effect source"
		clearable
		:class="{ empty: !value }"
		:aria-errormessage="showInvalid ? `effect-src-select-err-${idSuffix}` : undefined"
		:data-selected-text="selectedText"
		:options="{
			sources: formatSourceOptions(damageSources),
			targets: formatSourceOptions(damageTargets),
		}"
		:style="selectedSource?.listedChampion.value ? `--selected-src-img: url(${championImage(selectedSource.listedChampion.value.image, selectedSource.listedChampion.value.id)})` : undefined"
		@label-mouseenter="showTooltip"
		@update:model-value="updateThumbnailHideTooltip"
	>
		<template #post>
			<div v-show="showInvalid" class="invalid-indicator">
				<span>(issue)</span>
				<Icon class="i-ph:exclamation-mark-bold" />
			</div>
			<div ref="hoverTooltip" popover="hint" class="hover-tooltip">
				<span v-show="!selectedSource">effect source</span>
				<p v-show="showInvalid" :id="`effect-src-select-err-${idSuffix}`" class="alert warning">
					effect may not be applied properly<br>
					{{ invalidMessage }}
					<Icon class="i-ph:warning-light" />
				</p>
				<DamageSourceThumbnail v-show="selectedSource" ref="thumbnail" />
			</div>
		</template>
	</VSelect>
</template>

<style>
@layer components {
	.effect-src-select {
		--at-apply: 'absolute start-[--p] inset-bs-[--p] z-1 size-5.5 b b-[--ui-btn-border-clr]';
		--hover-brightness: var(--champion-hover-brightness);
		--bg-size: 100%;
		anchor-scope: --effect-src-select;
		anchor-name: --effect-src-select;

		&.empty,
		&:not([style]),
		&[style=''] {
			--hover-brightness: var(--empty-champion-hover-brightness);
			--bg-size: 120%;
		}

		&[data-selected-text]::before {
			--at-apply: 'absolute z-2 bg-[--placeholder-champion-bg-clr] leading-none size-full text-center text-xs grid place-items-center of-hidden';
			content: attr(data-selected-text);
		}

		> label {
			--at-apply: 'size-full';
			background: var(--selected-src-img, var(--empty-champion-url)) no-repeat center / var(--bg-size);
		}

		&:hover,
		&:focus-within {
			> label {
				--at-apply: 'brightness-[--hover-brightness]';
			}
		}

		.invalid-indicator {
			--at-apply: 'absolute text-white outline-2 outline-amber-600 outline-offset-1 rounded-full bg-amber-600 grid-center absolute end-0 inset-bs-0 z-3 -translate-y-1/3 translate-x-1/3';

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

			> span,
			.alert {
				--at-apply: 'm-[--default-hover-tooltip-p]';
			}

			.damage-source-thumbnail {
				--at-apply: 'b-0';
			}
		}

		> [aria-errormessage] ~ [popover] {
			.damage-source-thumbnail {
				--at-apply: 'mx-auto b mbe-[--default-hover-tooltip-p]';
			}
		}
	}
}
</style>
