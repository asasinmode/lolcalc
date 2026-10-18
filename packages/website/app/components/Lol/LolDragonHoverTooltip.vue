<script setup vapor lang="ts">
import type { IComputedDragonAbilityDescription } from '@lolcalc/core/DamageSource';
import { computeDragonAbilityDescription } from '@lolcalc/core/DamageSource';
import type { IDragonHoverTooltipProps } from '~/utils/types';

const props = defineProps<IDragonHoverTooltipProps>();

const { isTooltipPinned, isTooltipExpanded } = useTooltipState();

const computedDescription = computed<IComputedDragonAbilityDescription | undefined>(
	() => props.precomputedDescription ?? (props.dragon && props.type ? computeDragonAbilityDescription(props.dragon, props.type, props.damageSource, props.checkIfValid) : undefined),
);

const el = useTemplateRef('el');

defineExpose({ el });
</script>

<template>
	<article ref="el" popover="hint" class="hover-tooltip dragon">
		<h5>{{ computedDescription?.title }}</h5>
		<p class="game-description" v-html="computedDescription?.[isTooltipExpanded ? 'textExtended' : 'text'] ?? computedDescription?.text" />
		<UnresolvedVariablesAlert v-if="computedDescription?.anyUnknownVariables" />
		<p v-if="checkIfValid" v-show="computedDescription?.invalidMessage" :id="`dragon-tooltip-error-${idSuffix ?? ''}`" class="alert error">
			{{ computedDescription?.invalidMessage }}
			<Icon class="i-ph:warning-circle-light" />
		</p>
		<footer v-show="computedDescription?.anyExtendedVariables && !isTooltipExpanded">
			<span class="kbd-only">{{ isTooltipPinned ? 'Press' : 'Hold' }} <kbd>[Shift]</kbd></span>
			<span class="touch-only">Tap here</span>
			to show more info
		</footer>
	</article>
</template>

<style>
@layer components {
	.hover-tooltip.dragon {
		--at-apply: 'w-fit max-w-[min(100vw,calc(154*var(--spacing)))]';
		justify-self: anchor-center;
		position-try: flip-block;

		> .game-description {
			--at-apply: 'leading-normal';
		}
	}
}
</style>
