import type { IChampionAbilityVariant, IItem, IItemStat, IRune } from '@lolcalc/data/types';
import type { IVariableType } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource.ts';
import type { ICalculatedDynamicVariable, ISpecificVariables } from '../specifics/index';
import type { IReplaceGameVariablesRV, IVariableMeta } from '../types';

import { ICON_ON_HIT_IMG, PATCH_VERSION, STAT_ICON } from '@lolcalc/data';
import { roundVariable } from '@lolcalc/shared/utils.ts';

export interface IVariableValueResult {
	/** if not found, `undefined`. Otherwise a `number` if value is the same regardless of range or `[number, number]` for melee and ranged champions respectively */
	value?: ICalculatedDynamicVariable['value'];
	/**
	 * if `true`, the variable is different for melee and ranged champions and the calculation target's range is unknown
	 * if `0`, same as `true` except the target is melee
	 * if `1`, same as `true` except the target is ranged
	 */
	isMeleeRanged?: true | 0 | 1;
	/** returns the variable name stripped of any dot path (`AdditionalUltAH.0` -> `AdditionalUltAH`) or `undefined` if same as provided */
	actualVariableName?: string;
	/** all values the variable lists, like champion Q levels 0-6 */
	allValues?: number[];
	meta?: IVariableMeta;
	/** whether was resolved from the provided dynamic variables. If `true`, the **replaced** (not the one saved in variables map) value will be rounded */
	isDynamic?: boolean;
	/** whether `ISpecificVariables.uninteresting` includes it */
	isUninteresting?: boolean;
}

/**
 * `dynamicVariables` can be either
 * - `ISpecificDynamicVariables.known` when variables are resolved in `updateData` script or a description is created without a `DamageSource` and it needs known/unknown variables to be valid. See `replaceGameVariables`' `options.overrideDynamicVariables`
 *     In `updateData` script these are used only for supressing warning for unknown variables that are actually calculated by `dynamicVariables`
 * - the return value of `ISpecificDynamicVariables.calculate`'s return value when actually calculating and using the values
 */
export interface IDynamicVariables extends Pick<ISpecificVariables, 'meta' | 'uninteresting'> {
	values?: Record<string, ICalculatedDynamicVariable>;
}

function resolveDynamicVariable(value: NonNullable<IDynamicVariables['values']>[string]): IVariableValueResult['value'] {
	return value.value;
}

interface IItemVariableParams {
	item: IItem;
	dynamicVariables?: IDynamicVariables;
	isRanged?: boolean;
	damageSource?: DamageSource;
	// /** if present, missing variables will try their hashed variants. If found, they will be renamed to the value. Expected to be used only in `updateData` */
	// hashFnv1a?: (value: string) => string;
	// /** indicates that the currently resolved variable is a hash made from this value, which if resolved will rename the hash to that value. Expected to be used only in `updateData` */
	// hashedFrom?: string;
}

export function itemVariableValue(variable: string, {
	item,
	isRanged,
	damageSource,
	dynamicVariables = {},
	// hashFnv1a,
	// hashedFrom,
}: IItemVariableParams): IVariableValueResult {
	const rv: IVariableValueResult = {
		isUninteresting: dynamicVariables.uninteresting?.includes(variable),
	};

	if (dynamicVariables.meta?.[variable]) {
		rv.meta = dynamicVariables.meta[variable];
	}

	// console.log('checking for', variable, hashedFrom, { item, dynamicVariables, isRanged, damageSource });

	if (dynamicVariables.values?.[variable] !== undefined) {
		rv.value = resolveDynamicVariable(dynamicVariables.values[variable]);
		if (Array.isArray(rv.value)) {
			if (isRanged === undefined) {
				rv.isMeleeRanged = true;
			} else if (isRanged) {
				rv.isMeleeRanged = 1;
				rv.value = rv.value[1];
			} else {
				rv.isMeleeRanged = 0;
				rv.value = rv.value[0];
			}
		}
		rv.isDynamic = true;
	} else if (item.stats?.[variable as IItemStat] !== undefined) {
		rv.value = item.stats[variable as IItemStat];
	} else if (item.dataValues?.[variable] !== undefined) {
		rv.value = item.dataValues[variable];
	} else if (item.stringCalculations?.[variable]) {
		rv.isMeleeRanged = isRanged === true ? 1 : isRanged === false ? 0 : true;
		if (isRanged === undefined) {
			rv.value = [
				itemVariableValue(item.stringCalculations[variable].MeleeResult.slice(1, -1), {
					item,
					dynamicVariables,
					isRanged: false,
					damageSource,
				}).value as number | undefined,
				itemVariableValue(item.stringCalculations[variable].RangedResult.slice(1, -1), {
					item,
					dynamicVariables,
					isRanged: true,
					damageSource,
				}).value as number | undefined,
			];
		} else {
			const key: keyof NonNullable<IItem['stringCalculations']>[string] = isRanged ? 'RangedResult' : 'MeleeResult';
			rv.value = itemVariableValue(item.stringCalculations[variable][key].slice(1, -1), {
				item,
				dynamicVariables,
				isRanged,
				damageSource,
				// hashFnv1a,
				// hashedFrom,
			}).value;
		}
	} else if (variable.startsWith('Effect')) {
		rv.value = item.effectAmount?.[Number.parseInt(variable.slice(6)) - 1];
	} else if (item.itemCalculations?.[variable]) {
		const value = variableResolveFn(item.itemCalculations?.[variable])?.(item.itemCalculations[variable], item, damageSource);
		if (value) {
			Object.assign(rv, value);
		}
	}

	// if (rv.value === undefined && hashFnv1a && !hashedFrom) {
	// 	return itemVariableValue(hashFnv1a(variable), {
	// 		item,
	// 		dynamicVariables,
	// 		isRanged,
	// 		damageSource,
	// 		hashFnv1a,
	// 		hashedFrom: variable,
	// 	});
	// }

	return rv;
}

interface IRuneVariableParams {
	rune: IRune;
	dynamicVariables?: IDynamicVariables;
}

export function runeVariableValue(variable: string, {
	rune,
	dynamicVariables = {},
}: IRuneVariableParams): IVariableValueResult {
	const rv: IVariableValueResult = {};

	const [variableName, ...dotPath] = variable.split('.');

	if (dotPath.length) {
		rv.actualVariableName = variableName;
	}

	/* atm only shard stats' dynamic variables are properly resolved and this suffices, when doing major runes probably needs to be sophisticated, when it changes also make sure to resolve meta the same way it is in items/champions (not dependant on value existing) */
	if (dynamicVariables.values?.[variable]) {
		rv.value = resolveDynamicVariable(dynamicVariables.values[variable]);
		rv.meta = dynamicVariables.meta?.[variable] ?? {};
		rv.isDynamic = true;
		return rv;
	}

	const sources = [(rune as any).calculations, (rune as any).effectAmount, dynamicVariables];
	for (const source of sources) {
		if (!source) {
			continue;
		}

		rv.value = source[variableName!];
		if (rv.value !== undefined) {
			for (const path in dotPath) {
				// TODO figure this out, some paths seem to have .0 or .-1
				const number = Number(path);
				if (Number.isNaN(number) || (number >= 0 && Array.isArray(rv.value))) {
					rv.value = (rv.value as any)[path];
				}
			}
		}
		if (rv.value !== undefined) {
			break;
		}
	}

	return rv;
}

interface IChampionAbilityVariableVariant {
	objectName: IChampionAbilityVariant['objectName'];
	spellCalculations?: IChampionAbilityVariant['spellCalculations'];
	dataValues?: IChampionAbilityVariant['dataValues'];
	effectAmount?: IChampionAbilityVariant['effectAmount'];
	[key: string]: any;
}

interface IChampionAbilityVariableParams {
	abilityVariant: IChampionAbilityVariableVariant;
	dynamicVariables?: IDynamicVariables;
	abilityLevel?: number;
	/** ALL champion's abilities variants, not just the target ability. Descriptions can reference other spells like Caitlyn passive */
	allAbilitiesVariants?: IChampionAbilityVariableVariant[];
}

// TODO make sure it handles hextech soul description
export function championAbilityVariableValue(variable: string, {
	abilityVariant,
	dynamicVariables = {},
	abilityLevel = 1,
	allAbilitiesVariants = [],
}: IChampionAbilityVariableParams): IVariableValueResult {
	const rv: IVariableValueResult = {};

	const colonIndex = variable.indexOf(':');
	if (~colonIndex) {
		const [rawVariantObjectName, variantVariableName] = variable.split(':');
		const variantObjectName = rawVariantObjectName!.split('.').at(-1);

		if (variantVariableName === 'Hotkey') {
			return {
				value: variantObjectName!.at(-1),
			};
		}

		// TODO maybe can keep object names in lowercase, same as variable names
		const otherAbilityVariant = allAbilitiesVariants.find(variant => variant.objectName === variantObjectName || variant.objectName.toLowerCase() === variantObjectName?.toLowerCase());
		if (otherAbilityVariant) {
			return championAbilityVariableValue(variantVariableName!, {
				abilityVariant: otherAbilityVariant,
				dynamicVariables,
				abilityLevel,
				allAbilitiesVariants,
			});
		} else {
			console.warn(`[championAbilityVariableValue] variant referenced in ${variable} not found`);
		}
	}

	const [variableName, ...dotPath] = variable.split('.');
	if (dotPath.length) {
		rv.actualVariableName = variableName;
	}

	rv.isUninteresting = dynamicVariables.uninteresting?.includes(variableName!);
	if (dynamicVariables.meta?.[variable]) {
		rv.meta = dynamicVariables.meta[variable];
	}

	if (dynamicVariables.values?.[variable] !== undefined) {
		rv.value = resolveDynamicVariable(dynamicVariables.values[variable]);
		rv.isDynamic = true;
	}

	if (variableName!.startsWith('Effect') && variableName!.endsWith('Amount')) {
		const index = Number(variableName!.slice(6, -6));
		if ('effectAmount' in abilityVariant) {
			if (Number.isNaN(index)) {
				console.warn('potential effectAmount variable index NaN', variableName);
			} else {
				rv.value = abilityVariant.effectAmount[index - 1];
			}
		}
	}

	/* some variables names' cases don't match so keep them in form of key/value and try all lowercase key if exact case not found */
	// TODO maybe can just always do lowercase variables
	const sources: (false | [string, any][])[] = [
		abilityVariant.spellCalculations && Object.entries(abilityVariant.spellCalculations),
		abilityVariant.dataValues && Object.entries(abilityVariant.dataValues),
		abilityVariant.effectAmount && Object.entries(abilityVariant.effectAmount),
	];

	if (rv.value === undefined) {
		for (const source of sources) {
			if (!source) {
				continue;
			}

			rv.value = source.find(source => source[0] === variableName || source[0].toLowerCase() === variableName!.toLowerCase())?.[1];
			if (rv.value !== undefined) {
				for (const path in dotPath) {
					// TODO figure this out, some paths seem to have .0 or .-1
					const number = Number(path);
					if (Number.isNaN(number) || (number >= 0 && Array.isArray(rv.value))) {
						rv.value = (rv.value as any)[path];
					}
				}
			}
			if (rv.value !== undefined) {
				break;
			}
		}
	}

	if (Array.isArray(rv.value)) {
		rv.allValues = rv.value as number[];
		rv.value = rv.value[abilityLevel];
	}

	return rv;
}

export type IGameVariableType = 'item' | 'rune' | 'championAbility';

export interface IGameVariableValueParameters {
	item: IItemVariableParams;
	rune: IRuneVariableParams;
	championAbility: IChampionAbilityVariableParams;
};

export interface IReplaceGameVariablesOptions {
	replaceWithName?: boolean;
	/**
	 * variables to use instead of the ones passed in the `variableValueFunctionArguments`
	 * used by results table since it gets the item/ability variables from creating the ability's description without any `DamageSource`, which normally provides its `computed.variables`
	 */
	overrideVariables?: IDynamicVariables;
	/** whether to show some additional info about the variable, usually expected when holding shift */
	isExtended?: boolean;
}

export type IModifyVariableFunction = (value: Exclude<IVariableValueResult['value'], any[]>) => Exclude<IVariableValueResult['value'], any[]>;
export type IModifyVariableFunctions = Partial<Record<IVariableType, IModifyVariableFunction[]>>;

export function replaceGameVariables(text: string, variableType: 'item', variableValueFunctionArguments: IItemVariableParams, modifyVariableFunctions?: IModifyVariableFunctions, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(text: string, variableType: 'rune', variableValueFunctionArguments: IRuneVariableParams, modifyVariableFunctions?: IModifyVariableFunctions, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(text: string, variableType: 'championAbility', variableValueFunctionArguments: IChampionAbilityVariableParams, modifyVariableFunctions?: IModifyVariableFunctions, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(
	text: string,
	variableType: IGameVariableType,
	variableValueFunctionData: IItemVariableParams | IRuneVariableParams | IChampionAbilityVariableParams,
	modifyVariableFunctions: IModifyVariableFunctions = {},
	options: Partial<IReplaceGameVariablesOptions> = {},
): IReplaceGameVariablesRV {
	let anyExtendedVariables = false;
	const unknownVariables: IReplaceGameVariablesRV['unknownVariables'] = [];
	const variables: IReplaceGameVariablesRV['variables'] = new Map();
	const variablesAllValues: IReplaceGameVariablesRV['variablesAllValues'] = new Map();

	/* capture `@VariableName@` followed by optional ` (%i:iconName%)` which the replacement will fallback to if it exists and no `ISpecificVariables.meta.statIconKey` is defined */
	const replaced = text.replace(/@(.+?)@(?:\s*\((%[^)\s]+%)\))?/g, (_, name, varIcon) => {
		let variableName = name;
		let multiplier = 1;

		const multiplierIndex = name.indexOf('*');
		if (~multiplierIndex) {
			multiplier = Number.parseFloat(name.slice(multiplierIndex + 1));
			variableName = name.slice(0, multiplierIndex);
		}

		let { value: variable, isMeleeRanged, actualVariableName, allValues, isDynamic, meta, isUninteresting } = (variableType === 'item'
			? itemVariableValue
			: variableType === 'championAbility'
				? championAbilityVariableValue
				: runeVariableValue)(variableName, options.overrideVariables
			? { ...variableValueFunctionData, dynamicVariables: options.overrideVariables }
			: variableValueFunctionData as any);

		/*
		 * if meta's present, the variable was most likely gotten from dynamicVariables which store their values cached on `DamageSource`
		 * later on, the variable is multiplied by the multiplier in place, so if this was the original variable, every time `replaceGameVariables` was called the underlying dynamic variable would be modified
		 */
		if (meta && Array.isArray(variable)) {
			variable = [...variable];
		}

		const replaceWithName = options.replaceWithName && !isUninteresting;
		const tagWrapStart = replaceWithName ? '<var>' : '';
		const tagWrapEnd = replaceWithName ? '</var>' : '';

		if (allValues) {
			variablesAllValues.set(actualVariableName || variableName, allValues.map((value) => {
				let parsedValue: string | number = roundVariable(value * multiplier);
				if (multiplier !== 1) {
					parsedValue = `${parsedValue}%`;
				}
				return parsedValue;
			}));
		}

		if (typeof variable !== 'string' && (
			Array.isArray(variable)
				? variable.some(v => typeof v !== 'number' || Number.isNaN(v))
				: (typeof variable !== 'number' || Number.isNaN(variable)))) {
			variable = Array.isArray(variable)
				? variable.map(v => (typeof v !== 'number' || Number.isNaN(v)) ? undefined : v) as typeof variable
				: undefined;
		}

		anyExtendedVariables ||= Boolean(meta?.extendedEquals);
		let metaSuffix = '';
		const extendedEquals = typeof meta?.extendedEquals !== 'object'
			? meta?.extendedEquals as string
			: `${meta.extendedEquals.prefix}${isMeleeRanged === true
				? `${meta.extendedEquals.meleeValue}${meta.extendedEquals.valueSuffix} | ${meta.extendedEquals.rangedValue}`
				: meta.extendedEquals[isMeleeRanged === 0 ? 'meleeValue' : 'rangedValue']
			}${meta.extendedEquals.valueSuffix}${meta.extendedEquals.suffix}`;

		if (meta?.statIconKey || varIcon) {
			const iconStr = (meta?.statIconKey && `%i:${STAT_ICON[meta.statIconKey]}%`) || varIcon || '';
			(extendedEquals && options.isExtended)
				? metaSuffix = ` = (${extendedEquals}${iconStr})`
				: metaSuffix = ` (${iconStr})`;
		} else if (extendedEquals && options.isExtended) {
			metaSuffix = ` = (${extendedEquals})`;
		}

		if (meta?.multiplier) {
			multiplier = meta.multiplier;
		}

		if (variable === undefined) {
			unknownVariables.push([name, actualVariableName]);
			return `${tagWrapStart}<unknown>@${replaceWithName ? (meta?.displayedName ?? variableName) : name}@</unknown>${tagWrapEnd}${metaSuffix}`;
		}

		if (typeof variable === 'string') {
			return `${tagWrapStart}${replaceWithName ? (meta?.displayedName ?? variableName) : variable}${tagWrapEnd}${metaSuffix}`;
		}

		const varValueSuffix = meta?.isPercentage ? '%' : '';

		if (Array.isArray(variable)) {
			if (variable[0] === undefined || variable[1] === undefined) {
				unknownVariables.push([name, actualVariableName]);
				return `${tagWrapStart}<unknown>@${replaceWithName ? (meta?.displayedName ?? variableName) : name}@</unknown>${tagWrapEnd}`;
			}

			const baseValue = [roundVariable(variable[0]! * multiplier), roundVariable(variable[1]! * multiplier)] as [number, number];

			if (meta?.type && modifyVariableFunctions[meta.type]) {
				variable[0] = modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, variable[0]!);
				variable[1] = modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, variable[1]!);
			}

			variable[0] = roundVariable(variable[0]! * multiplier);
			variable[1] = roundVariable(variable[1]! * multiplier);

			variables.set(variableName, {
				baseValue,
				value: variable as [number, number],
				meta,
				isUninteresting,
			});

			return replaceWithName
				? `%i:meleeactive% | %i:rangedactive% ${tagWrapStart}${(meta?.displayedName ?? variableName)}${varValueSuffix}${tagWrapEnd}${metaSuffix}`
				: `%i:meleeactive% ${tagWrapStart}${
					isDynamic ? Math.round(variable[0]!) : variable[0]}${varValueSuffix}${tagWrapEnd} | %i:rangedactive% ${tagWrapStart}${
					isDynamic ? Math.round(variable[1]!) : variable[1]}${varValueSuffix}${tagWrapEnd}${metaSuffix}`;
		}

		const baseValue = roundVariable(variable * multiplier);

		if (meta?.type && modifyVariableFunctions[meta.type]) {
			variable = modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, variable);
		}

		variable = roundVariable(variable * multiplier);
		variables.set(variableName, { baseValue, value: variable, meta, isUninteresting });

		const meleeRangedIconPath = isMeleeRanged === 0
			? 'melee'
			: isMeleeRanged === 1
				? 'ranged'
				: undefined;
		const iconPrefix = meleeRangedIconPath ? `%i:${meleeRangedIconPath}active% ` : '';

		return `${iconPrefix}${tagWrapStart}${replaceWithName ? (meta?.displayedName ?? variableName) : (isDynamic ? Math.round(variable) : variable)}${varValueSuffix}${tagWrapEnd}${metaSuffix}`;
	});

	const dynamicVariables = (options.overrideVariables ?? variableValueFunctionData.dynamicVariables);
	const additionalVariables = dynamicVariables?.meta && Object.entries(dynamicVariables.meta).filter(([, value]) => value?.isAdditional);
	if (additionalVariables?.length) {
		for (const [variableName, meta] of additionalVariables) {
			let value = dynamicVariables!.values?.[variableName]?.value as number | [number, number] | undefined;
			if (value !== undefined) {
				if (Array.isArray(value)) {
					value = [...value];
					value[0] = roundVariable(value[0]);
					value[1] = roundVariable(value[1]);
				} else {
					value = roundVariable(value);
				}

				if (meta?.type && modifyVariableFunctions[meta.type]) {
					if (Array.isArray(value)) {
						value[0] = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, value[0]));
						value[1] = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, value[1]));
					} else {
						value = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, value));
					}
				}

				variables.set(variableName, { baseValue: value, value });
			}
		}
	}

	return { replaced, variables, unknownVariables, variablesAllValues, anyExtendedVariables };
}

const statIconNameValues = Object.values(STAT_ICON);

export function replaceGameIcons(text: string): string {
	return text
		.replace(/%i:(\w+)%/g, (_, name: string) => {
			name = name.toLocaleLowerCase();
			return `<img src="https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/${statIconNameValues.includes(name) ? 'statsicon' : 'gameplay'}/${name}.png" width="20" height="20" aria-hidden="true">`;
		})
		.replace(/\{\{ ?Item_Keyword_OnHit ?\}\}/g, `${ICON_ON_HIT_IMG || '{{ Item_Keyword_OnHit }}'} <onhit>On-Hit</onhit>`);
}

/** functions for resolving game variables named by their `__type` or other identifier */
export const VARIABLE_CALCULATION_FNS = {
	mFormulaParts(variable: { mFormulaParts: (IGameVariablesByType[keyof IGameVariablesByType])[]; mDisplayAsPercent?: boolean }, whole, self) {
		const values = variable.mFormulaParts.map((part) => {
			if ('mNumber' in part) {
				return part.mNumber;
			} else if ('mDataValue' in part) {
				return whole.dataValues?.[part.mDataValue];
			}
			return variableResolveFn(part)?.(part, whole, self);
		});
		if (values.includes(undefined)) {
			return undefined;
		}
		const multiplier = 'mMultiplier' in variable ? (variable.mMultiplier as Record<string, number>).mNumber : undefined;

		return {
			value: values.reduce((acc, curr) => curr! + acc!, 0) * (multiplier ?? 1),
			meta: {
				isPercentage: variable.mDisplayAsPercent,
				multiplier: variable.mDisplayAsPercent ? 100 : undefined,
			},
		};
	},
	ByCharLevelBreakpointsCalculationPart(variable: IGameVariablesByType['ByCharLevelBreakpointsCalculationPart'], _whole, self) {
		let rv = variable.mLevel1Value;
		if ('mBreakpoints' in variable) {
			for (const { mAdditionalBonusAtThisLevel, mLevel } of variable.mBreakpoints) {
				if ((self?.level.value ?? 1) >= mLevel) {
					rv += mAdditionalBonusAtThisLevel;
				} else {
					break;
				}
			}
		} else {
			// TODO check if it works, echoes of helia
			rv += variable.mInitialBonusPerLevel * ((self?.level.value ?? 1) - 1);
		}
		return { value: rv };
	},
} satisfies IHypotheticalVariableCalculationFns;

export type IHypotheticalVariableCalculationFns = Record<string, (variable: any, whole: any, self?: DamageSource) => IVariableValueResult | undefined>;

interface IGameVariablesByType {
	ByCharLevelBreakpointsCalculationPart: {
		mLevel1Value: number;
		mBreakpoints: {
			mLevel: number;
			mAdditionalBonusAtThisLevel: number;
		}[];
		__type: string;
	} | {
		mLevel1Value: number;
		mInitialBonusPerLevel: number;
		__type: string;
	};
	NumberCalculationPart: {
		mNumber: number;
		__type: string;
	};
	NamedDataValueCalculationPart: {
		mDataValue: string;
		__type: string;
	};
}

function variableResolveFn(variable: any): IHypotheticalVariableCalculationFns[keyof IHypotheticalVariableCalculationFns] | undefined {
	if ('__type' in variable && variable.__type in VARIABLE_CALCULATION_FNS) {
		return VARIABLE_CALCULATION_FNS[variable.__type as keyof typeof VARIABLE_CALCULATION_FNS];
	} else if ('mFormulaParts' in variable) {
		return VARIABLE_CALCULATION_FNS.mFormulaParts;
	}
	console.warn('[variableResolveFn] unknown variable', variable);
	return undefined;
}
