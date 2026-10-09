<script setup vapor lang="ts">
import { resolveAbilitySpecific } from '@lolcalc/core/DamageSource';
import type { IItemAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics';
import type { IItemSpecific } from '@lolcalc/core/specifics/item';
import type { TItems } from '@lolcalc/data';
import { imgUrl, ITEMS } from '@lolcalc/data';
import { ITEM_NAME_TO_ID, TEAR_ITEM_TRANSFORMATIONS, TRANSFORMED_TEAR_ITEM_IDS, UNTRANSFORMED_TEAR_ITEM_IDS } from '@lolcalc/shared';

import { CalculatorExtraNumber } from '#components';
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';

const props = defineProps<
	IExtraComponentProps & {
		abilityId: IItemAbilityId;
	}
>();

defineEmits<IExtraComponentEmits>();

type IData = IInternalItemDataOf<'tear'>;

const itemIndex = computed(() => props.damageSource.items.value.findIndex((item) => item?.id === props.abilityId.id || item?.id === TEAR_ITEM_TRANSFORMATIONS[props.abilityId.id]));
const transformedItem = computed(() => ITEMS[TEAR_ITEM_TRANSFORMATIONS[props.abilityId.id]!]!);

const isTransformed = ref((TRANSFORMED_TEAR_ITEM_IDS as string[]).includes(props.abilityId.id));

function transform() {
	props.damageSource.items.value[itemIndex.value] = transformedItem.value;
	isTransformed.value = !isTransformed.value;
	(props.damageSource.internalItemData.value as IData).manaflow = 360;
	if (!isTransformed.value) {
		for (let i = 0; i < props.damageSource.items.value.length; i++) {
			const item = props.damageSource.items.value[i];
			if (item && i !== itemIndex.value && (UNTRANSFORMED_TEAR_ITEM_IDS as string[]).includes(item.id)) {
				props.damageSource.items.value[i] = ITEMS[(TEAR_ITEM_TRANSFORMATIONS as Record<string, string>)[item.id]!];
			} else if (item?.id === ITEM_NAME_TO_ID.tear) {
				props.damageSource.items.value[i] = undefined;
			}
		}
	}
}

function updateValue(value: number | undefined) {
	if (!isTransformed.value) {
		(props.damageSource.internalItemData.value as IData).manaflow = value!;
	}
}

const step = computed(() => (ITEMS as TItems)[props.abilityId.id as (typeof UNTRANSFORMED_TEAR_ITEM_IDS)[number]].dataValues.ManaPerCharge ?? 3);
</script>

<template>
	<CalculatorExtraNumber
		:model-value="isTransformed ? 1000 : (damageSource.internalItemData.value as IData).manaflow"
		:img-src="[imgUrl(`img/item/${abilityId.id}.png`, true), 64]"
		:img-text="(resolveAbilitySpecific<any>(abilityId) as IItemSpecific)?.imgText?.(damageSource, abilityId)"
		label="Manaflow stacks"
		:used-number-input="useNumberInput([damageSource.internalItemData as Ref<IData>, 'manaflow'])"
		:max="360"
		:step
		:id-suffix="`${abilityId.id}-${idSuffix}`"
		:disabled="isTransformed"
		@update:model-value="updateValue"
		@img-mouseenter="$emit('imgMouseenter', $event, props.abilityId)"
	>
		<button class="pretend-ui-btn" title="transform" @click="transform">
			<span> transform </span>
			<Icon class="i-ph:arrows-clockwise-bold" />
		</button>
	</CalculatorExtraNumber>
</template>
