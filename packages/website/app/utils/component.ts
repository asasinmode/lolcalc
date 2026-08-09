import type { DamageSource, IDamageSource, IDamageSourceEffect } from '@lolcalc/core/DamageSource';
import type { IGameAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IEffectControlsProps, IGameAbilityData, ISelectEffectSourceProps } from '@lolcalc/core/specifics';
import type { ComputedRef, SlotsType } from 'vue';
import type { IExtraComponentEmits, IExtraComponentProps } from './types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { gameAbilityImage } from '@lolcalc/core/misc';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { CHAMPION_ID_TO_KEY } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';
import { CalculatorEffectControls, CalculatorEffectSourceSelect, CalculatorExtraBoolean, CalculatorExtraEnum, CalculatorExtraNumber, CalculatorExtraProgress } from '#components';

export async function numberExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: DataKeys<IGameAbilityData<T>>,
	label: string,
	min?: number,
	max?: MaybeRef<number> | ((self: DamageSource) => Promise<MaybeRef<number>> | MaybeRef<number>),
	step?: MaybeRef<number> | ((self: DamageSource) => MaybeRef<number>),
) {
	return defineComponent<IExtraComponentProps, IDefineExtraComponentEmits>(async (props, ctx) => {
		const imgSrc = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue, appliedEffect] = extraComponentData(abilityId, property, props.damageSource);

		let localMax = max;
		if (typeof localMax === 'function') {
			localMax = await localMax(props.damageSource);
		}

		let localStep = step;
		if (typeof localStep === 'function') {
			localStep = localStep(props.damageSource);
		}

		return () => h(CalculatorExtraNumber, {
			'modelValue': modelValue.value,
			'idSuffix': `${props.idSuffix}-${stringifiedAbilityId}-${property as string}`,
			imgSrc,
			label,
			min,
			'max': toValue(localMax),
			'step': toValue(localStep),
			'usedNumberInput': useNumberInput(
				abilityId.type === AbilityType.effect
					/* effect components are displayed in effects dialog even when not present on damage source so they should handle adding themselves onto it when changed */
					? () => [appliedEffect?.value?.data.value ?? props.damageSource.addEffect(abilityId).data.value, property as number]
					: [
							props.damageSource[abilityId.type === AbilityType.champion
								? 'internalData'
								: abilityId.type === AbilityType.dragon
									? 'internalDragonData'
									: 'internalItemData'],
							property as string,
						],
				localStep === undefined || Number.isInteger(toValue(localStep)),
				localMax,
			),
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		}, ctx.slots);
	}, { props: ['damageSource', 'idSuffix', 'abilityId', 'onImgMouseenter'] });
}

export async function progressExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: DataKeys<IGameAbilityData<T>>,
	label: string,
	getDerivedValue: (progress: number, self: DamageSource) => number,
	{
		effectControlsProps,
		selectEffectSourceProps,
		derivedSymbolSuffix = '%',
	}: {
		effectControlsProps?: IEffectControlsProps<any>;
		selectEffectSourceProps?: ISelectEffectSourceProps;
		derivedSymbolSuffix?: string;
	} = {},
) {
	return defineComponent<IExtraComponentProps, IDefineExtraComponentEmits>(async (props, ctx) => {
		const imgSrc = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue, appliedEffect] = extraComponentData(abilityId, property, props.damageSource);

		const effectControlModel = effectControlsProps?.model(props.damageSource);
		function effectControlUpdateValue(val?: boolean) {
			effectControlModel!.value = val;
		}
		function effectControlRefresh() {
			effectControlsProps!.refresh(props.damageSource);
		}

		const selectEffectSourceInvalidMessage = selectEffectSourceProps?.invalidMessage && computed(() => appliedEffect?.value?.source.value && selectEffectSourceProps.invalidMessage(appliedEffect?.value?.source.value));
		function updateEffectSource(value?: DamageSource) {
			if (appliedEffect?.value) {
				appliedEffect.value.source.value = value;
			}
		}

		return () => h(CalculatorExtraProgress, {
			'modelValue': modelValue.value,
			'idSuffix': `${props.idSuffix}-${stringifiedAbilityId}-${property as string}`,
			imgSrc,
			label,
			'deriveValue': (progress: number) => getDerivedValue(progress, props.damageSource),
			derivedSymbolSuffix,
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
			'data-inactive': effectControlsProps && !effectControlModel?.value ? '' : undefined,
		}, effectControlsProps
			? { default: () => [
					createEffectControls(props.idSuffix, effectControlModel!.value, effectControlUpdateValue, effectControlRefresh, ctx.slots),
					selectEffectSourceInvalidMessage && createSelectEffectSource(props.idSuffix, appliedEffect?.value?.source.value, updateEffectSource, selectEffectSourceInvalidMessage),
				] }
			: { default: () => {
					const defaultSlots = ctx.slots.default?.();
					return [
						...(Array.isArray(defaultSlots) ? defaultSlots : [defaultSlots]),
						selectEffectSourceInvalidMessage && createSelectEffectSource(props.idSuffix, appliedEffect?.value?.source.value, updateEffectSource, selectEffectSourceInvalidMessage),
					];
				} });
	}, { props: ['damageSource', 'idSuffix', 'abilityId', 'onImgMouseenter'] });
}

export async function booleanExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: DataKeys<IGameAbilityData<T>>,
	label: string,
	labelPrefixApply = true,
	labelAppendOnTarget = false,
	tooltip?: string,
) {
	return defineComponent<IExtraComponentProps, IDefineExtraComponentEmits>(async (props, ctx) => {
		const imgSrc = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue] = extraComponentData(abilityId, property, props.damageSource);

		return () => h(CalculatorExtraBoolean, {
			'modelValue': modelValue.value,
			'idSuffix': `${props.idSuffix}-${stringifiedAbilityId}-${property as string}`,
			imgSrc,
			labelPrefixApply,
			tooltip,
			'label': labelAppendOnTarget ? `${label} on target` : label,
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		}, ctx.slots);
	}, { props: ['damageSource', 'idSuffix', 'abilityId', 'onImgMouseenter'] });
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
	return defineComponent<IExtraComponentProps, IDefineExtraComponentEmits>(async (props, ctx) => {
		const imgSrc = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue] = extraComponentData(abilityId, property, props.damageSource);

		return () => h(CalculatorExtraEnum, {
			'modelValue': modelValue.value,
			'idSuffix': `${props.idSuffix}-${stringifiedAbilityId}-${property as string}`,
			imgSrc,
			label,
			options,
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		}, ctx.slots);
	}, { props: ['damageSource', 'idSuffix', 'abilityId', 'onImgMouseenter'] });
}

function extraComponentData(abilityId: IGameAbilityId, property: PropertyKey, damageSource: DamageSource): [
	stringifiedAbilityId: string,
	value: ComputedRef<any>,
	updateValue: (value: any) => void,
appliedEffect: ComputedRef<IDamageSourceEffect | undefined> | undefined,
] {
	const isEffect = abilityId.type === AbilityType.effect;
	const appliedEffect = isEffect
		? computed<IDamageSourceEffect | undefined>(() => damageSource.appliedEffects.value.find(effect => effect.abilityId.id === abilityId.id))
		: undefined;

	const dataProperty: keyof IDamageSource = abilityId.type === AbilityType.champion
		? 'internalData'
		: abilityId.type === AbilityType.dragon
			? 'internalDragonData'
			: 'internalItemData';

	return [
		GameAbilityId.stringify(abilityId, CHAMPION_ID_TO_KEY, EFFECT_SPECIFICS_OBJECT_ENTRIES),
		computed(() => isEffect
			? (appliedEffect?.value?.data.value[property as number] ?? 0)
			: damageSource[dataProperty].value?.[property as string],
		),
		function updateValue(value: any) {
			if (isEffect) {
				if (appliedEffect?.value) {
					appliedEffect.value.data.value[property as number] = value;
				} else {
					/* effect components are displayed in effects dialog even when not present on damage source so they should handle adding themselves onto it when changed */
					damageSource.addEffect(abilityId, [value]);
				}
			} else {
				damageSource[dataProperty].value[property] = value;
			}
		},
		appliedEffect,
	];
}

function createEffectControls(
	idSuffix: string,
	modelValue: boolean | undefined,
	updateValue: (value: boolean | undefined) => void,
	refresh: () => void,
	slots: SlotsType,
) {
	return h(
		CalculatorEffectControls,
		{
			idSuffix,
			modelValue,
			'onUpdate:modelValue': updateValue,
			'onRefresh': refresh,
		},
		slots,
	);
}

function createSelectEffectSource(
	idSuffix: string,
	modelValue: DamageSource | undefined,
	updateValue: (value: DamageSource | undefined) => void,
	invalidMessage: ComputedRef<ReturnType<ISelectEffectSourceProps['invalidMessage']>>,
) {
	return h(CalculatorEffectSourceSelect, {
		idSuffix,
		modelValue,
		'onUpdate:modelValue': updateValue,
		'invalidMessage': invalidMessage.value,
	});
}

type TupleKeys<T extends readonly unknown[]> = Exclude<keyof T, keyof any[]>;
type TupleIndexes<T extends readonly unknown[]> = TupleKeys<T> extends `${infer N extends number}` ? N : never;
type DataKeys<T> = T extends any[] ? TupleIndexes<T> : keyof T;

// eslint-disable-next-line ts/consistent-type-definitions
type IDefineExtraComponentEmits = {
	imgMouseenter: (...args: IExtraComponentEmits['imgMouseenter']) => void;
};
