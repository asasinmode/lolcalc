<script setup lang="ts">
const props = defineProps<{
	value: DamageSource;
	idPrefix: string;
}>();

defineEmits<{
	itemHover: [event: MouseEvent];
}>();

const { version } = usePatchVersion();
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<VExtrasNumber
		v-model="value.internalItemData.value.hubrisStacks"
		:id-prefix
		:img="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${ITEM_NAME_TO_ID.hubris}.png`"
		img-size="64"
		label="Hubris stacks"
		:used-number-input="useNumberInput([props.value.internalItemData, 'hubrisStacks'])"
		@img-mouseenter="$emit('itemHover', $event)"
	/>
</template>
