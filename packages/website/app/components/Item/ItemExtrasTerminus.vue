<script setup lang="ts">
import type { IExtraComponentProps } from '~/utils/types';

defineProps<IExtraComponentProps<'item'>>();

defineEmits<{
	itemHover: [event: MouseEvent];
}>();

const { itemImageText } = ITEM_SPECIFICS[ITEM_NAME_TO_ID.terminus];

const LightComponent = numberExtra({ type: ABILITY_TYPE.item, id: ITEM_NAME_TO_ID.terminus }, 'jxtpL', 'Juxtaposition light stacks', 0, 3);
const DarkComponent = numberExtra({ type: ABILITY_TYPE.item, id: ITEM_NAME_TO_ID.terminus }, 'jxtpD', 'Juxtaposition dark stacks', 0, 3);
</script>

<template>
	<LightComponent
		:ability-id
		:value
		:id-prefix
		:img-text="itemImageText(value.internalItemData.value)"
		@item-hover="$emit('itemHover', $event)"
	/>
	<DarkComponent
		:ability-id
		:value
		:id-prefix
		:img-text="itemImageText(value.internalItemData.value)"
		@item-hover="$emit('itemHover', $event)"
	/>
</template>
