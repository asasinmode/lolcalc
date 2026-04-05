<script setup lang="ts">
defineProps<{
	value: DamageSource;
	idPrefix: string;
}>();

defineEmits<{
	itemHover: [event: MouseEvent];
}>();

const LightComponent = numberExtra(ITEM_NAME_TO_ID.terminus, 'jxtpL', 'Juxtaposition light stacks', 0, 3);
const DarkComponent = numberExtra(ITEM_NAME_TO_ID.terminus, 'jxtpD', 'Juxtaposition dark stacks', 0, 3);
</script>

<template>
	<LightComponent :value :id-prefix @item-hover="$emit('itemHover', $event)" />
	<DarkComponent :value :id-prefix @item-hover="$emit('itemHover', $event)" />
</template>
