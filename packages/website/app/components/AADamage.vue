<script setup lang="ts">
import type { IDisplayedStats, ITargetDummy } from '~/util/types';

const props = defineProps<{
	source: {
		stats: Pick<IDisplayedStats, 'attackDamage' | 'attackSpeed' | 'abilityPower' | 'critChance' | 'critDamageMultiplier' | 'lethality' | 'percentArmorPen' | 'flatMagicPen' | 'percentMagicPen'>;
	};
	target: ITargetDummy;
}>();

const aaDamage = computed(() => useDamage(props.source.stats.attackDamage, 'physical', props.target, props.source.stats));
const critDamage = computed(() => useDamage(props.source.stats.attackDamage * props.source.stats.critDamageMultiplier, 'physical', props.target, props.source.stats));
</script>

<template>
	<code class="text-green px-2 py-1 bg-black">
		eres: {{ aaDamage.effectiveResists }} <br>
		base: {{ aaDamage.postMitigationDamage }} <br>
		crit: {{ critDamage.postMitigationDamage }}
	</code>
</template>
