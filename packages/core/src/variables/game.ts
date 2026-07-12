import type { IChampionAbilityVariant, IItem, IItemStat, IRune } from '@lolcalc/data/types';
import type { IChampionStatName, IStatsCalculationResult, IVariableType } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource.ts';
import type { ICalculatesFromPart, ISpecificVariables, IVariableValueResult } from '../specifics/index';

import { ICON_ON_HIT_IMG, PATCH_VERSION, STAT_ICON } from '@lolcalc/data';
import { CHAMPION_LEVEL } from '@lolcalc/shared';
import { roundVariable } from '@lolcalc/shared/utils.ts';

export interface IReplacedGameVariable {
	baseValue: NonNullable<IVariableValueResult['value']>;
	value: NonNullable<IVariableValueResult['value']>;
	meta?: IVariableMeta;
	/** `%` will be suffixed to the formatted value in replaced description */
	isPercentage?: boolean;
	isUninteresting?: boolean;
	/** the text appended after the replaced variable, usually something like ` = (55% [ad icon])` */
	metaSuffix?: string;
}

export interface IReplaceGameVariablesRV {
	replaced: string;
	variables: Map<string, IReplacedGameVariable>;
	/** all found variables' listed values, expected on champion variables like values for Q level 0-6 */
	variablesAllValues: Map<string, (string | number)[]>;
	unknownVariables: [rawName: string, actualName?: string][];
	/** whether any of the detected variables has additional info expected to be shown in the extended version (when holding shift) */
	anyExtendedVariables: boolean;
}

type IVariableMetaExtendedEquals = string | {
	prefix: string;
	meleeValue: string | number;
	rangedValue: string | number;
	valueSuffix?: string;
	suffix: string;
};

type IVariableMetaStatIcon = Exclude<keyof typeof STAT_ICON, 'slowResist' | 'GP10'>;

export interface IVariableMeta<T = any> {
	/** variable name shown in description when `replaceGameVariables`' `options.replaceWithName` is true instead of the actual variable name */
	displayedName?: string;
	/**
	 * when present, formatted variable will have `(%i:STAT_ICON[statIconKey]%)` appended to it. If the value is an array of icons, no `(...icons)` will be appended when replace's `isExtended: true`. The icons are to be manually added in `extendedEquals` in that case
	 * it's automatically generated in `replaceGameVariables` from variable's `calculatesFrom` but this can be used to override them
	 *
	 * `replaceGameVariables` doesnt handle the elaborate stat icons that are full blown paths like `slowResist` so for now these are manually excluded
	 */
	scalesWithStatIcon?: IVariableMetaStatIcon | IVariableMetaStatIcon[];
	/**
	 * when present, formatted variable will have `= (${extendedEquals})` appended to in the extended version (holding shift)
	 * it's automatically generated in `replaceGameVariables` from variable's `calculatesFrom` but this can be used to override them
	 *
	 * if `extendedEquals` is an object, it's assumed to have different info values for melee/ranged and will be formatted accordingly in `replaceGameVariables`
	 * if it's a function, it will be passed the same arguments the variable value function receives
	 *	- item: `IItemVariableParams`
	 *	- rune: `IRuneVariableParams`
	 *	- champion: `IChampionAbilityVariableParams`
	 */
	extendedEquals?: IVariableMetaExtendedEquals | ((variableValueParams: T, overrideDynamicVariables?: IDynamicVariables) => IVariableMetaExtendedEquals);
	/** displayed value multiplied by */
	multiplier?: number;
	/** same as `IVariableValueResult.roundReplaced` */
	roundReplaced?: number | boolean;
	/** used for setting `IVariableValueResult.isPercentage` */
	isPercentage?: boolean;
	/** `%` will be suffixed to the formatted value in results, separate from `isPercentage` for variables like custom Liandry's Torment `BonusDamage` */
	resultsIsPercentage?: boolean;
	/** same as `multiplier` but only for results for the same reason `resultsIsPercentage` is separate */
	resultsMultiplier?: number;
	/** if present, a tooltip will be added to results with the value shown inside it */
	additionalInfo?: string;
	type?: IVariableType;
	/** whether the variable is a custom one, not found in description but computed by lolcalc and wanted in results */
	isCustom?: boolean;
}

/**
 * `dynamicVariables` can be either
 * - `ISpecificDynamicVariables.known` when variables are resolved in `updateData` script or a description is created without a `DamageSource` and it needs known/unknown variables to be valid. See `replaceGameVariables`' `options.overrideDynamicVariables`
 *     In `updateData` script these are used only for supressing warning for unknown variables that are actually calculated by `dynamicVariables`
 * - the return value of `ISpecificDynamicVariables.calculate`'s return value when actually calculating and using the values
 */
export interface IDynamicVariables extends Pick<ISpecificVariables, 'meta' | 'uninteresting'> {
	values?: Record<string, IVariableValueResult | [IVariableValueResult, IVariableValueResult]>;
}

interface IBaseVariableParams {
	dynamicVariables?: IDynamicVariables;
	/**
	 * any other variables that were accessed while trying to resolve the current one.
	 * for example Endless Hunger's `HasteFromAD` resolves to (originally hashed) either `HasteFromADMelee` or `HasteFromADRanged`, so these 2 will be listed under `accessedVariables.get('HasteFromAD')`
	 * used in `updateData` for trying to resolve hashed versions of unknown variables
	 */
	accessedVariables?: Map<string, Set<string>>;
	damageSource?: DamageSource;
	/** usually `damageSource.stats.value.isRanged` but here for easier overriding when getting values for `isRanged: undefined` since then the variable value function is called with `true` and `false` replacing it */
	isRanged?: boolean;
}

interface IItemVariableParams extends IBaseVariableParams {
	item: IItem;
}

export function itemVariableValue(
	variable: string,
	params: IItemVariableParams,
	overrideDynamicVariables?: IDynamicVariables,
	/** if subvariables are being resolved, like for melee/ranged values, track what they are being resolved from */
	accessedFrom?: string,
): IVariableValueResult {
	const {
		item,
		isRanged,
		dynamicVariables = overrideDynamicVariables ?? {},
	} = params;

	const rv: IVariableValueResult = {
		isUninteresting: dynamicVariables.uninteresting?.includes(variable),
		calculatesFrom: [],
	};

	if (accessedFrom) {
		params.accessedVariables?.getOrInsert(accessedFrom, new Set())?.add(variable);
	}

	if (dynamicVariables.meta?.[variable]) {
		rv.meta = dynamicVariables.meta[variable];
	}

	if (dynamicVariables.values?.[variable] !== undefined) {
		const dynamicValue = dynamicVariables.values[variable];
		rv.roundReplaced = true;
		if (Array.isArray(dynamicValue)) {
			if (isRanged === undefined) {
				rv.isMeleeRanged = true;
				if (Array.isArray(dynamicValue[0].value) || Array.isArray(dynamicValue[1].value)) {
					console.error('[itemVariableValue] dynamic variable got nested melee/ranged values', item.name, variable, dynamicValue);
				} else {
					rv.value = [dynamicValue[0].value, dynamicValue[1].value];
					if (dynamicValue[0].calculatesFrom?.length || dynamicValue[1].calculatesFrom?.length) {
						if (dynamicValue[0].calculatesFrom?.length === dynamicValue[1].calculatesFrom?.length) {
							addCalculatesFrom(rv.calculatesFrom, dynamicValue[0].calculatesFrom!, dynamicValue[1].calculatesFrom!);
						} else {
							console.warn('[itemVariableValue] detected dynamic melee/ranged variable but got different calculatesFrom lengths', item.name, variable, dynamicValue[0], dynamicValue[1]);
						}
					}
				}
			} else if (isRanged) {
				rv.isMeleeRanged = 1;
				rv.value = dynamicValue[1].value;
				if (dynamicValue[1].calculatesFrom?.length) {
					addCalculatesFrom(rv.calculatesFrom, dynamicValue[1].calculatesFrom);
				}
			} else {
				rv.isMeleeRanged = 0;
				rv.value = dynamicValue[0].value;
				if (dynamicValue[0].calculatesFrom?.length) {
					addCalculatesFrom(rv.calculatesFrom, dynamicValue[0].calculatesFrom);
				}
			}
		} else if (Array.isArray(dynamicValue.value)) {
			if (dynamicValue.calculatesFrom?.length) {
				addCalculatesFrom(rv.calculatesFrom, dynamicValue.calculatesFrom);
			}
			if (isRanged === undefined) {
				rv.isMeleeRanged = true;
				rv.value = dynamicValue.value;
			} else if (isRanged) {
				rv.isMeleeRanged = 1;
				rv.value = dynamicValue.value[1];
			} else {
				rv.isMeleeRanged = 0;
				rv.value = dynamicValue.value[0];
			}
		} else {
			rv.value = dynamicValue.value;
			if (dynamicValue.calculatesFrom?.length) {
				addCalculatesFrom(rv.calculatesFrom, dynamicValue.calculatesFrom);
			}
		}
	} else if (item.stats?.[variable as IItemStat] !== undefined) {
		rv.value = item.stats[variable as IItemStat];
	} else if (item.dataValues?.[variable] !== undefined) {
		rv.value = item.dataValues[variable];
	} else if (item.stringCalculations?.[variable]) {
		rv.isMeleeRanged = isRanged === true ? 1 : isRanged === false ? 0 : true;
		if (!item.stringCalculations[variable].MeleeResult || !item.stringCalculations[variable].RangedResult) {
			console.error('[itemVariableValue] item has stringCalculations but no expected MeleeResult/RangedResult keys under', item.name, variable, item.stringCalculations);
		} else if (isRanged === undefined) {
			const melee = itemVariableValue(item.stringCalculations[variable].MeleeResult.slice(1, -1), {
				...params,
				isRanged: false,
			}, overrideDynamicVariables, variable);
			const ranged = itemVariableValue(item.stringCalculations[variable].RangedResult.slice(1, -1), {
				...params,
				isRanged: true,
			}, overrideDynamicVariables, variable);

			rv.value = [melee.value as number | undefined, ranged.value as number | undefined];
			rv.roundReplaced ||= melee?.roundReplaced || ranged?.roundReplaced;
			rv.meta ??= Object.assign(melee.meta ?? {}, ranged.meta);
			if (melee.calculatesFrom?.length || ranged.calculatesFrom?.length) {
				if (melee.calculatesFrom?.length === ranged.calculatesFrom?.length) {
					addCalculatesFrom(rv.calculatesFrom, melee.calculatesFrom!, ranged.calculatesFrom!);
				} else {
					console.warn('[itemVariableValue] detected melee/ranged variable but got different calculatesFrom lengths', item.name, variable, melee, ranged);
				}
			}
		} else {
			const key: keyof NonNullable<IItem['stringCalculations']>[string] = isRanged ? 'RangedResult' : 'MeleeResult';
			const meleeRangedV = itemVariableValue(item.stringCalculations[variable][key].slice(1, -1), params, overrideDynamicVariables, variable);
			for (const key in meleeRangedV) {
				if (key === 'calculatesFrom') {
					addCalculatesFrom(rv.calculatesFrom, meleeRangedV.calculatesFrom!);
				} else if (key !== 'meta') {
					(rv as any)[key] = meleeRangedV[key as keyof typeof meleeRangedV];
				}
			}
		}
	} else if (variable.startsWith('Effect')) {
		rv.value = item.effectAmount?.[Number.parseInt(variable.slice(6)) - 1];
	} else if (item.itemCalculations?.[variable]) {
		const value = variableResolveFn(
			item.itemCalculations?.[variable],
		)?.(item.itemCalculations[variable], item, {
			variableValueFn: itemVariableValue,
			variableValueParams: params,
			accessedVariables: params.accessedVariables?.getOrInsert(accessedFrom ?? variable, new Set()),
		});
		if (value) {
			for (const key in value) {
				if (key === 'calculatesFrom') {
					addCalculatesFrom(rv.calculatesFrom, value.calculatesFrom!);
				} else if (key !== 'meta') {
					(rv as any)[key] = value[key as keyof typeof value];
				}
			}
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
		}
	}

	return rv;
}

interface IRuneVariableParams extends IBaseVariableParams {
	rune: IRune;
	dynamicVariables?: IDynamicVariables;
}

export function runeVariableValue(variable: string, params: IRuneVariableParams, overrideDynamicVariables?: IDynamicVariables): IVariableValueResult {
	const {
		rune,
		dynamicVariables = overrideDynamicVariables ?? {},
	} = params;
	const rv: IVariableValueResult = {};

	const [variableName, ...dotPath] = variable.split('.');

	if (dotPath.length) {
		rv.actualVariableName = variableName;
	}

	/* atm only shard stats' dynamic variables are properly resolved and this suffices, when doing major runes probably needs to be sophisticated, when it changes also make sure to resolve meta the same way it is in items/champions (not dependant on value existing) */
	if (dynamicVariables.values?.[variable]) {
		rv.roundReplaced = true;
		Object.assign(rv, dynamicVariables.values[variable]);
		rv.meta = dynamicVariables.meta?.[variable] ?? {};
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

interface IChampionAbilityVariableParams extends IBaseVariableParams {
	abilityVariant: IChampionAbilityVariableVariant;
	dynamicVariables?: IDynamicVariables;
	abilityLevel?: number;
	/** ALL champion's abilities variants, not just the target ability. Descriptions can reference other spells like Caitlyn passive */
	allAbilitiesVariants?: IChampionAbilityVariableVariant[];
}

// TODO make sure it handles hextech soul description
export function championAbilityVariableValue(
	variable: string,
	params: IChampionAbilityVariableParams,
	overrideDynamicVariables?: IDynamicVariables,
): IVariableValueResult {
	const {
		abilityVariant,
		dynamicVariables = overrideDynamicVariables ?? {},
		abilityLevel = 1,
		allAbilitiesVariants = [],
	} = params;
	const rv: IVariableValueResult = {
		calculatesFrom: [],
	};

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

	const [variableName, ...dotPath] = variable.split('.') as [string, ...string[]];
	if (dotPath.length) {
		rv.actualVariableName = variableName;
	}

	rv.isUninteresting = dynamicVariables.uninteresting?.includes(variableName!);
	if (dynamicVariables.meta?.[variable]) {
		rv.meta = dynamicVariables.meta[variable];
	}

	if (dynamicVariables.values?.[variable] !== undefined) {
		rv.roundReplaced = true;
		Object.assign(rv, dynamicVariables.values[variable]);
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

	// TODO see if still needed /* some variables names' cases don't match so keep them in form of key/value and try all lowercase key if exact case not found */
	// const sources: (false | [string, any][])[] = [
	// 	abilityVariant.spellCalculations && Object.entries(abilityVariant.spellCalculations),
	// 	abilityVariant.dataValues && Object.entries(abilityVariant.dataValues),
	// 	abilityVariant.effectAmount && Object.entries(abilityVariant.effectAmount),
	// ];

	if (rv.value === undefined) {
		if (abilityVariant.dataValues?.[variableName]) {
			rv.value = abilityVariant.dataValues[variableName];
		} else if (abilityVariant.effectAmount?.[variableName]) {
			rv.value = abilityVariant.effectAmount[variableName];
			for (const path in dotPath) {
				rv.value = (rv.value as any)[path];
			}
		} else if (abilityVariant.spellCalculations?.[variableName]) {
			const value = variableResolveFn(
				abilityVariant.spellCalculations[variableName],
			)?.(abilityVariant.spellCalculations[variableName], abilityVariant, {
				variableValueFn: championAbilityVariableValue,
				variableValueParams: params,
				accessedVariables: params.accessedVariables?.getOrInsert(variable, new Set()),
			});

			if (value) {
				for (const key in value) {
					if (key === 'calculatesFrom') {
						addCalculatesFrom(rv.calculatesFrom, value.calculatesFrom!);
					} else if (key !== 'meta') {
						(rv as any)[key] = value[key as keyof typeof value];
					}
				}
			}
		}
	}

	let multiplier = 1;
	if (typeof rv.value === 'object') {
		if ('mMultiplier' in rv.value) {
			multiplier = resolveMMultiplier(rv.value.mMultiplier as any, abilityVariant, {
				variableValueFn: championAbilityVariableValue,
				variableValueParams: params,
				accessedVariables: params.accessedVariables?.getOrInsert(variable, new Set()),
			})!;
		}
		if ('mFormulaParts' in rv.value) {
			// eslint-disable-next-line ts/no-use-before-define
			const formulaValue = VARIABLE_CALCULATION_FNS.mFormulaParts(rv.value as any, abilityVariant, {
				variableValueFn: championAbilityVariableValue,
				variableValueParams: params,
				accessedVariables: params.accessedVariables?.getOrInsert(variable, new Set()),
			});
			Object.assign(rv, formulaValue);
		}
	}

	if (Array.isArray(rv.value)) {
		rv.allValues = rv.value as number[];
		rv.value = rv.value[abilityLevel];
	}

	if (typeof rv.value === 'number') {
		rv.value *= multiplier;
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
	variableValueFunctionParams: IItemVariableParams | IRuneVariableParams | IChampionAbilityVariableParams,
	modifyVariableFunctions: IModifyVariableFunctions = {},
	options: Partial<IReplaceGameVariablesOptions> = {},
): IReplaceGameVariablesRV {
	let anyExtendedVariables = false;
	const unknownVariables: IReplaceGameVariablesRV['unknownVariables'] = [];
	const variables: IReplaceGameVariablesRV['variables'] = new Map();
	const variablesAllValues: IReplaceGameVariablesRV['variablesAllValues'] = new Map();

	variableValueFunctionParams.accessedVariables ??= new Map();

	/* capture `@VariableName@` followed by
	 * - optional `%` which will be put back after replacing (dawncore, maybe others too)
	 * - another optional ` (%i:iconName%)` which the replacement will fallback to if it exists and no `ISpecificVariables.meta.statIconKey` is defined */
	const replaced = text.replace(/@(.+?)@(%?(?!i:))(?:\s*\((%[^)\s]+%)\))?/g, (_, name, optionalPercent, varIcon) => {
		let variableName = name;
		let multiplier = 1;

		const multiplierIndex = name.indexOf('*');
		if (~multiplierIndex) {
			multiplier = Number.parseFloat(name.slice(multiplierIndex + 1));
			variableName = name.slice(0, multiplierIndex);
		}

		let { value: variable, isMeleeRanged, actualVariableName, allValues, roundReplaced, meta, isUninteresting, isPercentage, multiplier: variableMultiplier, calculatesFrom } = (variableType === 'item'
			? itemVariableValue
			: variableType === 'championAbility'
				? championAbilityVariableValue
				: runeVariableValue)(variableName, variableValueFunctionParams as any, options.overrideVariables);

		if (meta?.roundReplaced !== undefined) {
			roundReplaced = meta.roundReplaced;
		}
		isPercentage ??= meta?.isPercentage || Boolean(optionalPercent);

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

		const metaSuffix = variableExtendedEquals(variableValueFunctionParams, options, isMeleeRanged, calculatesFrom, meta, varIcon);
		anyExtendedVariables ||= Boolean(metaSuffix);

		if (meta?.multiplier) {
			multiplier = meta.multiplier;
		} else if (variableMultiplier) {
			multiplier = variableMultiplier;
		}

		if (variable === undefined) {
			unknownVariables.push([name, actualVariableName]);
			const accessedVariables = variableValueFunctionParams.accessedVariables?.get(variableName);
			if (accessedVariables) {
				for (const accessedVariable of accessedVariables) {
					unknownVariables.push([accessedVariable]);
				}
			}

			return `${tagWrapStart}<unknown>@${replaceWithName ? (meta?.displayedName ?? variableName) : name}@</unknown>${tagWrapEnd}${metaSuffix}`;
		}

		if (typeof variable === 'string') {
			return `${tagWrapStart}${replaceWithName ? (meta?.displayedName ?? variableName) : variable}${tagWrapEnd}${metaSuffix}`;
		}

		const varValueSuffix = isPercentage ? '%' : (optionalPercent ?? '');

		if (Array.isArray(variable)) {
			if (variable[0] === undefined || variable[1] === undefined) {
				unknownVariables.push([name, actualVariableName]);
				const accessedVariables = variableValueFunctionParams.accessedVariables?.get(variableName);
				if (accessedVariables) {
					for (const accessedVariable of accessedVariables) {
						unknownVariables.push([accessedVariable]);
					}
				}

				return `${tagWrapStart}<unknown>@${replaceWithName ? (meta?.displayedName ?? variableName) : name}@</unknown>${tagWrapEnd}`;
			}

			const isV1Number = typeof variable[0] === 'number';
			const isV2Number = typeof variable[1] === 'number';

			const baseValue = [
				isV1Number ? roundVariable(variable[0] as number * multiplier) : variable[0],
				isV2Number ? roundVariable(variable[1] as number * multiplier) : variable[1],
			] as [string | number, string | number];

			if (meta?.type && modifyVariableFunctions[meta.type]) {
				if (isV1Number) {
					variable[0] = modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, variable[0]!);
				} else {
					console.warn('[replaceGameVariables] tried to apply modify function to variable but it\'s not a number', variableName, variable[0]);
				}
				if (isV2Number) {
					variable[1] = modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, variable[1]!);
				} else {
					console.warn('[replaceGameVariables] tried to apply modify function to variable but it\'s not a number', variableName, variable[1]);
				}
			}

			if (isV1Number) {
				variable[0] = roundVariable(variable[0] as number * multiplier);
			}
			if (isV2Number) {
				variable[1] = roundVariable(variable[1] as number * multiplier);
			}

			variables.set(variableName, {
				baseValue,
				value: variable as [string | number, string | number],
				meta,
				isPercentage,
				isUninteresting,
				metaSuffix,
			});

			return replaceWithName
				? `%i:meleeactive% | %i:rangedactive% ${tagWrapStart}${(meta?.displayedName ?? variableName)}${tagWrapEnd}${varValueSuffix}${metaSuffix}`
				: `%i:meleeactive% ${tagWrapStart}${
					isV1Number
						? (typeof roundReplaced === 'number'
								? roundVariable(variable[0] as number, roundReplaced)
								: roundReplaced
									? Math.round(variable[0] as number)
									: variable[0])
						: variable[0]}${tagWrapEnd}${varValueSuffix} | %i:rangedactive% ${tagWrapStart}${
					isV2Number
						? (typeof roundReplaced === 'number'
								? roundVariable(variable[1] as number, roundReplaced)
								: roundReplaced
									? Math.round(variable[1] as number)
									: variable[1])
						: variable[1]}${tagWrapEnd}${varValueSuffix}${metaSuffix}`;
		}

		const baseValue = roundVariable(variable * multiplier);

		if (meta?.type && modifyVariableFunctions[meta.type]) {
			variable = modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, variable);
		}

		variable = roundVariable(variable * multiplier);
		variables.set(variableName, { baseValue, value: variable, meta, isUninteresting, isPercentage, metaSuffix });

		const meleeRangedIconPath = isMeleeRanged === 0
			? 'melee'
			: isMeleeRanged === 1
				? 'ranged'
				: undefined;
		const iconPrefix = meleeRangedIconPath ? `%i:${meleeRangedIconPath}active% ` : '';

		return `${iconPrefix}${tagWrapStart}${replaceWithName
			? (meta?.displayedName ?? variableName)
			: (typeof roundReplaced === 'number'
					? roundVariable(variable, roundReplaced)
					: roundReplaced
						? Math.round(variable)
						: variable)}${tagWrapEnd}${varValueSuffix}${metaSuffix}`;
	});

	const dynamicVariables = (options.overrideVariables ?? variableValueFunctionParams.dynamicVariables);
	const customVariables = dynamicVariables?.meta && Object.entries(dynamicVariables.meta).filter(([, value]) => value?.isCustom);
	if (customVariables?.length) {
		for (const [variableName, meta] of customVariables) {
			let dynamicVariable = dynamicVariables!.values?.[variableName];
			if (dynamicVariable !== undefined) {
				const dynamicValue = Array.isArray(dynamicVariable) ? [(dynamicVariable as IVariableValueResult[])[0]!.value, (dynamicVariable as IVariableValueResult[])[1]!.value] : dynamicVariable.value;
				let value: IVariableValueResult['value'] = Number.NaN;
				let baseValue: number | [number, number] = Number.NaN;

				if (dynamicValue === undefined) {
					console.warn('[replaceGameVariables] custom got undefined dynamic value', variableName, dynamicVariable, variableValueFunctionParams);
				} else if (Array.isArray(dynamicValue)) {
					if (typeof dynamicValue[0] === 'number' && typeof dynamicValue[1] === 'number') {
						value = [roundVariable(dynamicValue[0]), roundVariable(dynamicValue[1])];
						baseValue = [dynamicValue[0], dynamicValue[1]];
					} else if (Array.isArray(dynamicValue[0]) || Array.isArray(dynamicValue[1])) {
						console.warn('[replaceGameVariables] custom got nested melee/ranged values', variableName, dynamicVariable, variableValueFunctionParams);
					} else {
						console.warn('[replaceGameVariables] custom ARRAY got non-number values', variableName, dynamicVariable, variableValueFunctionParams);
					}
				} else {
					if (typeof dynamicValue === 'number') {
						value = roundVariable(dynamicValue);
						baseValue = dynamicValue;
					} else {
						console.warn('[replaceGameVariables] custom NOT ARRAY got non-number values', variableName, dynamicVariable, variableValueFunctionParams);
					}
				}

				if (Array.isArray(value) && variableValueFunctionParams.isRanged !== undefined) {
					value = variableValueFunctionParams.isRanged
						? (value as number[])[1]
						: (value as number[])[0];
				}

				if (meta?.type && modifyVariableFunctions[meta.type]) {
					if (Array.isArray(value)) {
						(value as number[])[0] = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, (value as number[])[0]!));
						(value as number[])[1] = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, (value as number[])[1]!));
					} else {
						(dynamicVariable as number) = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, dynamicVariable as number));
					}
				}

				variables.set(variableName, { baseValue, value: value as number | [number, number], meta, isPercentage: meta?.isPercentage });
			}
		}
	}

	return { replaced, variables, unknownVariables, variablesAllValues, anyExtendedVariables };
}

const statIconNameValues = Object.values(STAT_ICON);

/** images found in [assets/ux/fonts/texticons/lol/champion](https://raw.communitydragon.org/16.13/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/champion) that are also encountered in some champion ability descriptions without the extension like `%i:asolstackicon%` or `%i:kindredpassiveicon%` */
const championGameIcons = [
	'asolstackicon',
	'kindredpassiveicon',
	'nasusstackicon',
	'sennascalingicon',
	'shyvana',
	'smolder',
	'threshscalingicon',
];

export function replaceGameIcons(text: string, subpath?: string): string {
	return text
		.replace(/%i:(\w+)%/g, (_, name: string) => {
			name = name.toLocaleLowerCase();
			const isChampionIcon = championGameIcons.includes(name);
			if (isChampionIcon && name === 'shyvana') {
				/* at least on current version `16.13.1` the icon on cdragon is actually named that while in the description it's just `%i:shyvana%` so try to handle it */
				name = 'shyvana.shyvana_rework';
			}

			return `<img src="https://raw.communitydragon.org/${PATCH_VERSION.vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/${statIconNameValues.includes(name)
				? 'statsicon'
				: subpath ?? (isChampionIcon ? 'champion' : 'gameplay')
			}/${name}.png" width="20" height="20" aria-hidden="true">`;
		})
		.replace(/\{\{ ?Item_Keyword_OnHit ?\}\}/g, `${ICON_ON_HIT_IMG} <onhit>On-Hit</onhit>`);
}

function addCalculatesFrom(
	to: ICalculatesFromPart[] | undefined,
	source1: ICalculatesFromPart[],
	/** expected to be used for melee/ranged calculates from and its value will be put into new calculation's value */
	source2?: ICalculatesFromPart[],
) {
	for (let i = 0; i < source1.length; i++) {
		to?.push({
			stat: source1[i]!.stat,
			type: source1[i]!.type,
			isPercentage: source1[i]!.isPercentage,
			value: source2 ? [source1[i]!.value as number, source2[i]!.value as number] : source1[i]!.value,
		});
	}
}

function multiplyCalculatePartValues(part: ICalculatesFromPart, multiplier: number) {
	if (Array.isArray(part.value)) {
		if (typeof part.value[0] === 'number') {
			part.value[0] *= multiplier;
		} else {
			part.value[0].min *= multiplier;
			part.value[0].max *= multiplier;
		}
		if (typeof part.value[1] === 'number') {
			part.value[1] *= multiplier;
		} else {
			(part.value[1]! as unknown as { min: number }).min *= multiplier;
			(part.value[1]! as unknown as { max: number }).max *= multiplier;
		}
	} else {
		if (typeof part.value === 'number') {
			part.value *= multiplier;
		} else {
			part.value.min *= multiplier;
			part.value.max *= multiplier;
		}
	}
}

function addToCalculatePartValues(part: ICalculatesFromPart, value: number) {
	if (Array.isArray(part.value)) {
		if (typeof part.value[0] === 'number') {
			part.value[0] += value;
		} else {
			part.value[0].min += value;
			part.value[0].max += value;
		}
		if (typeof part.value[1] === 'number') {
			part.value[1] += value;
		} else {
			(part.value[1]! as unknown as { min: number }).min += value;
			(part.value[1]! as unknown as { max: number }).max += value;
		}
	} else {
		if (typeof part.value === 'number') {
			part.value += value;
		} else {
			part.value.min += value;
			part.value.max += value;
		}
	}
}

export const CHAMPION_STAT_TO_SCALING_TAG: Partial<Record<IVariableMetaStatIcon, string>> = {
	hp: 'scalehealth',
	armor: 'scalearmor',
	attackDamage: 'scalead',
	abilityPower: 'scaleap',
	lethality: 'scalelethality',
	magicResist: 'scalemr',
	moveSpeed: 'speed',
	mana: 'scalemana',
	manaRegen: 'scalemana',
	level: 'scalelevel',
};

export function calculatesFromPartExtendedEquals(
	part: ICalculatesFromPart,
	insertIcon = false,
	preferRangedValue = false,
	prependPlus = false,
): string {
	const tag = part.stat === 'const' ? 'const' : ((part.stat && CHAMPION_STAT_TO_SCALING_TAG[part.stat]) || '');
	const icon = insertIcon && part.stat && part.stat !== 'const' ? STAT_ICON[part.stat] : '';
	const type = part.type === 'baseOnLevel' || part.type === 'base' ? ' base' : part.type === 'bonus' ? ' bonus' : '';
	const formattedValue = formatCalculatesFromPartValue(
		Array.isArray(part.value)
			? part.value[preferRangedValue ? 1 : 0]!
			: part.value,
		part.stat,
		part.isPercentage,
	);

	return `${
		tag ? `<${tag}>` : ''
	}${
		prependPlus ? '+ ' : ''
	}${formattedValue}${type}${
		icon ? `${type ? ' ' : ''}%i:${icon}%` : ''
	}${
		tag ? `</${tag}>` : ''
	}`;
}

function formatCalculatesFromPartValue(value: Exclude<ICalculatesFromPart['value'], any[]>, stat: ICalculatesFromPart['stat'], isPercentage?: boolean): string {
	let multiplier: number, valueSuffix: string;
	let roundTo = 1;
	if (isPercentage) {
		multiplier = stat === 'critChance' ? 1 : 100;
		valueSuffix = '%';
		roundTo = 3;
	} else {
		multiplier = 1;
		valueSuffix = '';
	}

	return typeof value === 'number'
		? `${isPercentage ? roundVariable(value * multiplier, roundTo) : Math.round(value * multiplier)}${valueSuffix}`
		: `${isPercentage ? roundVariable(value.min * multiplier, roundTo) : Math.round(value.min * multiplier)}${valueSuffix} - ${isPercentage ? roundVariable(value.max * multiplier, roundTo) : Math.round(value.max * multiplier)}${valueSuffix}`;
}

function variableExtendedEquals(
	variableValueFunctionParams: IItemVariableParams | IRuneVariableParams | IChampionAbilityVariableParams,
	options: Partial<IReplaceGameVariablesOptions>,
	isMeleeRanged: IVariableValueResult['isMeleeRanged'],
	calculatesFrom: IVariableValueResult['calculatesFrom'],
	meta: IVariableMeta | undefined,
	varIcon?: string,
): string {
	let metaSuffix = '';
	let extendedEquals = typeof meta?.extendedEquals === 'function'
		? meta.extendedEquals(variableValueFunctionParams, options.overrideVariables)
		: typeof meta?.extendedEquals !== 'object'
			? meta?.extendedEquals as string
			: `${meta.extendedEquals.prefix}${isMeleeRanged === true
				? `${meta.extendedEquals.meleeValue}${meta.extendedEquals.valueSuffix || ''} <const>|</const> ${meta.extendedEquals.prefix}${meta.extendedEquals.rangedValue}`
				: meta.extendedEquals[isMeleeRanged === 0 ? 'meleeValue' : 'rangedValue']
			}${meta.extendedEquals.valueSuffix || ''}${meta.extendedEquals.suffix}`;

	let statIconKey = meta?.scalesWithStatIcon;

	if (calculatesFrom?.length && calculatesFrom.some(part => part.stat !== 'const' || part.type)) {
		calculatesFrom.sort((partA, partB) => (partB.stat === 'const' ? 1 : 0) - (partA.stat === 'const' ? 1 : 0));
		let generatedStatIcon: IVariableMetaStatIcon[] | IVariableMetaStatIcon | undefined;

		const hasMeleeRangedValue = calculatesFrom.some(part => Array.isArray(part.value));
		const isEqualsMeleeRanged = isMeleeRanged === true && hasMeleeRangedValue;
		const lastPart = calculatesFrom.at(-1);
		const insertIcon = calculatesFrom.filter(part => part.stat && part.stat !== 'const').length > 1 || (calculatesFrom.length > 1 && (hasMeleeRangedValue || (lastPart && lastPart.stat === 'const')));

		const defaultEEPreferRangedValue = isMeleeRanged === 1;
		generatedStatIcon = (calculatesFrom[0]!.stat && calculatesFrom[0]!.stat !== 'const') ? [calculatesFrom[0]!.stat] : undefined;
		const rawGeneratedEE: [string, string] = [
			calculatesFromPartExtendedEquals(calculatesFrom[0]!, insertIcon, defaultEEPreferRangedValue),
			isEqualsMeleeRanged ? calculatesFromPartExtendedEquals(calculatesFrom[0]!, insertIcon, true) : '',
		];
		for (const part of calculatesFrom.slice(1)) {
			rawGeneratedEE[0] += ` ${calculatesFromPartExtendedEquals(part, insertIcon, defaultEEPreferRangedValue, true)}`;
			if (isEqualsMeleeRanged) {
				rawGeneratedEE[1] += ` ${calculatesFromPartExtendedEquals(part, insertIcon, true, true)}`;
			}
			if (part.stat && part.stat !== 'const') {
				generatedStatIcon ??= [];
				generatedStatIcon.push(part.stat);
			}
		}

		if (!(meta && 'scalesWithStatIcon' in meta)) {
			if (!insertIcon && Array.isArray(generatedStatIcon) && generatedStatIcon?.length === 1) {
				generatedStatIcon = generatedStatIcon[0];
			}

			statIconKey = generatedStatIcon;
		}

		if (!(meta && 'extendedEquals' in meta)) {
			extendedEquals = `${isEqualsMeleeRanged ? `${rawGeneratedEE[0]} <const>|</const> ${rawGeneratedEE[1]}` : rawGeneratedEE[0]}${typeof generatedStatIcon === 'string' && !insertIcon && (lastPart?.type && lastPart.type !== 'total') ? ' ' : ''}`;
		}
	}

	if (statIconKey || varIcon) {
		const iconStr = (typeof statIconKey === 'string'
			? statIconKey ? `%i:${STAT_ICON[statIconKey]}%` : ''
			: options.isExtended ? '' : statIconKey?.map(icon => `%i:${STAT_ICON[icon]}%`).join('')) || varIcon || '';

		(extendedEquals && options.isExtended)
			? metaSuffix = ` = (${extendedEquals}${iconStr})`
			: metaSuffix = ` (${iconStr})`;
	} else if (extendedEquals && options.isExtended) {
		metaSuffix = ` = (${extendedEquals})`;
	}

	return metaSuffix;
}

/** functions for resolving game variables named by their `__type` or other identifier */
export const VARIABLE_CALCULATION_FNS = {
	mFormulaParts(variable: { mFormulaParts: (IGameVariablesByType[keyof IGameVariablesByType])[]; mDisplayAsPercent?: boolean }, whole, meta) {
		const rv: IVariableValueResult = {
			calculatesFrom: [],
		};
		const values = variable.mFormulaParts.map((part) => {
			const resolveFn = variableResolveFn(part);
			if (resolveFn) {
				const resolved = resolveFn(part, whole, meta);
				if (resolved?.roundReplaced) {
					rv.roundReplaced = resolved.roundReplaced;
				}
				if (resolved?.calculatesFrom) {
					addCalculatesFrom(rv.calculatesFrom, resolved.calculatesFrom);
				}
				if (resolved?.isPercentage) {
					rv.isPercentage ||= resolved.isPercentage;
				}
				return resolved?.value as number;
			}
			return undefined;
		});

		if (variable.mDisplayAsPercent) {
			rv.isPercentage = true;
			rv.multiplier = 100;
			rv.roundReplaced = true;
		}

		const hasMMultiplier = ('mMultiplier' in variable);
		const hasMRangedMultiplier = ('mRangedMultiplier' in variable);

		if (values.length === 1) {
			if (rv.calculatesFrom![0] && variable.mDisplayAsPercent) {
				rv.calculatesFrom![0].isPercentage = true;
			}

			if (!hasMMultiplier && !hasMRangedMultiplier) {
				rv.value = values[0];
				return rv;
			}
		}

		if (values.some(v => typeof v !== 'number')) {
			return undefined;
		}

		rv.value = values.reduce((acc, curr) => curr! + acc!, 0)!;

		if (hasMMultiplier) {
			const multiplier = resolveMMultiplier(variable.mMultiplier as any, whole, meta) ?? 1;
			rv.value *= multiplier;
			for (const part of rv.calculatesFrom!) {
				if (part.stat && part.stat !== 'const') {
					multiplyCalculatePartValues(part, multiplier);
				}
			}
		} else if (hasMRangedMultiplier) {
			rv.isMeleeRanged = true;
			const multiplier = resolveMMultiplier(variable.mRangedMultiplier as any, whole, meta);

			if (multiplier === undefined) {
				rv.value = undefined;
			} else if (meta?.isRanged === undefined) {
				rv.isMeleeRanged = true;
				rv.value = [rv.value, rv.value * multiplier];
				for (const part of rv.calculatesFrom!) {
					if (Array.isArray(part.value)) {
						console.warn('[mFormulaParts] tried to apply mRangedMultiplier to calculatesFrom part but it already is melee/ranged', variable, rv.value, rv.calculatesFrom);
					} else if (typeof part.value === 'number') {
						part.value = [part.value, part.value * multiplier];
					} else {
						part.value = [part.value, { min: part.value.min * multiplier, max: part.value.max * multiplier }];
					}
				}
			} else if (meta.isRanged) {
				rv.isMeleeRanged = 1;
				rv.value *= multiplier ?? 1;
				for (const part of rv.calculatesFrom!) {
					multiplyCalculatePartValues(part, multiplier);
				}
			} else {
				rv.isMeleeRanged = 0;
			}
		}

		return rv;
	},
	NumberCalculationPart(variable: IGameVariablesByType['NumberCalculationPart']) {
		return {
			value: variable.mNumber,
			calculatesFrom: [{
				value: variable.mNumber,
				stat: 'const',
			}],
		};
	},
	NamedDataValueCalculationPart(variable: IGameVariablesByType['NamedDataValueCalculationPart'], whole, meta) {
		meta?.accessedVariables?.add(variable.mDataValue);

		let value = whole.dataValues?.[variable.mDataValue];
		if (Array.isArray(value)) {
			if (value.length === 2) {
				console.warn('[resolveMMultiplier] suspiciously melee/ranged looking value having abilityLevel applied to it', whole, meta);
			}
			value = value[(meta?.variableValueParams as IChampionAbilityVariableParams).abilityLevel ?? 1];
		}

		return {
			value,
			calculatesFrom: [{
				value: whole.dataValues?.[variable.mDataValue],
				stat: 'const',
			}],
		};
	},
	ByCharLevelBreakpointsCalculationPart(variable: IGameVariablesByType['ByCharLevelBreakpointsCalculationPart'], _whole, meta) {
		const rv: IVariableValueResult = {
			value: variable.mLevel1Value,
			calculatesFrom: [],
		};
		const min = rv.value as number;
		const level = meta.variableValueParams.damageSource?.level.value ?? 1;
		if ('mBreakpoints' in variable) {
			let max = min;
			for (const { mAdditionalBonusAtThisLevel, mBonusPerLevelAtAndAfter, mLevel } of variable.mBreakpoints) {
				if (level >= mLevel) {
					if (mBonusPerLevelAtAndAfter || mAdditionalBonusAtThisLevel) {
						(rv.value as number) += mBonusPerLevelAtAndAfter === undefined
							? mAdditionalBonusAtThisLevel!
							: (mBonusPerLevelAtAndAfter * (level + 1 - mLevel));
					} else {
						console.warn(`[variables/game fn ByCharLevelBreakpointsCalculationPart] unknown mBreakpoints structure`, variable);
						rv.value = undefined;
					}
				}

				if (CHAMPION_LEVEL.max >= mLevel) {
					max += mBonusPerLevelAtAndAfter === undefined
						? mAdditionalBonusAtThisLevel!
						: (mBonusPerLevelAtAndAfter * (CHAMPION_LEVEL.max + 1 - mLevel));
				}
			}
			rv.calculatesFrom!.push({
				value: { min, max },
				stat: 'level',
			});
		} else {
			const max = min + (variable.mInitialBonusPerLevel * (CHAMPION_LEVEL.max - 1));
			rv.calculatesFrom!.push({
				value: { min, max },
				stat: 'level',
			});
			(rv.value as number) += variable.mInitialBonusPerLevel * (level - 1);
		}
		return rv;
	},
	StatByCoefficientCalculationPart(variable: IGameVariablesByType['StatByCoefficientCalculationPart'], _whole, meta) {
		const statValue = resolveMStatWithFormula(variable, meta.variableValueParams.damageSource?.stats.value);
		if (statValue !== undefined && variable.mCoefficient) {
			return {
				value: statValue.value * variable.mCoefficient,
				roundReplaced: true,
				calculatesFrom: [{
					value: variable.mCoefficient,
					isPercentage: true,
					stat: statValue.stat as ICalculatesFromPart['stat'],
					type: statValue.type,
				}],
			};
		}
	},
	/** basically same as `StatByCoefficientCalculationPart` but just for mana */
	AbilityResourceByCoefficientCalculationPart(variable: IGameVariablesByType['AbilityResourceByCoefficientCalculationPart'], _whole, meta) {
		const statsKey = mStatFormulaStatKey(variable);
		if (statsKey) {
			return {
				value: meta.variableValueParams.damageSource?.stats.value ? meta.variableValueParams.damageSource.stats.value[statsKey].mana * (variable.mCoefficient ?? 1) : 0,
				calculatesFrom: [{
					value: (variable.mCoefficient ?? 1),
					stat: 'mana',
					isPercentage: true,
					type: statsKey,
				}],
			};
		}
	},
	StatByNamedDataValueCalculationPart(variable: IGameVariablesByType['StatByNamedDataValueCalculationPart'], whole, meta) {
		const statValue = resolveMStatWithFormula(variable, meta.variableValueParams.damageSource?.stats.value);
		let dataValue = whole.dataValues?.[variable.mDataValue];
		meta?.accessedVariables?.add(variable.mDataValue);

		if (dataValue !== undefined) {
			if (Array.isArray(dataValue)) {
				if (dataValue.length === 2) {
					console.warn('[StatByNamedDataValueCalculationPart] suspiciously melee/ranged looking value having abilityLevel applied to it', { dataValue, statValue }, variable);
				}
				dataValue = dataValue[(meta.variableValueParams as IChampionAbilityVariableParams).abilityLevel ?? 1];
			}

			if (statValue !== undefined) {
				return {
					value: statValue.value * dataValue,
					roundReplaced: true,
					calculatesFrom: [{
						value: dataValue,
						isPercentage: true,
						stat: statValue.stat as ICalculatesFromPart['stat'],
						type: statValue.type,
					}],
				};
			} else {
				return {
					value: dataValue,
				};
			}
		}
	},
	/** calculates the value between `mStartValue` and `mEndValue` based on damage source's level. Formula taken from [Protoplasm Harness' wiki](https://wiki.leagueoflegends.com/en-us/Protoplasm_Harness) */
	ByCharLevelInterpolationCalculationPart(variable: IGameVariablesByType['ByCharLevelInterpolationCalculationPart'], _whole, meta) {
		const { mStartValue = 0, mEndValue } = variable;
		return {
			value: mStartValue + (mEndValue - mStartValue) / (CHAMPION_LEVEL.max - 1) * ((meta.variableValueParams.damageSource?.level.value ?? 1) - 1),
			calculatesFrom: [{
				stat: 'level',
				value: {
					min: mStartValue,
					max: mEndValue,
				},
			}],
		};
	},
	mModifiedGameCalculation(variable: { mModifiedGameCalculation: string; mMultiplier?: any }, whole, meta) {
		if (!variable.mModifiedGameCalculation) {
			return;
		}

		let multiplier = 1;
		if ('mMultiplier' in variable) {
			multiplier = resolveMMultiplier(variable.mMultiplier, whole, meta)!;
		}
		meta.variableValueParams.accessedVariables ??= new Map();
		const rv = meta.variableValueFn(variable.mModifiedGameCalculation, meta.variableValueParams);

		if (typeof rv.value === 'number') {
			rv.value *= multiplier;
		} else if (Array.isArray(rv.value)) {
			if (typeof rv.value[0] === 'number') {
				rv.value[0] *= multiplier;
			}
			if (typeof rv.value[1] === 'number') {
				rv.value[1] *= multiplier;
			}
		}

		if (rv.calculatesFrom?.length) {
			for (const part of rv.calculatesFrom) {
				multiplyCalculatePartValues(part, multiplier);
			}
		}

		return rv;
	},
	StatBySubPartCalculationPart(variable: IGameVariablesByType['StatBySubPartCalculationPart'], _whole, meta) {
		const statValue = resolveMStatWithFormula(variable, meta.variableValueParams.damageSource?.stats.value);
		const { mNumber } = variable.mSubpart;

		if (mNumber !== undefined) {
			if (statValue !== undefined) {
				return {
					value: statValue.value * mNumber,
					roundReplaced: true,
					calculatesFrom: [{
						value: mNumber,
						isPercentage: true,
						stat: statValue.stat as ICalculatesFromPart['stat'],
						type: statValue.type,
					}],
				};
			} else {
				return {
					value: mNumber,
				};
			}
		}
	},
	SumOfSubPartsCalculationPart(variable: IGameVariablesByType['SumOfSubPartsCalculationPart'], whole, meta) {
		const rv: IVariableValueResult = {
			calculatesFrom: [],
		};
		const values: (number | undefined)[] = [];
		const calculatesFromConstOffset: number[] = [];

		for (const part of variable.mSubparts) {
			const resolveFn = variableResolveFn(part);
			if (!resolveFn) {
				return undefined;
			}

			const resolved = resolveFn(part, whole, meta);
			if (typeof resolved?.value !== 'number') {
				console.warn('[SumOfSubPartsCalculationPart] resolved subpart value not a number', resolved, variable, whole, meta);
				return undefined;
			}

			if (resolved.roundReplaced) {
				rv.roundReplaced = resolved.roundReplaced;
			}
			values.push(resolved.value);

			if (resolved.calculatesFrom?.length) {
				addCalculatesFrom(rv.calculatesFrom, resolved.calculatesFrom);
				/* try my best to collapse multiple calculatesFrom parts into a single, non const one if detected. Based on Mikael's AmountToHeal */
				const nonConstParts = rv.calculatesFrom!.filter(part => part.stat && part.stat !== 'const');
				if (nonConstParts.length === 1) {
					const [nonConstPart] = nonConstParts;
					const constValue = rv.calculatesFrom!.reduce((acc, part) => (part === nonConstPart ? 0 : (part.value as number)) + acc, 0);
					if (Number.isNaN(constValue)) {
						console.warn('[SumOfSubPartsCalculationPart] const part value not a number', rv.calculatesFrom);
					} else {
						addToCalculatePartValues(nonConstPart!, constValue);
						for (let i = rv.calculatesFrom!.length - 1; i >= 0; i--) {
							if (rv.calculatesFrom![i] !== nonConstPart) {
								rv.calculatesFrom!.splice(i, 1);
							}
						}
					}
				} else if (nonConstParts.length) {
					console.warn('[SumOfSubPartsCalculationPart] should somehow handle multiple non const calculatesFrom', rv.calculatesFrom);
				}
			} else {
				calculatesFromConstOffset.push(resolved.value);
			}
		};

		rv.value = values.reduce((acc, curr) => curr! + acc!, 0)!;

		const totalCalculatesFromConst = calculatesFromConstOffset.reduce((acc, curr) => acc + curr, 0);
		if (totalCalculatesFromConst) {
			for (const part of rv.calculatesFrom!) {
				addToCalculatePartValues(part, totalCalculatesFromConst);
			}
		}

		return rv;
	},
	ProductOfSubPartsCalculationPart(variable: IGameVariablesByType['ProductOfSubPartsCalculationPart'], whole, meta) {
		const left = variableResolveFn(variable.mPart1)?.(variable.mPart1, whole, meta);
		const right = variableResolveFn(variable.mPart2)?.(variable.mPart2, whole, meta);
		if (typeof left?.value !== 'number' || typeof right?.value !== 'number') {
			return;
		}

		const rv: IVariableValueResult<number> = {
			value: left.value * right.value,
			roundReplaced: left.roundReplaced || right.roundReplaced,
		};

		const leftHasCalcFrom = left.calculatesFrom?.length;
		const rightHasCalcFrom = right.calculatesFrom?.length;
		if (leftHasCalcFrom && !rightHasCalcFrom) {
			console.warn('[ProductOfSubPartsCalculationPart] debug left branch');
			rv.calculatesFrom = left.calculatesFrom!;
			for (const part of rv.calculatesFrom) {
				multiplyCalculatePartValues(part, right.value);
			}
		} else if (!leftHasCalcFrom && rightHasCalcFrom) {
			console.warn('[ProductOfSubPartsCalculationPart] debug right branch');
			rv.calculatesFrom = right.calculatesFrom!;
			for (const part of rv.calculatesFrom) {
				multiplyCalculatePartValues(part, left.value);
			}
		} else if (leftHasCalcFrom && rightHasCalcFrom) {
			/* try my best to collapse multiple calculatesFrom parts into a single, non const one if detected. Based on Mikael's AmountToHeal */
			const [nonConstPart, constPart] = right.calculatesFrom![0]!.stat === 'const' ? [left.calculatesFrom!, right.calculatesFrom!] : [right.calculatesFrom!, left.calculatesFrom!];
			if (nonConstPart.length === 1) {
				rv.calculatesFrom = nonConstPart;
				const constValue = constPart.reduce((acc, part) => (part.value as number) + acc, 0);
				if (Number.isNaN(constValue)) {
					console.warn('[ProductOfSubPartsCalculationPart] const part value not a number', left, right);
				} else {
					multiplyCalculatePartValues(rv.calculatesFrom[0]!, constValue);
				}
			} else {
				console.warn('[ProductOfSubPartsCalculationPart] should somehow handle multiple non const calculatesFrom', left, right);
			}
		}

		return rv;
	},
} satisfies IHypotheticalVariableCalculationFns;

type IHypotheticalVariableCalculationFns = Record<
	string,
	(
		variable: any,
		whole: any,
		meta: {
			variableValueFn: (variable: string, params: any) => IVariableValueResult;
			variableValueParams: IItemVariableParams | IRuneVariableParams | IChampionAbilityVariableParams;
			isRanged?: boolean;
			accessedVariables?: Set<string>;
		},
	) => IVariableValueResult | undefined
>;

interface IGameVariablesByType {
	ByCharLevelBreakpointsCalculationPart: {
		mLevel1Value: number;
		mBreakpoints: {
			mLevel: number;
			mAdditionalBonusAtThisLevel?: number;
			mBonusPerLevelAtAndAfter?: number;
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
	StatByCoefficientCalculationPart: IStatWithFormula & {
		mCoefficient: number;
		__type: string;
	};
	StatByNamedDataValueCalculationPart: IStatWithFormula & {
		mDataValue: string;
		__type: string;
	};
	AbilityResourceByCoefficientCalculationPart: IStatWithFormula & {
		mCoefficient?: number;
		__type: string;
	};
	ByCharLevelInterpolationCalculationPart: {
		mStartValue: number;
		mEndValue: number;
		__type: string;
	};
	StatBySubPartCalculationPart: {
		mStat: number;
		mSubpart: {
			mNumber: number;
		};
		__type: string;
	};
	SumOfSubPartsCalculationPart: {
		mSubparts: IGameVariablesByType[keyof IGameVariablesByType][];
		__type: string;
	};
	ProductOfSubPartsCalculationPart: {
		mPart1: IGameVariablesByType[keyof IGameVariablesByType];
		mPart2: IGameVariablesByType[keyof IGameVariablesByType];
		__type: string;
	};
}

export function variableResolveFn(variable: any): IHypotheticalVariableCalculationFns[keyof IHypotheticalVariableCalculationFns] | undefined {
	if ('__type' in variable && variable.__type in VARIABLE_CALCULATION_FNS) {
		return VARIABLE_CALCULATION_FNS[variable.__type as keyof typeof VARIABLE_CALCULATION_FNS];
	} else if ('mFormulaParts' in variable) {
		return VARIABLE_CALCULATION_FNS.mFormulaParts;
	} else if ('mModifiedGameCalculation' in variable) {
		return VARIABLE_CALCULATION_FNS.mModifiedGameCalculation;
	} else if ('mSubparts' in variable) {
		return VARIABLE_CALCULATION_FNS.SumOfSubPartsCalculationPart;
	} else if ('mPart1' in variable && 'mPart2' in variable) {
		return VARIABLE_CALCULATION_FNS.ProductOfSubPartsCalculationPart;
	}

	const keys = Object.keys(variable);
	if (keys.length === 1) {
		const [key] = keys;
		if (key === 'mNumber') {
			return VARIABLE_CALCULATION_FNS.NumberCalculationPart;
		} else if (key === 'mDataValue') {
			return VARIABLE_CALCULATION_FNS.NamedDataValueCalculationPart;
		} else if (key === 'mEndValue') {
			return VARIABLE_CALCULATION_FNS.ByCharLevelInterpolationCalculationPart;
		}
	}

	console.warn('[variableResolveFn] unknown variable type', variable);
	return undefined;
}

/** info in `MSTAT_TO_NAMED_STAT` and `resolveMStatWithFormula` */
interface IStatWithFormula {
	mStat: number;
	mStatFormula?: number;
}

/** item variables sometimes have fields with `mStat: number`, which from what I can tell is supposed to be a champion's stat. This is a map of known numbers to their corresponding stats, supposed to be used with */
const MSTAT_TO_NAMED_STAT = {
	1: 'armor',
	2: 'attackDamage',
	6: 'magicResist',
	7: 'moveSpeed',
	8: 'critChance',
	12: 'hp',
	29: 'lethality',
} satisfies Record<number, IChampionStatName>;

function mStatFormulaStatKey(stat: IStatWithFormula): ICalculatesFromPart['type'] {
	if (stat.mStatFormula === 1) {
		return 'baseOnLevel';
	} else if (stat.mStatFormula === 2) {
		return 'bonus';
	} else if (stat.mStatFormula === undefined) {
		return 'total';
	}
}

/** used for resolving variables of type `IStatWithFormula`, which basically are supposed to be various kinds (like base, bonus, total, determined by `mStatFormula`) of champion's stats (determined by `mStat`) */
function resolveMStatWithFormula(stat: IStatWithFormula, stats?: IStatsCalculationResult): {
	value: number;
	stat: IChampionStatName;
	type: NonNullable<ICalculatesFromPart['type']>;
} | undefined {
	const statsKey = mStatFormulaStatKey(stat);
	// TODO not sure if can just fall back to ap, at the moment dusk and dawn doesn't have `mStat` specified and seems to be using ap there
	const targetStat = stat.mStat ? MSTAT_TO_NAMED_STAT[stat.mStat as keyof typeof MSTAT_TO_NAMED_STAT] : 'abilityPower';
	/** resolved to 0 if `stats` are undefined because "known" (in this case ones with handled `mStatFormula` and which `mStat` is handled in `MSTAT_TO_NAMED_STAT`) variables must be resolved to something, even if to an incorrect/placeholder value, to not be marked as unknown in `updateData` */
	if (statsKey && targetStat) {
		return { value: stats ? stats[statsKey][targetStat] : 0, stat: targetStat, type: statsKey };
	}
	return undefined;
}

function resolveMMultiplier(
	variable: IGameVariablesByType['NumberCalculationPart'] & IGameVariablesByType['NamedDataValueCalculationPart'],
	whole: any,
	meta?: Parameters<IHypotheticalVariableCalculationFns[keyof IHypotheticalVariableCalculationFns]>[2],
): number | undefined {
	const { mNumber, mDataValue } = variable;
	let rv: number | undefined;
	if (mNumber) {
		rv = mNumber;
	} else if (mDataValue) {
		meta?.accessedVariables?.add(variable.mDataValue);
		const value = whole.dataValues?.[mDataValue];

		/* expected to happen for champions */
		if (Array.isArray(value)) {
			if (value.length === 2) {
				console.warn('[resolveMMultiplier] suspiciously melee/ranged looking value having abilityLevel applied to it', { mNumber, mDataValue }, variable);
			}
			rv = value[(meta?.variableValueParams as IChampionAbilityVariableParams).abilityLevel ?? 1];
		} else {
			rv = value;
		}
	} else {
		console.warn('[variables/game resolveMMultiplier] unknown mMultiplier structure', variable);
		rv = undefined;
	}
	/* there could be a better way */
	return rv === 0.667 ? (2 / 3) : rv;
}
