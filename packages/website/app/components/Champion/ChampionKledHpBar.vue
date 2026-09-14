<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';

const props = defineProps<{
	idSuffix: string;
	value: DamageSource;
	healthResourceSliderEvents: (target: Ref<number>, max: Ref<number>, element: Ref<HTMLElement | null>) => {
		onMousedown: (e: MouseEvent) => void;
		cleanup: () => void;
		dragValueRef: Ref<number>;
	};
	/* from `useNumberInput` */
	updateChampionHealth: (e: Event) => void;
}>();

const healthBarEl = useTemplateRef('healthBar');
const {
	cleanup,
	onMousedown,
	dragValueRef,
} = props.healthResourceSliderEvents(props.value.currentHealth, props.value.maxHealth, healthBarEl);

onBeforeUnmount(() => {
	cleanup();
});
</script>

<template>
	<div
		ref="healthBar"
		class="current-health"
		:style="`--fill-percentage: ${!value.anythingFilled.value || value.maxHealth.value === 0 ? 1 : Math.min(dragValueRef / value.maxHealth.value, 1)}`"
		@mousedown="onMousedown"
	>
		<template v-if="value.anythingFilled.value && value.maxHealth.value !== 0">
			<label :for="`${idSuffix}-current-ability-health`">
				health
			</label>
			<input
				:id="`${idSuffix}-current-ability-health`"
				:value="Math.round(dragValueRef)"
				min="0"
				:max="value.maxHealth.value"
				type="number"
				@input="updateChampionHealth"
			>
			<span>/ {{ value.maxHealth.value }}</span>
		</template>
	</div>
</template>
