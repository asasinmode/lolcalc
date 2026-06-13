import type { IChampionAbilityVariant, IItem, IItemStat, IRune } from '@lolcalc/data/types';
import type { IChampionStatName, IStatsCalculationResult, IVariableType } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource.ts';
import type { ICalculatedDynamicVariable, ISpecificVariables } from '../specifics/index';

import { ICON_ON_HIT_IMG, PATCH_VERSION, STAT_ICON } from '@lolcalc/data';
import { CHAMPION_LEVEL } from '@lolcalc/shared';
import { roundVariable } from '@lolcalc/shared/utils.ts';

export interface IReplacedGameVariable {
	baseValue: number | [number, number];
	value: number | [number, number];
	meta?: IVariableMeta;
	isUninteresting?: boolean;
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
	 * when present, formatted variable will have `(%i:STAT_ICON[statIconKey]%)` appended to it. If the value is an array of icons, no `(...icons)` will be appended when replace's `isExtended: true`, the icons are to be manually added in `extendedEquals` in that case
	 * `replaceGameVariables` doesnt handle the elaborate stat icons that are full blown paths like `slowResist` so for now these are manually excluded
	 */
	scalesWithStatIcon?: IVariableMetaStatIcon | IVariableMetaStatIcon[];
	/**
	 * when present, formatted variable will have `= (${extendedEquals})` appended to in the extended version (holding shift)
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
	/** `%` will be suffixed to the formatted value in replaced description */
	isPercentage?: boolean;
	/** `%` will be suffixed to the formatted value in results */
	resultsIsPercentage?: boolean;
	/** same as `multiplier` but only for results */
	resultsMultiplier?: number;
	type?: IVariableType;
	/** whether the variable is a custom one, not found in description but computed by lolcalc and wanted in results */
	isCustom?: boolean;
}

interface ICalculatesFromPart {
	stat?: 'const' | 'level' | Exclude<IChampionStatName, 'slowResist'>;
	type?: 'baseOnLevel' | 'bonus' | 'total';
	/** when array, expected to be for melee/ranged values */
	value: number | { min: number; max: number } | [number, number] | [{ min: number; max: number } | { min: number; max: number }];
	isPercentage?: boolean;
}

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
	/**
	 * usually when value was calculated in some way and might have floating points that should be rounded in description
	 * if `number`, assumed to be `roundVariable`'s `precision` parameter
	 */
	roundReplaced?: boolean | number;
	/** whether `ISpecificVariables.uninteresting` includes it */
	isUninteresting?: boolean;
	/** components the variable was calculated from, used for creating `extendedEquals` */
	calculatesFrom?: ICalculatesFromPart[];
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

interface IBaseVariableParams {
	dynamicVariables?: IDynamicVariables;
	/**
	 * any other variables that were accessed while trying to resolve the current one.
	 * for example Endless Hunger's `HasteFromAD` resolves to (originally hashed) either `HasteFromADMelee` or `HasteFromADRanged`, so these 2 will be listed under `accessedVariables.get('HasteFromAD')`
	 * used in `updateData` for trying to resolve hashed versions of unknown variables
	 */
	accessedVariables?: Map<string, Set<string>>;
	damageSource?: DamageSource;
	/** usually `damageSource.isRanged.value` but here for easier overriding when getting values for `isRanged: undefined` since then the variable value function is called with `true` and `false` replacing it */
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
		rv.roundReplaced = true;
		Object.assign(rv, dynamicVariables.values[variable]);
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
	} else if (item.stats?.[variable as IItemStat] !== undefined) {
		rv.value = item.stats[variable as IItemStat];
	} else if (item.dataValues?.[variable] !== undefined) {
		rv.value = item.dataValues[variable];
	} else if (item.stringCalculations?.[variable]) {
		rv.isMeleeRanged = isRanged === true ? 1 : isRanged === false ? 0 : true;
		if (isRanged === undefined) {
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
					console.warn('[itemVariableValue] detected melee/ranged variable but only got calculatesFrom for one', item.name, variable, melee, ranged);
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
			});
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
	const replaced = text.replace(/@(.+?)@(%?)(?:\s*\((%[^)\s]+%)\))?/g, (_, name, optionalPercent, varIcon) => {
		let variableName = name;
		let multiplier = 1;

		const multiplierIndex = name.indexOf('*');
		if (~multiplierIndex) {
			multiplier = Number.parseFloat(name.slice(multiplierIndex + 1));
			variableName = name.slice(0, multiplierIndex);
		}

		let { value: variable, isMeleeRanged, actualVariableName, allValues, roundReplaced, meta, isUninteresting, calculatesFrom } = (variableType === 'item'
			? itemVariableValue
			: variableType === 'championAbility'
				? championAbilityVariableValue
				: runeVariableValue)(variableName, variableValueFunctionParams as any, options.overrideVariables);

		if (meta?.roundReplaced !== undefined) {
			roundReplaced = meta.roundReplaced;
		}

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
		const extendedEquals = typeof meta?.extendedEquals === 'function'
			? meta.extendedEquals(variableValueFunctionParams, options.overrideVariables)
			: typeof meta?.extendedEquals !== 'object'
				? meta?.extendedEquals as string
				: `${meta.extendedEquals.prefix}${isMeleeRanged === true
					? `${meta.extendedEquals.meleeValue}${meta.extendedEquals.valueSuffix || ''} | ${meta.extendedEquals.rangedValue}`
					: meta.extendedEquals[isMeleeRanged === 0 ? 'meleeValue' : 'rangedValue']
				}${meta.extendedEquals.valueSuffix || ''}${meta.extendedEquals.suffix}`;

		const statIconKey = meta?.scalesWithStatIcon;
		// TODO run updateData with logging to see what's changed
		// TODO convert to stat icons
		let generatedStatIcon: IVariableMetaStatIcon[] | IVariableMetaStatIcon | undefined;

		// TODO TMP while extendedEquals is generated now in most cases, the items manual ones are kept for the time of implementing champion passives to make sure any changes made to generating preserve what the handmade item ones look like
		if (calculatesFrom?.length && (calculatesFrom?.length > 1 || calculatesFrom[0]!.stat !== 'const')) {
			const isMeleeRanged = calculatesFrom.some(part => Array.isArray(part.value));
			const insertIcon = calculatesFrom.filter(part => part.stat && part.stat !== 'const').length > 1;
			let generatedEE = calculatesFromPartExtendedEquals(calculatesFrom[0]!, insertIcon, isMeleeRanged);
			generatedStatIcon = (calculatesFrom[0]!.stat && calculatesFrom[0]!.stat !== 'const') ? [calculatesFrom[0]!.stat] : undefined;
			for (const part of calculatesFrom.slice(1)) {
				generatedEE += ` ${calculatesFromPartExtendedEquals(part, insertIcon, isMeleeRanged, true)}`;
				if (part.stat && part.stat !== 'const') {
					generatedStatIcon ??= [];
					generatedStatIcon.push(part.stat);
				}
			}
			if (Array.isArray(generatedStatIcon) && generatedStatIcon?.length === 1) {
				generatedStatIcon = generatedStatIcon[0];
			}

			if (generatedEE !== extendedEquals) {
				console.warn('new extended different', {
					variableName,
					extendedEquals,
					generatedEE,
				}, calculatesFrom);
			} else {
				console.log('generated extended same', variableName, generatedEE);
			}
		} else if (extendedEquals) {
			console.warn('didnt generate extended', { variableName, extendedEquals }, calculatesFrom);
		}

		if (
			(statIconKey && !generatedStatIcon)
			|| (generatedStatIcon && !statIconKey)
			|| (Array.isArray(statIconKey)
				? !(Array.isArray(generatedStatIcon) && statIconKey.every((icon, i) => generatedStatIcon[i] === icon))
				: statIconKey !== generatedStatIcon
			)
		) {
			console.warn('new icon diff', { variableName, statIconKey, generatedStatIcon }, calculatesFrom);
		} else if (generatedStatIcon) {
			console.log('generated icon same', variableName, generatedStatIcon);
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

		if (meta?.multiplier) {
			multiplier = meta.multiplier;
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

		const varValueSuffix = meta?.isPercentage ? '%' : (optionalPercent ?? '');

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
				? `%i:meleeactive% | %i:rangedactive% ${tagWrapStart}${(meta?.displayedName ?? variableName)}${tagWrapEnd}${varValueSuffix}${metaSuffix}`
				: `%i:meleeactive% ${tagWrapStart}${
					typeof roundReplaced === 'number'
						? roundVariable(variable[0], roundReplaced)
						: roundReplaced
							? Math.round(variable[0]!)
							: variable[0]}${tagWrapEnd}${varValueSuffix} | %i:rangedactive% ${tagWrapStart}${
					typeof roundReplaced === 'number'
						? roundVariable(variable[1], roundReplaced)
						: roundReplaced
							? Math.round(variable[1]!)
							: variable[1]}${tagWrapEnd}${varValueSuffix}${metaSuffix}`;
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
			let value = dynamicVariables!.values?.[variableName]?.value as number | [number, number] | undefined;
			if (value !== undefined) {
				const isArray = Array.isArray(value);
				let baseValue: number | [number, number];
				if (isArray) {
					value = [(value as number[])[0]!, (value as number[])[1]!];
					value[0] = roundVariable(value[0]);
					value[1] = roundVariable(value[1]);
					baseValue = [value[0], value[1]];
				} else {
					value = roundVariable(value as number);
					baseValue = value;
				}

				if (isArray && variableValueFunctionParams.isRanged !== undefined) {
					value = variableValueFunctionParams.isRanged
						? (value as number[])[1]
						: (value as number[])[0];
				}

				if (meta?.type && modifyVariableFunctions[meta.type]) {
					if (isArray) {
						(value as number[])[0] = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, (value as number[])[0]!));
						(value as number[])[1] = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, (value as number[])[1]!));
					} else {
						(value as number) = roundVariable(modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, value as number));
					}
				}

				variables.set(variableName, { baseValue, value: value as number | [number, number], meta });
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

const CHAMPION_STAT_TO_SCALING_TAG: Partial<Record<IVariableMetaStatIcon, string>> = {
	hp: 'scalehealth',
	armor: 'scalearmor',
	attackDamage: 'scalead',
	abilityPower: 'scaleap',
	lethality: 'scalelethality',
	magicResist: 'scalemr',
	moveSpeed: 'speed',
	mana: 'scalemana',
};

function calculatesFromPartExtendedEquals(
	part: ICalculatesFromPart,
	insertIcon = false,
	preferRangedValue = false,
	prependPlus = false,
): string {
	const tag = part.stat === 'const' || part.stat === 'level' ? 'const' : ((part.stat && CHAMPION_STAT_TO_SCALING_TAG[part.stat]) || '');
	const value = Array.isArray(part.value)
		? part.value[preferRangedValue ? 1 : 0]!
		: part.value;
	const multiplier = part.isPercentage ? 100 : 1;
	const icon = insertIcon && part.stat && part.stat !== 'const' ? STAT_ICON[part.stat] : '';
	const type = part.type === 'baseOnLevel' ? ' base ' : part.type === 'bonus' ? ' bonus ' : '';
	const valueSuffix = part.isPercentage ? '%' : '';
	const formattedValue = typeof value === 'number'
		? `${part.isPercentage ? roundVariable(value * multiplier, 1) : Math.round(value * multiplier)}${valueSuffix}`
		: `${part.isPercentage ? roundVariable(value.min * multiplier, 1) : Math.round(value.min * multiplier)}${valueSuffix} - ${part.isPercentage ? roundVariable(value.max * multiplier, 1) : Math.round(value.max * multiplier)}${valueSuffix}`;

	return `${
		tag ? `<${tag}>` : ''
	}${
		prependPlus ? '+ ' : ''
	}${formattedValue}${type}${
		icon ? `%i:${icon}%` : ''
	}${
		tag ? `</${tag}>` : ''
	}`;
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
				return resolved?.value as number;
			}
			return undefined;
		});

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
		} else if (hasMRangedMultiplier) {
			rv.isMeleeRanged = true;
			const multiplier = resolveMMultiplier(variable.mRangedMultiplier as any, whole, meta);

			if (multiplier === undefined) {
				rv.value = undefined;
			} else if (meta?.isRanged === undefined) {
				rv.isMeleeRanged = true;
				rv.value = [rv.value, rv.value * (multiplier ?? 1)];
			} else if (meta.isRanged) {
				rv.isMeleeRanged = 1;
				rv.value *= multiplier ?? 1;
			} else {
				rv.isMeleeRanged = 0;
			}
		}

		if (variable.mDisplayAsPercent) {
			rv.meta ??= {};
			rv.meta.isPercentage = true;
			rv.meta.multiplier ??= variable.mDisplayAsPercent ? 100 : undefined;
		}

		return rv;
	},
	NumberCalculationPart(variable: IGameVariablesByType['NumberCalculationPart']) {
		return {
			value: variable.mNumber,
			calculatesFrom: [{
				value: variable.mNumber,
				stat: 'const',
			}]
		};
	},
	NamedDataValueCalculationPart(variable: IGameVariablesByType['NamedDataValueCalculationPart'], whole, meta) {
		meta?.accessedVariables?.add(variable.mDataValue);
		return {
			value: whole.dataValues?.[variable.mDataValue],
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
			value: mStartValue + (mEndValue - mStartValue) / 17 * ((meta.variableValueParams.damageSource?.level.value ?? 1) - 1),
		};
	},
	mModifiedGameCalculation(variable: { mModifiedGameCalculation: string; mMultiplier?: any }, whole, meta) {
		if (!variable.mModifiedGameCalculation) {
			return;
		}

		let multiplier = 1;
		if ('mMultiplier' in variable) {
			multiplier = resolveMMultiplier(variable.mMultiplier, whole, meta);
		}
		meta.variableValueParams.accessedVariables ??= new Map();
		const rv = meta.variableValueFn(variable.mModifiedGameCalculation, meta.variableValueParams);

		if (typeof rv.value === 'number') {
			rv.value *= multiplier;
		} else if (Array.isArray(rv.value)) {
			if (rv.value[0]) {
				rv.value[0] *= multiplier;
			}
			if (rv.value[1]) {
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
		const rv: IVariableValueResult = { };
		const values = variable.mSubparts.map((part) => {
			const resolveFn = variableResolveFn(part);
			if (resolveFn) {
				const resolved = resolveFn(part, whole, meta);
				if (resolved?.roundReplaced) {
					rv.roundReplaced = resolved.roundReplaced;
				}
				return resolved?.value as number;
			}
			return undefined;
		});

		if (values.some(v => typeof v !== 'number')) {
			return undefined;
		}

		rv.value = values.reduce((acc, curr) => curr! + acc!, 0)!;

		return rv;
	},
	ProductOfSubPartsCalculationPart(variable: IGameVariablesByType['ProductOfSubPartsCalculationPart'], whole, meta) {
		const rv1 = variableResolveFn(variable.mPart1)?.(variable.mPart1, whole, meta);
		const rv2 = variableResolveFn(variable.mPart2)?.(variable.mPart2, whole, meta);
		if (rv1 && rv2 && typeof rv1.value === 'number' && typeof rv2.value === 'number') {
			/* at the moment used only for redemption, if any meta or more variable rv information is needed/appears for other variables, adjust */
			return {
				value: rv1.value * rv2.value,
			};
		}
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
): number {
	const { mNumber, mDataValue } = variable;
	if (mNumber) {
		return mNumber;
	} else if (mDataValue) {
		meta?.accessedVariables?.add(variable.mDataValue);
		const value = whole.dataValues?.[mDataValue];

		/* expected to happen for champions */
		if (Array.isArray(value)) {
			if (value.length === 2) {
				console.warn('[resolveMMultiplier] suspiciously melee/ranged looking value having abilityLevel applied to it', { mNumber, mDataValue }, variable);
			}
			return value[(meta?.variableValueParams as IChampionAbilityVariableParams).abilityLevel ?? 1];
		}
		return value;
	}
	console.warn('[variables/game resolveMMultiplier] unknown mMultiplier structure', variable);
	return 0;
}
