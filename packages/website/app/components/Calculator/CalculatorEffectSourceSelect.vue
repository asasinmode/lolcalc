<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import { CHAMPION_IMAGES } from '@lolcalc/data';

const props = defineProps<{
	idSuffix: string;
	invalidMessage?: string;
}>();

const value = defineModel<DamageSource>();

const { damageSources, damageTargets } = useCalculatorState();
const { championImage } = CHAMPION_IMAGES;

function formatSourceOptions(sources: DamageSource[]): [string, string][] {
	return sources.map((source, index) => [source.id, `(${index + 1}) ${source.listedChampion.value?.name ?? '<empty>'}`]);
}

const hoverTooltipEl = useTemplateRef('hoverTooltip');

function showTooltip(event: MouseEvent) {
	hoverTooltipEl.value?.showPopover();
	(event.target as HTMLElement)?.addEventListener('mouseleave', hideTooltip, { passive: true, once: true });
}

function hideTooltip() {
	hoverTooltipEl.value?.hidePopover();
}

const showInvalid = computed(() => value.value && props.invalidMessage);

const thumbnail = useTemplateRef('thumbnail');
const { DamageSourceThumbnail, updateThumbnail } = useDamageSourceThumbnail();

const selectedText = computed(() => {
	if (value.value && !value.value?.listedChampion.value) {
		let index = damageSources.value.indexOf(value.value);
		if (~index) {
			return `s${index + 1}`;
		}

		index = damageTargets.value.indexOf(value.value);
		if (~index) {
			return `t${index + 1}`;
		}

		console.warn('[CalculatorEffectSourceSelect] could not find selected source in sources/targets', value.value);
	}
	return undefined;
});

function updateThumbnailHideTooltip(id?: string) {
	const damageSource = id
		? (damageSources.value.find(source => source.id === id) ?? damageTargets.value.find(target => target.id === id))
		: undefined;
	if (id && !damageSource) {
		console.warn('[CalculatorEffectSourceSelect] failed to update model value, unknown damage source id', id, damageSources.value.map(s => s.id), damageTargets.value.map(t => t.id), value.value);
	}
	value.value = damageSource;
	damageSource && updateThumbnail(thumbnail.value, damageSource);
	hideTooltip();
}

onMounted(() => {
	value.value && updateThumbnail(thumbnail.value, value.value);
});
</script>

<template>
	<VSelect
		:id="`effect-src-select-${idSuffix}`"
		:model-value="value?.id"
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
		:style="value?.listedChampion.value ? `--selected-src-img: url(${championImage(value?.listedChampion.value.image, value?.listedChampion.value.id)})` : undefined"
		@label-mouseenter="showTooltip"
		@update:model-value="updateThumbnailHideTooltip"
	>
		<template #post>
			<div v-show="showInvalid" class="invalid-indicator">
				<span>(issue)</span>
				<Icon class="i-ph:exclamation-mark-bold" />
			</div>
			<div ref="hoverTooltip" popover="hint" class="hover-tooltip">
				<span v-show="!value">effect source</span>
				<p v-show="showInvalid" :id="`effect-src-select-err-${idSuffix}`" class="alert warning">
					effect may not be applied properly<br>
					{{ invalidMessage }}
					<Icon class="i-ph:warning-light" />
				</p>
				<DamageSourceThumbnail v-show="value" ref="thumbnail" />
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
			--at-apply: 'pointer-events-none shadow-lg';
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
