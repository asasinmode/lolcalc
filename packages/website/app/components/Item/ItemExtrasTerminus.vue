<script setup lang="ts">
import type { IItemExtraProps } from '~/utils/types';

defineProps<IItemExtraProps>();

defineEmits<{
	itemHover: [event: MouseEvent];
}>();

const { itemImageText } = ITEM_SPECIFICS[ITEM_NAME_TO_ID.terminus];

const LightComponent = numberExtra(ITEM_NAME_TO_ID.terminus, 'jxtpL', 'Juxtaposition light stacks', 0, 3);
const DarkComponent = numberExtra(ITEM_NAME_TO_ID.terminus, 'jxtpD', 'Juxtaposition dark stacks', 0, 3);
</script>

<template>
	<LightComponent
		:value
		:id-prefix
		:item-id
		:img-text="itemImageText(value.internalItemData.value)"
		@item-hover="$emit('itemHover', $event)"
	/>
	<DarkComponent
		:value
		:id-prefix
		:item-id
		:img-text="itemImageText(value.internalItemData.value)"
		@item-hover="$emit('itemHover', $event)"
	/>
</template>
