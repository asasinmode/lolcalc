import type { IItemExtraProps } from '~/utils/types';
import { VExtrasNumber } from '#components';

export function numberExtra<T extends keyof TItemSpecifics>(
	itemId: T,
	property: T extends keyof TItemSpecifics ? keyof IInternalItemData<any, T> : never,
	label: string,
	min?: number,
	max?: number,
	step?: number,
) {
	return defineComponent<IItemExtraProps, {
		itemHover: (event: MouseEvent) => void;
	}>((props, ctx) => {
		const { version } = usePatchVersion();

		return () => h(VExtrasNumber, {
			'modelValue': props.value.internalItemData.value?.[property],
			'idPrefix': `${props.idPrefix}-${property as string}`,
			'img': `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`,
			'imgSize': 64,
			label,
			min,
			max,
			step,
			'imgText': (ITEM_SPECIFICS[itemId] as any)?.itemImageText?.(props.value.internalItemData.value, property as any),
			'usedNumberInput': useNumberInput([props.value.internalItemData, property as string], true, max),
			onImgMouseenter(event) {
				ctx.emit('itemHover', event);
			},
			'onUpdate:modelValue': function (value) {
				props.value.internalItemData.value[property] = value;
			},
		});
	}, { props: ['value', 'idPrefix', 'itemId'] });
}
