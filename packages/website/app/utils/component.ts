import { VExtrasBoolean, VExtrasEnum, VExtrasNumber } from '#components';

export async function numberExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: DataKeys<IGameAbilityData<T>>,
	label: string,
	min?: number,
	max?: MaybeRef<number> | ((self: DamageSource) => Promise<MaybeRef<number>> | MaybeRef<number>),
	step?: number,
) {
	return defineComponent<IExtraComponentProps<T['type']>, IDefineExtraComponentEmits>(async (props, ctx) => {
		const [imgSrc, imgSize] = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue, appliedEffect] = extraAppliedEffect(abilityId, property, props.damageSource);

		let localMax = max;
		if (typeof localMax === 'function') {
			localMax = await localMax(props.damageSource);
		}

		return () => h(VExtrasNumber, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${stringifiedAbilityId}-${property}`,
			imgSrc,
			imgSize,
			label,
			min,
			'max': toValue(localMax),
			step,
			'usedNumberInput': useNumberInput(
				abilityId.type === ABILITY_TYPE.effect
					? [appliedEffect!.data, property as number]
					: [props.damageSource[abilityId.type === ABILITY_TYPE.champion ? 'internalData' : 'internalItemData'], property as string],
				true,
				localMax,
			),
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		}, ctx.slots);
	}, { props: ['damageSource', 'idPrefix', 'abilityId', 'onImgMouseenter'] });
}

export async function booleanExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: DataKeys<IGameAbilityData<T>>,
	label: string,
	labelPrefixApply = true,
	labelAppendOnTarget = false,
) {
	return defineComponent<IExtraComponentProps<T['type']>, IDefineExtraComponentEmits>(async (props, ctx) => {
		const [imgSrc, imgSize] = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue] = extraAppliedEffect(abilityId, property, props.damageSource);

		return () => h(VExtrasBoolean, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${stringifiedAbilityId}-${property}`,
			imgSrc,
			imgSize,
			labelPrefixApply,
			'label': labelAppendOnTarget ? `${label} on target` : label,
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		}, ctx.slots);
	}, { props: ['damageSource', 'idPrefix', 'abilityId', 'onImgMouseenter'] });
}

export async function enumExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: DataKeys<IGameAbilityData<T>>,
	label: string,
	/**
	 * ```ts
	 * {
	 *   [value1]: 'option 1 label',
	 *   [value2]: 'option 2 label',
	 * }
	 * ```
	 */
	options: Record<number, string>,
) {
	return defineComponent<IExtraComponentProps<T['type']>, IDefineExtraComponentEmits>(async (props, ctx) => {
		const [imgSrc, imgSize] = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue] = extraAppliedEffect(abilityId, property, props.damageSource);

		return () => h(VExtrasEnum, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${stringifiedAbilityId}-${property}`,
			imgSrc,
			imgSize,
			label,
			options,
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		}, ctx.slots);
	}, { props: ['damageSource', 'idPrefix', 'abilityId', 'onImgMouseenter'] });
}

function extraAppliedEffect(abilityId: IGameAbilityId, property: PropertyKey, damageSource: DamageSource): [
	stringifiedAbilityId: string,
	value: ComputedRef<any>,
	updateValue: (value: any) => void,
	appliedEffect: IDamageSourceEffect | undefined,
] {
	const isEffect = abilityId.type === ABILITY_TYPE.effect;
	const appliedEffect = isEffect
		? damageSource.appliedEffects.value.find(effect => effect.abilityId.id === abilityId.id)
		: undefined;

	if (isEffect && !appliedEffect) {
		console.error(`[numberExtra] failed to resolve effect from`, abilityId, damageSource.appliedEffects);
	}

	const dataProperty = abilityId.type === ABILITY_TYPE.champion ? 'internalData' : 'internalItemData';

	return [
		GameAbilityId.stringify(abilityId),
		computed(() =>
			isEffect
				? appliedEffect?.data[property as number]
				: damageSource[dataProperty].value?.[property as string]),
		function updateValue(value: any) {
			if (isEffect) {
				appliedEffect!.data[property as number] = value;
			} else {
				damageSource[dataProperty].value[property] = value;
			}
		},
		appliedEffect,
	];
}

type TupleKeys<T extends readonly unknown[]> = Exclude<keyof T, keyof any[]>;
type TupleIndexes<T extends readonly unknown[]> = TupleKeys<T> extends `${infer N extends number}` ? N : never;
type DataKeys<T> = T extends any[] ? TupleIndexes<T> : keyof T;

// eslint-disable-next-line ts/consistent-type-definitions
type IDefineExtraComponentEmits = {
	imgMouseenter: (...args: IExtraComponentEmits['imgMouseenter']) => void;
};
