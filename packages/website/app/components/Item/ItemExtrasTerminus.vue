<script setup lang="ts">
import type { IExtraComponentEmits, IExtraComponentProps, IItemAbilityId } from '~/utils/types';

const props = defineProps<IExtraComponentProps<'item'>>();

defineEmits<IExtraComponentEmits>();

type IId = IItemAbilityId<typeof ITEM_NAME_TO_ID.terminus, 'internal'>;

const LightComponent = numberExtra(props.abilityId as IId, 'jxtpL', 'Juxtaposition light stacks', 0, 3);
const DarkComponent = numberExtra(props.abilityId as IId, 'jxtpD', 'Juxtaposition dark stacks', 0, 3);
</script>

<template>
	<LightComponent
		:ability-id
		:damage-source
		:id-prefix
		@img-mouseenter="$emit('imgMouseenter', $event, abilityId)"
	/>
	<DarkComponent
		:ability-id
		:damage-source
		:id-prefix
		@img-mouseenter="$emit('imgMouseenter', $event, abilityId)"
	/>
</template>
