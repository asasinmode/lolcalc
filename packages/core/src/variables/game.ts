import type { IChampionAbilityVariant, IItem, IItemStat, IRune } from '@lolcalc/data/types';
import type { DamageSource } from '../DamageSource.ts';
import type { ICalculatedDynamicVariable, IDynamicVariableMeta } from '../specifics/index';
import type { IReplaceGameVariablesRV } from '../types';
import { ICON_ON_HIT_IMG, PATCH_VERSION } from '@lolcalc/data';
import { STAT_ICON } from '@lolcalc/data/meta.ts';
import { roundVariable } from '@lolcalc/shared/utils.ts';

interface IVariableValueResult {
	/** if not found, `undefined`. Otherwise a `number` if value is the same regardless of range or `[number, number]` for melee and ranged champions respectively */
	value?: ICalculatedDynamicVariable['value'];
	/** if `true`, the variable is different for melee and ranged champions */
	isMeleeRanged?: boolean;
	/** returns the variable name stripped of any dot path (`AdditionalUltAH.0` -> `AdditionalUltAH`) or `undefined` if same as provided */
	actualVariableName?: string;
	/** all values the variable lists, like champion Q levels 0-6 */
	allValues?: number[];
	meta?: IDynamicVariableMeta & {
		/** if `true`, will round the formatted variable. Used for all dynamic variables atm */
		round?: boolean;
	};
}

/**
 * `dynamicVariables` can be either
 * - `IDynamicVariablesProvider['POSSIBLE_DYNAMIC_VARIABLES']` when variables are resolved in `updateData` script or a description is created without a `DamageSource` and it needs known/unknown variables to be valid. See `replaceGameVariables`' `options.overrideDynamicVariables`
 *     In `updateData` script these are used only for supressing warning for unknown variables that are actually calculated by `dynamicVariables`
 * - the return value of `IDynamicVariablesProvider['dynamicVariables']` when actually calculating and using the values
 */
export interface IDynamicVariables {
	[key: string]: ICalculatedDynamicVariable | (string | number)[];
}

function resolveDynamicVariable(value: IDynamicVariables[string]): IVariableValueResult {
	return Array.isArray(value) ? { value: value[0] ?? 0 } : value;
}

export function itemVariableValue(
	variable: string,
	item: IItem,
	dynamicVariables: IDynamicVariables = {},
	isRanged?: boolean,
	damageSource?: DamageSource,
): IVariableValueResult {
	let rv: IVariableValueResult = {};

	if (dynamicVariables[variable] !== undefined) {
		rv = resolveDynamicVariable(dynamicVariables[variable]);
		rv.meta ??= {};
		rv.meta.round = true;
	} else if (item.stats?.[variable as IItemStat] !== undefined) {
		rv.value = item.stats[variable as IItemStat];
	} else if (item.dataValues?.[variable] !== undefined) {
		rv.value = item.dataValues[variable];
	} else if (item.stringCalculations?.[variable]) {
		rv.isMeleeRanged = true;
		if (damageSource?.isRanged.value === undefined) {
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
			const key: keyof NonNullable<IItem['stringCalculations']>[string] = damageSource.isRanged.value ? 'RangedResult' : 'MeleeResult';
			rv.value = itemVariableValue(item.stringCalculations[variable][key].slice(1, -1), item, dynamicVariables, isRanged, damageSource).value;
		}
	} else if (item.itemCalculations?.[variable]) {
		// TODO
		// const result = ITEM_SPECIFICS[item.id]?.[variable]?.(target);
		// value = result;
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

	/* atm only shard stats' dynamic variables are properly resolved and this suffices, when doing major runes probably needs to be sophisticated */
	if (dynamicVariables[variable]) {
		rv.value = resolveDynamicVariable(dynamicVariables[variable]).value;
		rv.meta ??= {};
		rv.meta.round = true;
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
	/* some variables names' cases don't match so keep them in form of key/value and try all lowercase key if exact case not found */
	// TODO maybe can just always do lowercase variables
	const sources: (false | [string, any][])[] = [
		abilityVariant.spellCalculations && Object.entries(abilityVariant.spellCalculations),
		abilityVariant.dataValues && Object.entries(abilityVariant.dataValues),
		abilityVariant.effectAmount && Object.entries(abilityVariant.effectAmount),
	];

	if (dotPath.length) {
		rv.actualVariableName = variableName;
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
	 * dynamicVariables to use instead of the ones passed in the `variableValueFunctionArguments`
	 * used by results table since it gets the item/ability variables from creating the ability's description without any `DamageSource`, which normally provides its `computed.dynamicVariables`
	 */
	overrideDynamicVariables?: IDynamicVariables;
	/** whether to show some additional info about the variable, usually expected when holding shift */
	isExtended?: boolean;
}

export function replaceGameVariables(text: string, variableType: 'item', variableValueFunctionArguments: ParametersExceptFirst<typeof itemVariableValue>, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(text: string, variableType: 'rune', variableValueFunctionArguments: ParametersExceptFirst<typeof runeVariableValue>, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(text: string, variableType: 'championAbility', variableValueFunctionArguments: ParametersExceptFirst<typeof championAbilityVariableValue>, options?: IReplaceGameVariablesOptions): IReplaceGameVariablesRV;
export function replaceGameVariables(
	text: string,
	variableType: IGameVariableType,
	variableValueFunctionArguments: any[],
	options: Partial<IReplaceGameVariablesOptions> = {},
): IReplaceGameVariablesRV {
	let anyExtendedVariables = false;
	const unknownVariables: [string, string | undefined][] = [];
	const variables = new Map<string, number | [number, number]>();
	const variablesAllValues = new Map<string, (string | number)[]>();

	const tagWrapStart = options.replaceWithName ? '<var>' : '';
	const tagWrapEnd = options.replaceWithName ? '</var>' : '';

	const replaced = text.replace(/@(.+?)@/g, (_, name) => {
		let variableName = name;
		let multiplier = 1;

		const multiplierIndex = name.indexOf('*');
		if (~multiplierIndex) {
			multiplier = Number.parseFloat(name.slice(multiplierIndex + 1));
			variableName = name.slice(0, multiplierIndex);
		}

		let { value: variable, isMeleeRanged, actualVariableName, allValues, meta } = (variableType === 'item'
			? itemVariableValue
			: variableType === 'championAbility'
				? championAbilityVariableValue
				// @ts-expect-error spread is fine
				: runeVariableValue)(variableName, ...(options.overrideDynamicVariables
			? variableValueFunctionArguments.slice(0, 1).concat(options.overrideDynamicVariables, variableValueFunctionArguments.slice(2))
			: variableValueFunctionArguments));

		/*
		 * if meta's present, the variable was most likely gotten from dynamicVariables which store their values cached on `DamageSource`
		 * later on, the variable is multiplied by the multiplier in place, so if this was the original variable, every time `replaceGameVariables` was called the underlying dynamic variable would be modified
		 */
		if (meta && Array.isArray(variable)) {
			variable = [...variable];
		}

		let metaSuffix = '';
		if (meta?.statIconKey) {
			(meta?.extendedEquals && options.isExtended)
				? metaSuffix = ` = (${meta.extendedEquals}%i:${STAT_ICON[meta.statIconKey]}%)`
				: metaSuffix = ` (%i:${STAT_ICON[meta.statIconKey]}%)`;
		} else if (meta?.extendedEquals && options.isExtended) {
			metaSuffix = ` = (${meta.extendedEquals})`;
		}
		anyExtendedVariables ||= Boolean(meta?.extendedEquals);
		if (meta?.multiplier) {
			multiplier = meta.multiplier;
		}

		const varSymbolSuffix = meta?.isPercentage ? '%' : '';

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

		if (variable === undefined) {
			unknownVariables.push([name, actualVariableName]);
			return `${tagWrapStart}<unknown>@${options.replaceWithName ? variableName : name}@</unknown>${tagWrapEnd}${metaSuffix}`;
		}

		if (typeof variable === 'string') {
			return `${tagWrapStart}${options.replaceWithName ? variableName : variable}${tagWrapEnd}${metaSuffix}`;
		}

		if (Array.isArray(variable)) {
			if (variable[0] === undefined || variable[1] === undefined) {
				unknownVariables.push([name, actualVariableName]);
				return `${tagWrapStart}<unknown>@${options.replaceWithName ? variableName : name}@</unknown>${tagWrapEnd}`;
			}

			variable[0] = roundVariable(variable[0] * multiplier);
			variable[1] = roundVariable(variable[1] * multiplier);
			variables.set(variableName, variable as [number, number]);

			return `%i:meleeactive%${tagWrapStart}${
				options.replaceWithName ? variableName : (meta?.round ? Math.round(variable[0]) : variable[0])}${varSymbolSuffix}${tagWrapEnd} | %i:rangedactive%${tagWrapStart}${
				options.replaceWithName ? variableName : meta?.round ? Math.round(variable[1]) : variable[1]}${varSymbolSuffix}${tagWrapEnd}${metaSuffix}`;
		}

		variable = roundVariable(variable * multiplier);
		variables.set(variableName, variable);

		const meleeRangedIconPath = variableType === 'item' && (variableValueFunctionArguments as Parameters<typeof itemVariableValue>)[2]
			? 'ranged'
			: 'melee';

		return isMeleeRanged
			? `%i:${meleeRangedIconPath}active% ${tagWrapStart}${options.replaceWithName ? variableName : (meta?.round ? Math.round(variable) : variable)}${varSymbolSuffix}${tagWrapEnd}`
			: `${tagWrapStart}${
				options.replaceWithName ? variableName : (meta?.round ? Math.round(variable) : variable)
			}${varSymbolSuffix}${tagWrapEnd}${metaSuffix}`;
	});

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
