import { VExtrasNumber } from '#components';

/**
 * any item-related components
 */
export const ITEM_COMPONENTS: Record<string, { extras?: Component }> = {
	[ITEM_NAME_TO_ID.hubris]: {
		extras: numberExtra(ITEM_NAME_TO_ID.hubris, 'hubris', 'Eminence stacks'),
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		extras: numberExtra(ITEM_NAME_TO_ID.darkSeal, 'glory', 'Glory stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.mejai]: {
		extras: numberExtra(ITEM_NAME_TO_ID.mejai, 'glory', 'Glory stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		extras: numberExtra(ITEM_NAME_TO_ID.hauntingGuise, 'madness', 'Madness seconds in combat', 0, 3),
	},
};

function numberExtra<T extends TItemNameToId[keyof TItemNameToId]>(
	itemId: T,
	property: T extends keyof TItemSpecifics ? keyof IInternalItemData<any, T> : never,
	label: string,
	min?: number,
	max?: number,
) {
	return defineComponent<{
		value: DamageSource;
		idPrefix: string;
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
			'usedNumberInput': useNumberInput([props.value.internalItemData, property as string], true, max),
			onImgMouseenter(event) {
				ctx.emit('itemHover', event);
			},
			'onUpdate:modelValue': function (value) {
				props.value.internalItemData.value[property] = value;
			},
		});
	}, { props: ['value', 'idPrefix'] });
}
