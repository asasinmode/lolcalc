<script setup lang="ts">
import type { IInternalItemDataOf } from '@lolcalc/core/specifics';
import type { IItemSpecific } from '@lolcalc/core/specifics/item';
import type { TItems } from '@lolcalc/data';
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';
import { resolveAbilitySpecific } from '@lolcalc/core/DamageSource';
import { ITEMS, PATCH_VERSION } from '@lolcalc/data';
import { ITEM_NAME_TO_ID, TEAR_ITEM_TRANSFORMATIONS, TRANSFORMED_TEAR_ITEM_IDS, UNTRANSFORMED_TEAR_ITEM_IDS } from '@lolcalc/shared';

import { VExtrasNumber } from '#components';

const props = defineProps<IExtraComponentProps<'item'>>();

defineEmits<IExtraComponentEmits>();

const { vSemver } = PATCH_VERSION;

type IData = IInternalItemDataOf<'tear'>;

const itemIndex = computed(() => props.damageSource.items.value.findIndex(item => item?.id === props.abilityId.id || item?.id === TEAR_ITEM_TRANSFORMATIONS[props.abilityId.id]));
const transformedItem = computed(() => ITEMS[TEAR_ITEM_TRANSFORMATIONS[props.abilityId.id]!]!);

const isTransformed = ref((TRANSFORMED_TEAR_ITEM_IDS as string[]).includes(props.abilityId.id));

function transform() {
	// eslint-disable-next-line vue/no-mutating-props
	props.damageSource.items.value[itemIndex.value] = transformedItem.value;
	isTransformed.value = !isTransformed.value;
	(props.damageSource.internalItemData.value as IData).manaflow = 360;
	if (!isTransformed.value) {
		for (let i = 0; i < props.damageSource.items.value.length; i++) {
			const item = props.damageSource.items.value[i];
			if (item && i !== itemIndex.value && (UNTRANSFORMED_TEAR_ITEM_IDS as string[]).includes(item.id)) {
				// eslint-disable-next-line vue/no-mutating-props
				props.damageSource.items.value[i] = ITEMS[(TEAR_ITEM_TRANSFORMATIONS as Record<string, string>)[item.id]!];
			} else if (item?.id === ITEM_NAME_TO_ID.tear) {
				// eslint-disable-next-line vue/no-mutating-props
				props.damageSource.items.value[i] = undefined;
			}
		}
	}
}

function updateValue(value: number) {
	if (!isTransformed.value) {
		(props.damageSource.internalItemData.value as IData).manaflow = value;
	}
}

const step = computed(() => (ITEMS as TItems)[props.abilityId.id as typeof UNTRANSFORMED_TEAR_ITEM_IDS[number]].dataValues.ManaPerCharge ?? 3);
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<VExtrasNumber
		:model-value="isTransformed ? 1000 : (damageSource.internalItemData.value as IData).manaflow"
		:img-src="`https://ddragon.leagueoflegends.com/cdn/${vSemver}/img/item/${abilityId.id}.png`"
		:img-text="(resolveAbilitySpecific<any>(abilityId) as IItemSpecific)?.imgText?.(damageSource, abilityId)"
		img-size="64"
		label="Manaflow stacks"
		:used-number-input="useNumberInput([damageSource.internalItemData as Ref<IData>, 'manaflow'])"
		:max="360"
		:step
		:id-prefix="`${idPrefix}-${abilityId.id}`"
		:disabled="isTransformed"
		@update:model-value="updateValue"
		@img-mouseenter="$emit('imgMouseenter', $event, props.abilityId)"
	>
		<button class="pretend-ui-btn" title="transform" @click="transform">
			<span> transform </span>
			<Icon class="i-ph:arrows-clockwise-bold" />
		</button>
	</VExtrasNumber>
</template>
