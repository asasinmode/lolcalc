<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';

const props = defineProps<{
	idSuffix: string;
	value: DamageSource<'Kled'>;
	healthResourceSliderEvents: (target: Ref<number>, max: Ref<number>, element: Ref<HTMLElement | null>) => {
		onMousedown: (e: MouseEvent) => void;
		cleanup: () => void;
		dragValueRef: Ref<number>;
	};
	/* from `useNumberInput` */
	updateChampionHealth: (e: Event) => void;
}>();

const kledMaxHP = computed(() => Math.ceil(props.value.stats.value.baseOnLevel.hp));
const skaarlMaxHP = computed(() => Math.floor(props.value.stats.value.bonus.hp + (props.value.stats.value.variables.kledSkaarlHP ?? 0)));

const kledCurrentHp = computed<number>({
	get() {
		return props.value.internalData.value.kledCurrentHP;
	},
	set(value) {
		props.value.internalData.value.kledCurrentHP = value;
	},
});
const skaarlCurrentHp = computed<number>({
	get() {
		return props.value.internalData.value.skaarlCurrentHP;
	},
	set(value) {
		props.value.internalData.value.skaarlCurrentHP = value;
	},
});

const kledBarEl = useTemplateRef('kledBar');
const {
	cleanup: kledCleanup,
	onMousedown: kledOnMousedown,
	dragValueRef: kledDragValueRef,
} = props.healthResourceSliderEvents(kledCurrentHp, kledMaxHP, kledBarEl);
const skaarlBarEl = useTemplateRef('skaarlBar');
const {
	cleanup: skaarlCleanup,
	onMousedown: skaarlOnMousedown,
	dragValueRef: skaarlDragValueRef,
} = props.healthResourceSliderEvents(skaarlCurrentHp, skaarlMaxHP, skaarlBarEl);

onBeforeUnmount(() => {
	kledCleanup();
	skaarlCleanup();
});
</script>

<template>
	<div class="current-health" :style="`--kled-bar-w-percent: ${(kledMaxHP / value.stats.value.total.hp * 100).toFixed(4)}%;`">
		<div
			ref="kledBar"
			:style="`--fill-percentage: ${Math.min(kledDragValueRef / kledMaxHP, 1)}`"
			@mousedown="kledOnMousedown"
		>
			<label :for="`${idSuffix}-current-ability-health-kled`">
				Kled health
			</label>
			<input
				:id="`${idSuffix}-current-ability-health`"
				:value="Math.round(kledDragValueRef)"
				min="0"
				:max="value.maxHealth.value"
				type="number"
				@input="updateChampionHealth"
			>
			<span>/ {{ kledMaxHP }}</span>
		</div>
		<div
			ref="skaarlBar"
			:style="`--fill-percentage: ${Math.min(skaarlDragValueRef / skaarlMaxHP, 1)}`"
			@mousedown="skaarlOnMousedown"
		>
			<label :for="`${idSuffix}-current-ability-health-skaarl`">
				Skaarl health
			</label>
			<input
				:id="`${idSuffix}-current-ability-health-skaarl`"
				:value="Math.round(skaarlDragValueRef)"
				min="0"
				:max="value.maxHealth.value"
				type="number"
				@input="updateChampionHealth"
			>
			<span>/ {{ skaarlMaxHP }}</span>
		</div>
	</div>
</template>

<style>
@layer overrides {
	[data-scoreboard-item='Kled'] {
		.current-health {
			--at-apply: 'gap-x-0';

			> div {
				--at-apply: 'gap-x-1.25';

				&:first-child {
					--at-apply: 'basis-[--kled-bar-w-percent] b-e b-[0.5px] b-neutral-400';
				}

				&:last-child {
					--at-apply: 'flex-1 b-s b-[0.5px] b-neutral-400';
					--fill-bg: theme('colors.amber.600');
				}
			}
		}
	}
}
</style>
