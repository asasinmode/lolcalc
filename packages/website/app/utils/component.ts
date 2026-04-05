import { VExtrasNumber } from '#components';

export function numberExtra<T extends TItemNameToId[keyof TItemNameToId]>(
	itemId: T,
	property: T extends keyof TItemSpecifics ? keyof IInternalItemData<any, T> : never,
	label: string,
	min?: number,
	max?: number,
	step?: number,
) {
	return defineComponent<{
		value: DamageSource;
		idPrefix: string;
		itemId: string;
	}, {
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
