<script setup lang="ts">
import type { IComputedDragonAbilityDescription } from '@lolcalc/core/DamageSource';
import type { IDragonHoverTooltipProps } from '~/utils/types';
import { computeDragonAbilityDescription } from '@lolcalc/core/DamageSource';

const props = defineProps<IDragonHoverTooltipProps>();

const globalKeyModifiers = useGlobalKeyModifiers();

const computedDescription = computed<IComputedDragonAbilityDescription | undefined>(() =>
	(props.damageSource && props.damageSource.computed.dragonSoulAbility.value?.dragon === props.dragon && props.damageSource.computed.dragonSoulAbility.value?.type === props.type)
		? props.damageSource.computed.dragonSoulAbility.value
		: props.dragon && props.type
			? computeDragonAbilityDescription(props.dragon, props.type, props.damageSource, props.checkIfValid)
			: undefined);

const el = useTemplateRef('el');

defineExpose({ el });
</script>

<template>
	<article ref="el" popover="hint" class="hover-tooltip dragon">
		<h5>{{ computedDescription?.title }}</h5>
		<p class="game-description" v-html="computedDescription?.[globalKeyModifiers.shift ? 'textExtended' : 'text'] ?? computedDescription?.text" />
		<UnresolvedVariablesAlert v-if="computedDescription?.anyUnknownVariables" />
		<p v-if="checkIfValid" v-show="computedDescription?.invalidMessage" class="alert error">
			{{ computedDescription?.invalidMessage }}
			<Icon class="i-ph:warning-circle-light" />
		</p>
		<footer v-show="computedDescription?.anyExtendedVariables && !globalKeyModifiers.shift">
			<p>
				Hold <kbd>[Shift]</kbd> to show more info
			</p>
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
