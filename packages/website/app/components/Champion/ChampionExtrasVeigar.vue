<script setup lang="ts">
import type Veigar from '../../../public/data/champion/Veigar.json';

type IVeigar = typeof Veigar;

const props = defineProps<{
	value: DamageSource<'Veigar'>;
}>();

console.log('veigar extras', props.value.internalData.value);

const { minorVersion } = usePatchVersion();
</script>

<template>
	veigar things
</template>
