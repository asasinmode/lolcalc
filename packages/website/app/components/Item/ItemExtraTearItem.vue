<script setup lang="ts">
import type { IItemExtraProps } from '~/utils/types';
import { VExtrasNumber } from '#components';

const props = defineProps<IItemExtraProps<keyof typeof ALTERNATE_ITEM_FORMS>>();

defineEmits<{
	itemHover: [event: MouseEvent];
}>();

const items = useItems();
const { version } = usePatchVersion();

type IData = IInternalItemData<'tear'>;

const ALTERNATE_ITEM_FORMS = {
	[ITEM_NAME_TO_ID.whisperingCirclet]: ITEM_NAME_TO_ID.diademOfSongs,
	[ITEM_NAME_TO_ID.archangelsStaff]: ITEM_NAME_TO_ID.seraphsEmbrace,
	[ITEM_NAME_TO_ID.manamune]: ITEM_NAME_TO_ID.muramana,
	[ITEM_NAME_TO_ID.wintersApproach]: ITEM_NAME_TO_ID.fimbulwinter,
	[ITEM_NAME_TO_ID.diademOfSongs]: ITEM_NAME_TO_ID.whisperingCirclet,
	[ITEM_NAME_TO_ID.seraphsEmbrace]: ITEM_NAME_TO_ID.archangelsStaff,
	[ITEM_NAME_TO_ID.muramana]: ITEM_NAME_TO_ID.manamune,
	[ITEM_NAME_TO_ID.fimbulwinter]: ITEM_NAME_TO_ID.wintersApproach,
};

const TRANSFORMED_IDS = [
	ITEM_NAME_TO_ID.diademOfSongs,
	ITEM_NAME_TO_ID.seraphsEmbrace,
	ITEM_NAME_TO_ID.muramana,
	ITEM_NAME_TO_ID.fimbulwinter,
];

const UNTRANSFORMED_IDS = [
	ITEM_NAME_TO_ID.whisperingCirclet,
	ITEM_NAME_TO_ID.archangelsStaff,
	ITEM_NAME_TO_ID.manamune,
	ITEM_NAME_TO_ID.wintersApproach,
];

const itemIndex = computed(() => props.value.items.value.findIndex(item => item?.id === props.itemId || item?.id === ALTERNATE_ITEM_FORMS[props.itemId]));
const transformedItem = computed(() => items[ALTERNATE_ITEM_FORMS[props.itemId]]!);

const isTransformed = ref((TRANSFORMED_IDS as string[]).includes(props.itemId));

function transform() {
	// eslint-disable-next-line vue/no-mutating-props
	props.value.items.value[itemIndex.value] = transformedItem.value;
	isTransformed.value = !isTransformed.value;
	(props.value.internalItemData.value as IData).manaflow = 360;
	if (!isTransformed.value) {
		for (let i = 0; i < props.value.items.value.length; i++) {
			const item = props.value.items.value[i];
			if (item && i !== itemIndex.value && (UNTRANSFORMED_IDS as string[]).includes(item.id)) {
				// eslint-disable-next-line vue/no-mutating-props
				props.value.items.value[i] = items[(ALTERNATE_ITEM_FORMS as Record<string, string>)[item.id]!];
			} else if (item?.id === ITEM_NAME_TO_ID.tear) {
				// eslint-disable-next-line vue/no-mutating-props
				props.value.items.value[i] = undefined;
			}
		}
	}
}

function updateValue(value: number) {
	if (!isTransformed.value) {
		(props.value.internalItemData.value as IData).manaflow = value;
	}
}
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<VExtrasNumber
		:model-value="isTransformed ? 1000 : (value.internalItemData.value as IData).manaflow"
		class="item-extra-tear"
		:img="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`"
		:img-text="ITEM_SPECIFICS[itemId as keyof TItemSpecifics]?.itemImageText?.(props.value.internalItemData.value)"
		img-size="64"
		label="Manaflow stacks"
		:used-number-input="useNumberInput([value.internalItemData as Ref<IData>, 'manaflow'])"
		:max="360"
		:step="4"
		:value
		:id-prefix="`${idPrefix}-${itemId}`"
		:item-id
		:disabled="isTransformed"
		@update:model-value="updateValue"
		@img-mouseenter="$emit('itemHover', $event)"
	>
		<button class="pretend-ui-button" title="transform" @click="transform">
			<span> transform </span>
			<Icon class="i-ph:arrows-clockwise-bold" />
		</button>
	</VExtrasNumber>
</template>

<style>
@layer components {
	.v-extras-number.item-extra-tear {
		--at-apply: 'relative';

		> label + button {
			--at-apply: 'absolute end-2 top-2 grid-center size-6 z-1';

			> span:first-child {
				--at-apply: 'sr-only';
			}

			> span.icon {
				--at-apply: 'size-4';
			}
		}
	}
}
</style>
