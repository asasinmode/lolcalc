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

export function numberExtra<T extends IGameAbilityId>(
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

	return defineComponent<IExtraComponentProps<T['type']>, IDefineExtraComponentEmits>((props, ctx) => {
		const specific = resolveAbilitySpecific(abilityId, 'numberExtra');
		const [imgSrc, imgSize] = gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue, appliedEffect] = extraAppliedEffect(abilityId, isEffect, property, props.damageSource);

		return () => h(VExtrasNumber, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${stringifiedAbilityId}`,
			'imgSrc': toValue(imgSrc),
			imgSize,
			label,
			min,
			max,
			step,
			'imgText': (specific as IProviderGroupImageText)?.itemImageText?.(props.damageSource.internalItemData.value, abilityId, stringifiedAbilityId, property),
			'usedNumberInput': useNumberInput(
				isEffect
					? [appliedEffect!.data, property as number]
					: [props.damageSource.internalItemData, property as string],
				true,
				max,
			),
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		});
	}, { props: ['damageSource', 'idPrefix', 'abilityId'] });
}

export function booleanExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: T['dataSource'] extends 'internal'
		? IGameAbilityInternalData<T> extends never
			? never
			: keyof IGameAbilityInternalData<T>
		: IGameAbilityEffectData<T> extends never
			? never
			: TupleIndexes<IGameAbilityEffectData<T>>,
	label: string,
) {
	const isEffect = abilityId.dataSource === 'effects';

	return defineComponent<IExtraComponentProps<T['type']>, IDefineExtraComponentEmits>((props, ctx) => {
		const [imgSrc, imgSize] = gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue] = extraAppliedEffect(abilityId, isEffect, property, props.damageSource);

		return () => h(VExtrasBoolean, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${stringifiedAbilityId}`,
			'imgSrc': toValue(imgSrc),
			imgSize,
			label,
			onImgMouseenter(event) {
				ctx.emit('imgMouseenter', event, abilityId);
			},
			'onUpdate:modelValue': updateValue,
		});
	}, { props: ['damageSource', 'idPrefix', 'abilityId'] });
}

function gameAbilityImage(abilityId: IGameAbilityId): [
	src: MaybeRef<string>,
	size: number,
] {
	const { version } = usePatchVersion();

	if (abilityId.type === 'item') {
		return [
			`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${abilityId.id}.png`,
			64,
		];
	}

	const { abilityImage, abilityImageSize } = useChampionImages();

	const src = ref('');
	useChampion(abilityId.id).then((champion) => {
		src.value = abilityImage(champion.abilities[abilityId.abilityKey].variants[abilityId.abilityVariantIndex]!.image, abilityId.id);
	});

	return [src, abilityImageSize(abilityId.id)];
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
