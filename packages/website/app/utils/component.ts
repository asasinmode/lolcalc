import type { IExtraComponentProps, IGameAbilityId, IGameAbilitySource } from '~/utils/types';
import { VExtrasBoolean, VExtrasNumber } from '#components';

export type IGameAbilitySpecific<T extends IGameAbilityId> = T['type'] extends 'champion'
	? T['id'] extends keyof TChampionSpecifics ? TChampionSpecifics[T['id']] : never
	: T['id'] extends keyof TItemSpecifics ? TItemSpecifics[T['id']] : never;

export type IGameAbilityInternalData<T extends IGameAbilityId, Specific = IGameAbilitySpecific<T>>
	= Specific extends { setupInternalData: (...args: any) => any }
		? ReturnType<Specific['setupInternalData']>
		: never;

export type IGameAbilityEffectData<T extends IGameAbilityId, Specific = IGameAbilitySpecific<T>>
	= Specific extends { setupEffectData: (...args: any) => any }
		? ReturnType<Specific['setupEffectData']>
		: never;

type TupleKeys<T extends readonly unknown[]> = Exclude<keyof T, keyof any[]>;
type TupleIndexes<T extends readonly unknown[]> = TupleKeys<T> extends `${infer N extends number}` ? N : never;

export function numberExtra<T extends IGameAbilityId, U extends IGameAbilitySource>(
	abilityId: T,
	abilitySource: U,
	/**
	 * if `IDamageSourceEffectAccessPath`, then the target will be the `DamageSource.appliedEffects` resolved from it
	 * otherwise the target property of the `internalItemData` for specified `itemId`
	 */
	property: U extends 'internal'
		? IGameAbilityInternalData<T> extends never
			? never
			: keyof IGameAbilityInternalData<T>
		: IGameAbilityEffectData<T> extends never
			? never
			: TupleIndexes<IGameAbilityEffectData<T>>,
	label: string,
	min?: number,
	max?: number,
	step?: number,
) {
	const isEffect = abilitySource === 'effect';

	return defineComponent<IExtraComponentProps<T['type']>, {
		itemHover: (event: MouseEvent) => void;
	}>((props, ctx) => {
		const { version } = usePatchVersion();

		const [idSuffix, modelValue, updateValue, appliedEffect] = extraAppliedEffect(abilityId, isEffect, property, props.value);

		let img, imgSize;

		// if(abilityId.type === 'champion'){
		// 	img = abilityImage(precomputedDescription.variant.image, champion.id, `${sourceProperty.value}s`);
		// 	imgSize = abilityImageSize(champion.id);
		// }

		return () => h(VExtrasNumber, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${idSuffix}`,
			'img': `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${championOrItemId}.png`,
			'imgSize': abilityImageSize,
			label,
			min,
			max,
			step,
			'imgText': (ITEM_SPECIFICS[championOrItemId] as any)?.itemImageText?.(props.value.internalItemData.value, propertyPath),
			'usedNumberInput': useNumberInput(
				isEffect
					? [appliedEffect!.data, property as number]
					: [props.value.internalItemData, property as string],
				true,
				max,
			),
			onImgMouseenter(event) {
				ctx.emit('itemHover', event);
			},
			'onUpdate:modelValue': updateValue,
		});
	}, { props: ['value', 'idPrefix', 'abilityId'] });
}

export function booleanExtra<T extends IChampionId | (keyof TItemSpecifics)>(
	championOrItemId: T,
	/**
	 * if `IDamageSourceEffectAccessPath`, then the target will be the `DamageSource.appliedEffects` resolved from it
	 * otherwise the target property of the `internalItemData` for specified `itemId`
	 */
	propertyPath: (T extends keyof TItemSpecifics ? keyof IInternalItemData<any, T> : T extends IChampionId ? keyof IInternalChampionData<T> : never) | IDamageSourceEffectAccessPath,
	label: string,
) {
	const isProperty = typeof propertyPath === 'string';

	return defineComponent<IExtraComponentProps<T['type']>, {
		itemHover: (event: MouseEvent) => void;
	}>((props, ctx) => {
		const { version } = usePatchVersion();

		const [idSuffix, modelValue, updateValue] = extraAppliedEffect(isProperty, propertyPath, props.value);

		return () => h(VExtrasBoolean, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${idSuffix}`,
			'img': `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${championOrItemId}.png`,
			'imgSize': 64,
			label,
			onImgMouseenter(event) {
				ctx.emit('itemHover', event);
			},
			'onUpdate:modelValue': updateValue,
		});
	}, { props: ['value', 'idPrefix', 'abilityId'] });
}

function extraAppliedEffect(abilityId: IGameAbilityId, isEffect: boolean, property: PropertyKey, damageSource: DamageSource): [
	idSuffix: string,
	value: ComputedRef<any>,
	updateValue: (value: any) => void,
	appliedEffect: IDamageSourceEffect | undefined,
] {
	const appliedEffect = isEffect
		? damageSource.appliedEffects.value.find(effect => GameAbilityId.isSame(effect.abilityId, abilityId))
		: undefined;

	if (isEffect && !appliedEffect) {
		console.error(`[numberExtra] failed to resolve effect from`, abilityId, damageSource.appliedEffects);
	}

	return [
		GameAbilityId.stringify(abilityId),
		computed(() => isEffect
			? appliedEffect?.data[property as number]
			: damageSource.internalItemData.value?.[property as string]),
		function updateValue(value: any) {
			if (isEffect) {
				appliedEffect!.data[property as number] = value;
			} else {
				damageSource.internalItemData.value[property] = value;
			}
		},
		appliedEffect,
	];
}
