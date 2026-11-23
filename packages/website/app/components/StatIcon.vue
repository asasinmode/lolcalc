<script setup vapor lang="ts">
import { gameIconAttrs } from '@lolcalc/core/misc';
import type { STAT_ICON } from '@lolcalc/data';

const props = defineProps<{
	icon: (typeof STAT_ICON)[keyof typeof STAT_ICON];
}>();
</script>

<template>
	<img v-bind="gameIconAttrs(props.icon)" />
</template>
