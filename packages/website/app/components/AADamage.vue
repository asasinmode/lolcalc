<script setup lang="ts">
import type { IDisplayedStats, ITargetDummy } from '~/util/types';

const props = defineProps<{
	source: {
		stats: Pick<IDisplayedStats, 'attackDamage' | 'attackSpeed' | 'abilityPower'>;
	};
	target: ITargetDummy;
}>();

const aaDamage = computed(() => useDamage(props.source.stats.attackDamage, 'physical', props.target));
</script>

<template>
	<code class="text-green px-2 py-1 bg-black">
		aa damage: {{ aaDamage }}
	</code>
</template>
