import type { IChampionAbilityId, IEffectAbilityId, IExtraComponentEmits, IExtraComponentProps, IGameAbilityId } from '~/utils/types';
import { VExtrasBoolean, VExtrasEnum, VExtrasNumber } from '#components';

// eslint-disable-next-line ts/consistent-type-definitions
type IDefineExtraComponentEmits = {
	imgMouseenter: (...args: IExtraComponentEmits['imgMouseenter']) => void;
};

// for getting specific ability's specific, maybe will be useful
// ? T['id'] extends keyof TChampionSpecifics
// 	? T['abilityKey'] extends keyof TChampionSpecifics[T['id']]
// 		? T['abilityVariantIndex'] extends keyof TChampionSpecifics[T['id']][T['abilityKey']]
// 			? TChampionSpecifics[T['id']][T['abilityKey']][T['abilityVariantIndex']]
// 			: never
// 		: never
// 	: never

export type IGameAbilitySpecific<T extends IGameAbilityId> = T extends IChampionAbilityId
	? T['id'] extends keyof TChampionSpecifics
		? TChampionSpecifics[T['id']]
		: never
	: T extends IEffectAbilityId
		? T['id'] extends keyof TEffectSpecifics
			? TEffectSpecifics[T['id']]
			: never
		: T['id'] extends keyof TItemSpecifics
			? TItemSpecifics[T['id']]
			: never;

export type IGameAbilityData<T extends IGameAbilityId, Specific = IGameAbilitySpecific<T>>
	= Specific extends { setupData: (...args: any) => any }
		? ReturnType<Specific['setupData']>
		: never;

type TupleKeys<T extends readonly unknown[]> = Exclude<keyof T, keyof any[]>;
type TupleIndexes<T extends readonly unknown[]> = TupleKeys<T> extends `${infer N extends number}` ? N : never;
type DataKeys<T> = T extends any[] ? TupleIndexes<T> : keyof T;

export async function numberExtra<T extends IGameAbilityId>(
	abilityId: T,
	property: DataKeys<IGameAbilityData<T>>,
	label: string,
	min?: number,
	max?: number,
	step?: number,
) {
	return defineComponent<IExtraComponentProps<T['type']>, IDefineExtraComponentEmits>(async (props, ctx) => {
		const [imgSrc, imgSize] = await gameAbilityImage(abilityId);
		const [stringifiedAbilityId, modelValue, updateValue, appliedEffect] = extraAppliedEffect(abilityId, property, props.damageSource);

		return () => h(VExtrasNumber, {
			'modelValue': modelValue.value,
			'idPrefix': `${props.idPrefix}-${stringifiedAbilityId}-${property}`,
			imgSrc,
			imgSize,
			label,
			min,
			max,
			step,
			'usedNumberInput': useNumberInput(
				abilityId.type === ABILITY_TYPE.effect
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

export async function gameAbilityImage(abilityId: IGameAbilityId): Promise<[src: string, size: number]> {
	const { version, minorVersion } = usePatchVersion();

	const imageAbilityId = abilityId.type === ABILITY_TYPE.effect
		? EFFECT_SPECIFICS[abilityId.id].sourceAbility
		: abilityId;

	if (!imageAbilityId) {
		console.warn('[gameAbilityId] failed to resolve imageAbilityId for', abilityId);
		return ['', 0];
	}

	if (imageAbilityId.type === ABILITY_TYPE.item) {
		return [
			`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${imageAbilityId.id}.png`,
			64,
		];
	} else if (imageAbilityId.type === ABILITY_TYPE.effect) {
		return CUSTOM_EFFECT_IMAGES[imageAbilityId.id]
			? [
					`https://raw.communitydragon.org/${minorVersion}/${CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![0]}`,
					CUSTOM_EFFECT_IMAGES[imageAbilityId.id]![1],
				]
			: ['', 0];
	}

	const { abilityImage, abilityImageSize } = useChampionImages();

	const champion = await useChampion(imageAbilityId.id);

	return [
		abilityImage(champion.abilities[imageAbilityId.abilityKey].variants[imageAbilityId.abilityVariantIndex]!.image, imageAbilityId.id),
		abilityImageSize(imageAbilityId.id),
	];
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
