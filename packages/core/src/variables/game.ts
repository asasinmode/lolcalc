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

export function itemVariableValue(
	variable: string,
	item: IItem,
	dynamicVariables: IDynamicVariables = {},
	isRanged?: boolean,
	damageSource?: DamageSource,
): IVariableValueResult {
	const rv: IVariableValueResult = {
		isUninteresting: dynamicVariables.uninteresting?.includes(variable),
	};

	if (dynamicVariables.meta?.[variable]) {
		rv.meta = dynamicVariables.meta[variable];
	}

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
				itemVariableValue(
					item.stringCalculations[variable].MeleeResult.slice(1, -1),
					item,
					dynamicVariables,
					false,
					damageSource,
				).value as number | undefined,
				itemVariableValue(
					item.stringCalculations[variable].RangedResult.slice(1, -1),
					item,
					dynamicVariables,
					true,
					damageSource,
				).value as number | undefined,
			];
		} else {
			const key: keyof NonNullable<IItem['stringCalculations']>[string] = isRanged ? 'RangedResult' : 'MeleeResult';
			rv.value = itemVariableValue(item.stringCalculations[variable][key].slice(1, -1), item, dynamicVariables, isRanged, damageSource).value;
		}
	} else if (variable.startsWith('Effect')) {
		rv.value = item.effectAmount?.[Number.parseInt(variable.slice(6)) - 1];
	}

	return rv;
}

export function runeVariableValue(variable: string, rune: IRune, dynamicVariables: IDynamicVariables = {}): IVariableValueResult {
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

// TODO make sure it handles hextech soul description
export function championAbilityVariableValue(
	variable: string,
	abilityVariant: IChampionAbilityVariableVariant,
	dynamicVariables: IDynamicVariables = {},
	abilityLevel = 1,
	allAbilitiesVariants: IChampionAbilityVariableVariant[] = [],
): IVariableValueResult {
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
			return championAbilityVariableValue(variantVariableName!, otherAbilityVariant, dynamicVariables, abilityLevel, allAbilitiesVariants);
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

type ParametersExceptFirst<T extends (...args: any) => any> = T extends (first: any, ...rest: infer R) => any ? R : never;

export interface IGameVariableValueParameters {
	item: ParametersExceptFirst<typeof itemVariableValue>;
	rune: ParametersExceptFirst<typeof runeVariableValue>;
	championAbility: ParametersExceptFirst<typeof championAbilityVariableValue>;
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

export function replaceGameVariables(text: string, variableType: 'item', variableValueFunctionArguments: ParametersExceptFirst<typeof itemVariableValue>, modifyVariableFunctions?: IModifyVariableFunctions, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(text: string, variableType: 'rune', variableValueFunctionArguments: ParametersExceptFirst<typeof runeVariableValue>, modifyVariableFunctions?: IModifyVariableFunctions, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(text: string, variableType: 'championAbility', variableValueFunctionArguments: ParametersExceptFirst<typeof championAbilityVariableValue>, modifyVariableFunctions?: IModifyVariableFunctions, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(
	text: string,
	variableType: IGameVariableType,
	variableValueFunctionArguments: any[],
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
				// @ts-expect-error spread is fine
				: runeVariableValue)(variableName, ...(options.overrideVariables
			? variableValueFunctionArguments.slice(0, 1).concat(options.overrideVariables, variableValueFunctionArguments.slice(2))
			: variableValueFunctionArguments));

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
		const extendedEquals = typeof meta?.extendedEquals !== 'object' || isMeleeRanged === undefined
			? meta?.extendedEquals
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

	const dynamicVariables = (options.overrideVariables ?? variableValueFunctionArguments[1]) as IDynamicVariables | undefined;
	const additionalVariables = dynamicVariables?.meta && Object.entries(dynamicVariables.meta).filter(([, value]) => value?.isAdditional);
	if (additionalVariables?.length) {
		for (const [variableName, meta] of additionalVariables) {
			let value = dynamicVariables!.values?.[variableName]?.value as number | [number, number] | undefined;
			if (value !== undefined) {
				if (meta?.type && modifyVariableFunctions[meta.type]) {
					value = Array.isArray(value)
						? [
								modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, value[0]),
								modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, value[1]),
							]
						: modifyVariableFunctions[meta.type]!.reduce((acc, modify) => modify(acc) as number, value);
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
	mFormulaParts(self, variable: { mFormulaParts: (IGameVariablesByType[keyof IGameVariablesByType])[] }) {
		const values = variable.mFormulaParts.map(part => variableResolveFn(part)?.(self, part));
		if (values.includes(undefined)) {
			return undefined;
		}
		return values.reduce((acc, curr) => curr! + acc!, 0);
	},
	ByCharLevelBreakpointsCalculationPart(self, variable: IGameVariablesByType['ByCharLevelBreakpointsCalculationPart']) {
		let rv = variable.mLevel1Value;
		for (const { mAdditionalBonusAtThisLevel, mLevel } of variable.mBreakpoints) {
			if (self.level.value >= mLevel) {
				rv += mAdditionalBonusAtThisLevel;
			} else {
				break;
			}
		}
		return rv;
	},
} satisfies IHypotheticalVariableCalculationFns;

export type IHypotheticalVariableCalculationFns = Record<string, (self: DamageSource, variable: any) => number | undefined>;

interface IGameVariablesByType {
	ByCharLevelBreakpointsCalculationPart: {
		mLevel1Value: number;
		mBreakpoints: {
			mLevel: number;
			mAdditionalBonusAtThisLevel: number;
		}[];
		__type: string;
	};
}

function variableResolveFn(variable: any): IHypotheticalVariableCalculationFns[keyof IHypotheticalVariableCalculationFns] | undefined {
	if ('__type' in variable && variable.__type in VARIABLE_CALCULATION_FNS) {
		return VARIABLE_CALCULATION_FNS[variable.__type as keyof typeof VARIABLE_CALCULATION_FNS];
	}
	console.warn('[variableResolveFn] unknown variable', variable);
	return undefined;
}
