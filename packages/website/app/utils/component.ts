import type { IDamageSourceEffectAccessPath, IItemExtraProps } from '~/utils/types';
import { VExtrasBoolean, VExtrasNumber } from '#components';

export function numberExtra<T extends keyof TItemSpecifics>(
	itemId: T,
	/**
	 * if `IDamageSourceEffectAccessPath`, then the target will be the `DamageSource.appliedEffects` resolved from it
	 * otherwise the target property of the `internalItemData` for specified `itemId`
	 */
	propertyPath: T extends keyof TItemSpecifics ? keyof IInternalItemData<any, T> | IDamageSourceEffectAccessPath : never,
	label: string,
	min?: number,
	max?: number,
	step?: number,
) {
	const isProperty = typeof propertyPath === 'string';

	return defineComponent<IItemExtraProps, {
		itemHover: (event: MouseEvent) => void;
	}>((props, ctx) => {
		const { version } = usePatchVersion();

		const [idSuffix, modelValue, updateValue, appliedEffect] = extraAppliedEffect(isProperty, propertyPath, props.value);

		return () => h(VExtrasNumber, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${idSuffix}`,
			'img': `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`,
			'imgSize': 64,
			label,
			min,
			max,
			step,
			'imgText': (ITEM_SPECIFICS[itemId] as any)?.itemImageText?.(props.value.internalItemData.value, propertyPath),
			'usedNumberInput': useNumberInput(
				isProperty
					? [props.value.internalItemData, propertyPath as string]
					: [appliedEffect!.data, (propertyPath as IDamageSourceEffectAccessPath)[1]],
				true,
				max,
			),
			onImgMouseenter(event) {
				ctx.emit('itemHover', event);
			},
			'onUpdate:modelValue': updateValue,
		});
	}, { props: ['value', 'idPrefix', 'itemId'] });
}

export function booleanExtra<T extends keyof TItemSpecifics>(
	itemId: T,
	/**
	 * if `IDamageSourceEffectAccessPath`, then the target will be the `DamageSource.appliedEffects` resolved from it
	 * otherwise the target property of the `internalItemData` for specified `itemId`
	 */
	propertyPath: T extends keyof TItemSpecifics ? keyof IInternalItemData<any, T> | IDamageSourceEffectAccessPath : never,
	label: string,
) {
	const isProperty = typeof propertyPath === 'string';

	return defineComponent<IItemExtraProps, {
		itemHover: (event: MouseEvent) => void;
	}>((props, ctx) => {
		const { version } = usePatchVersion();

		const [idSuffix, modelValue, updateValue] = extraAppliedEffect(isProperty, propertyPath, props.value);

		return () => h(VExtrasBoolean, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${idSuffix}`,
			'img': `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`,
			'imgSize': 64,
			label,
			onImgMouseenter(event) {
				ctx.emit('itemHover', event);
			},
			'onUpdate:modelValue': updateValue,
		});
	}, { props: ['value', 'idPrefix', 'itemId'] });
}

function extraAppliedEffect(isProperty: boolean, propertyPath: PropertyKey | IDamageSourceEffectAccessPath, damageSource: DamageSource): [
idSuffix: string,
	value: ComputedRef<any>,
	updateValue: (value: any) => void,
appliedEffect: IDamageSourceEffect | undefined,
] {
	const appliedEffect = isProperty
		? undefined
		: damageSource.appliedEffects.value.find((effect) => {
				const { type, championOrItemId, abilityKey, abilityVariantIndex } = (propertyPath as IDamageSourceEffectAccessPath)[0];
				return effect.type === type && effect.championOrItemId === championOrItemId && effect.abilityKey === abilityKey && effect.abilityVariantIndex === abilityVariantIndex;
			});

	if (!isProperty && !appliedEffect) {
		console.error(`[numberExtra] failed to resolve effect from`, propertyPath, damageSource.appliedEffects);
	}

	return [
		isProperty ? propertyPath as string : `${(propertyPath as IDamageSourceEffectAccessPath)[0].championOrItemId}-${(propertyPath as IDamageSourceEffectAccessPath)[1]}`,
		computed(() => isProperty ? damageSource.internalItemData.value?.[propertyPath as string] : appliedEffect?.data[(propertyPath as IDamageSourceEffectAccessPath)[1]]),
		function updateValue(value: any) {
			if (isProperty) {
				damageSource.internalItemData.value[propertyPath as string] = value;
			} else {
				appliedEffect!.data[(propertyPath as IDamageSourceEffectAccessPath)[1]] = value;
			}
		},
		appliedEffect,
	];
}
