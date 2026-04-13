import type { IChampionAbilityId, IExtraComponentEmits, IExtraComponentProps, IGameAbilityId, IProviderGroupImageText } from '~/utils/types';
import { VExtrasBoolean, VExtrasNumber } from '#components';

// eslint-disable-next-line ts/consistent-type-definitions
type IDefineExtraComponentEmits = {
	imgMouseenter: (...args: IExtraComponentEmits['imgMouseenter']) => void;
};

export type IGameAbilitySpecific<T extends IGameAbilityId> = T extends IChampionAbilityId
	? T['id'] extends keyof TChampionSpecifics
		? T['dataSource'] extends 'internal'
			? TChampionSpecifics[T['id']]
			: T['abilityKey'] extends keyof TChampionSpecifics[T['id']]
				? T['abilityVariantIndex'] extends keyof TChampionSpecifics[T['id']][T['abilityKey']]
					? TChampionSpecifics[T['id']][T['abilityKey']][T['abilityVariantIndex']]
					: never
				: never
		: never
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

export async function numberExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: T['dataSource'] extends 'internal'
		? keyof IGameAbilityInternalData<T>
		: TupleIndexes<IGameAbilityEffectData<T>>,
	label: string,
	min?: number,
	max?: number,
	step?: number,
) {
	const isEffect = abilityId.dataSource === 'effects';
	const isSpecificExpected = abilityId.type !== ABILITY_TYPE.champion && abilityId.dataSource !== 'internal';

	return defineComponent<IExtraComponentProps<T['type']>, IDefineExtraComponentEmits>(async (props, ctx) => {
		const specific = resolveAbilitySpecific(abilityId, isSpecificExpected ? 'numberExtra' : undefined);
		const [imgSrc, imgSize] = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue, appliedEffect] = extraAppliedEffect(abilityId, isEffect, property, props.damageSource);

		return () => h(VExtrasNumber, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${stringifiedAbilityId}`,
			imgSrc,
			imgSize,
			label,
			min,
			max,
			step,
			'imgText': (specific as IProviderGroupImageText)?.itemImageText?.(props.damageSource, abilityId, property),
			'usedNumberInput': useNumberInput(
				isEffect
					? [appliedEffect!.data, property as number]
					: [props.damageSource[abilityId.type === ABILITY_TYPE.champion ? 'internalData' : 'internalItemData'], property as string],
				true,
				max,
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
	property: T['dataSource'] extends 'internal'
		? IGameAbilityInternalData<T> extends never
			? never
			: keyof IGameAbilityInternalData<T>
		: IGameAbilityEffectData<T> extends never
			? never
			: TupleIndexes<IGameAbilityEffectData<T>>,
	label: string,
	labelAppendOnTarget = false,
) {
	const isEffect = abilityId.dataSource === 'effects';

	return defineComponent<IExtraComponentProps<T['type']>, IDefineExtraComponentEmits>(async (props, ctx) => {
		const [imgSrc, imgSize] = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue] = extraAppliedEffect(abilityId, isEffect, property, props.damageSource);

		return () => h(VExtrasBoolean, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${stringifiedAbilityId}`,
			imgSrc,
			imgSize,
			'label': labelAppendOnTarget ? `${label} on target` : label,
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		}, ctx.slots);
	}, { props: ['damageSource', 'idPrefix', 'abilityId', 'onImgMouseenter'] });
}

export async function gameAbilityImage(abilityId: IGameAbilityId): Promise<[src: string, size: number]> {
	const { version } = usePatchVersion();

	if (abilityId.type === ABILITY_TYPE.item) {
		return [
			`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${abilityId.id}.png`,
			64,
		];
	}

	const { abilityImage, abilityImageSize } = useChampionImages();

	const champion = await useChampion(abilityId.id);

	return [
		abilityImage(champion.abilities[abilityId.abilityKey].variants[abilityId.abilityVariantIndex]!.image, abilityId.id),
		abilityImageSize(abilityId.id),
	];
}

function extraAppliedEffect(abilityId: IGameAbilityId, isEffect: boolean, property: PropertyKey, damageSource: DamageSource): [
	stringifiedAbilityId: string,
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

	const dataProperty = abilityId.type === ABILITY_TYPE.champion ? 'internalData' : 'internalItemData';

	return [
		GameAbilityId.stringify(abilityId),
		computed(() => isEffect
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
