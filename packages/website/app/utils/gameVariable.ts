import { STAT_ICON } from './meta.ts';
import { roundVariable } from './misc.ts';

export interface IItemVariableCalculationTarget {
	isRanged?: boolean;
	stats?: IChampionStats;
}

type IWithDynamic<T> = T & {
	dynamicValues?: number | number[];
};

interface IVariableValueResult {
	/** if not found, `undefined`. Otherwise a `number` if value is the same regardless of range or `[number, number]` for melee and ranged champions respectively */
	value?: string | number | [number | undefined, number | undefined];
	/** if `true`, the variable is different for melee and ranged champions */
	isMeleeRanged?: boolean;
	/** returns the variable name stripped of any dot path (`AdditionalUltAH.0` -> `AdditionalUltAH`) or `undefined` if same as provided */
	actualVariableName?: string;
	/** all values the variable lists, like champion Q levels 0-6 */
	allValues?: number[];
}

// TODO maybe `ItemCalculations` could be saved in calculate champion stats, then passed here and results could just be displayed
export function itemVariableValue(variable: string, item: IItem, target?: IItemVariableCalculationTarget): IVariableValueResult {
	let value: IVariableValueResult['value'];
	let isMeleeRanged: IVariableValueResult['isMeleeRanged'];

	if (item.stats?.[variable as IItemStat] !== undefined) {
		value = item.stats[variable as IItemStat];
	} else if (item.dataValues?.[variable] !== undefined) {
		value = item.dataValues[variable];
	} else if (item.stringCalculations?.[variable]) {
		isMeleeRanged = true;
		if (target?.isRanged === undefined) {
			value = [
				itemVariableValue(
					item.stringCalculations[variable].MeleeResult.slice(1, -1),
					item,
					Object.assign(target ? structuredClone(target) : {}, { isRanged: false }),
				).value as number | undefined,
				itemVariableValue(
					item.stringCalculations[variable].RangedResult.slice(1, -1),
					item,
					Object.assign(target ? structuredClone(target) : {}, { isRanged: true }),
				).value as number | undefined,
			];
		} else {
			const key: keyof NonNullable<IItem['stringCalculations']>[string] = target.isRanged ? 'RangedResult' : 'MeleeResult';
			value = itemVariableValue(item.stringCalculations[variable][key].slice(1, -1), item, target).value;
		}
	} else if (item.itemCalculations?.[variable]) {
		// TODO
		// const result = ITEM_SPECIFICS[item.id]?.[variable]?.(target);
		// value = result;
	} else if (variable.startsWith('Effect')) {
		value = item.effectAmount?.[Number.parseInt(variable.slice(6)) - 1];
	}

	return { value, isMeleeRanged };
}

export function runeVariableValue(variable: string, rune: IWithDynamic<IRune>): IVariableValueResult {
	let value: IVariableValueResult['value'];
	let actualVariableName: IVariableValueResult['actualVariableName'];

	const [variableName, ...dotPath] = variable.split('.');

	if (dotPath.length) {
		actualVariableName = variableName;
	}

	/* expected to be an array only in `updateGameData` for debug logs */
	if (Array.isArray((rune as any).dynamicValues?.[variableName!])) {
		return { value: '__DYNAMIC VALUE__', actualVariableName };
	}

	const sources = [(rune as any).calculations, (rune as any).effectAmount, (rune as any).dynamicValues];
	for (const source of sources) {
		if (!source) {
			continue;
		}

		value = source[variableName!];
		if (value !== undefined) {
			for (const path in dotPath) {
				// TODO figure this out, some paths seem to have .0 or .-1
				const number = Number(path);
				if (Number.isNaN(number) || (number >= 0 && Array.isArray(value))) {
					value = (value as any)[path];
				}
			}
		}
		if (value !== undefined) {
			break;
		}
	}

	return { value, actualVariableName };
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
	abilityLevel = 1,
	allAbilitiesVariants: IChampionAbilityVariableVariant[] = [],
): IVariableValueResult {
	let value: IVariableValueResult['value'];
	let actualVariableName: IVariableValueResult['actualVariableName'];
	let allValues: IVariableValueResult['allValues'];

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
			return championAbilityVariableValue(variantVariableName!, otherAbilityVariant, abilityLevel, allAbilitiesVariants);
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
		actualVariableName = variableName;
	}

	if (variableName!.startsWith('Effect') && variableName!.endsWith('Amount')) {
		const index = Number(variableName!.slice(6, -6));
		if ('effectAmount' in abilityVariant) {
			if (Number.isNaN(index)) {
				console.warn('potential effectAmount variable index NaN', variableName);
			} else {
				value = abilityVariant.effectAmount[index - 1];
			}
		}
	}

	if (value === undefined) {
		for (const source of sources) {
			if (!source) {
				continue;
			}

			value = source.find(source => source[0] === variableName || source[0].toLowerCase() === variableName!.toLowerCase())?.[1];
			if (value !== undefined) {
				for (const path in dotPath) {
				// TODO figure this out, some paths seem to have .0 or .-1
					const number = Number(path);
					if (Number.isNaN(number) || (number >= 0 && Array.isArray(value))) {
						value = (value as any)[path];
					}
				}
			}
			if (value !== undefined) {
				break;
			}
		}
	}

	if (Array.isArray(value)) {
		allValues = value as number[];
		value = value[abilityLevel];
	}

	return { value, actualVariableName, allValues };
}

export type IGameVariableType = 'item' | 'rune' | 'championAbility';

type ParametersExceptFirst<T extends (...args: any) => any> = T extends (first: any, ...rest: infer R) => any ? R : never;

export interface IGameVariableValueParameters {
	item: ParametersExceptFirst<typeof itemVariableValue>;
	rune: ParametersExceptFirst<typeof runeVariableValue>;
	championAbility: ParametersExceptFirst<typeof championAbilityVariableValue>;
};

export interface IReplaceGameDescriptionVariablesRV {
	replaced: string;
	variables: Map<string, number | [number, number]>;
	/** all found variables' listed values, expected on champion variables like values for Q level 0-6 */
	variablesAllValues: Map<string, (string | number)[]>;
	unknownVariables: [rawName: string, actualName: string | undefined][];
}

interface IOptions {
	replaceWithName: boolean;
}

export function replaceGameDescriptionVariables(text: string, variableType: 'item', variableValueFunctionArguments: ParametersExceptFirst<typeof itemVariableValue>, options?: Partial<IOptions>): IReplaceGameDescriptionVariablesRV;
export function replaceGameDescriptionVariables(text: string, variableType: 'rune', variableValueFunctionArguments: ParametersExceptFirst<typeof runeVariableValue>, options?: Partial<IOptions>): IReplaceGameDescriptionVariablesRV;
export function replaceGameDescriptionVariables(text: string, variableType: 'championAbility', variableValueFunctionArguments: ParametersExceptFirst<typeof championAbilityVariableValue>, options?: Partial<IOptions>): IReplaceGameDescriptionVariablesRV;
export function replaceGameDescriptionVariables(
	text: string,
	variableType: IGameVariableType,
	variableValueFunctionArguments: any[],
	options: Partial<IOptions> = {},
): IReplaceGameDescriptionVariablesRV {
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

		let { value: variable, isMeleeRanged, actualVariableName, allValues } = (variableType === 'item'
			? itemVariableValue
			: variableType === 'championAbility'
				? championAbilityVariableValue
				// @ts-expect-error spread is fine
				: runeVariableValue)(variableName, ...variableValueFunctionArguments);

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
			return `${tagWrapStart}<unknown>@${options.replaceWithName ? variableName : name}@</unknown>${tagWrapEnd}`;
		}

		if (typeof variable === 'string') {
			return `${tagWrapStart}${options.replaceWithName ? variableName : variable}${tagWrapEnd}`;
		}

		if (Array.isArray(variable)) {
			if (variable[0] === undefined || variable[1] === undefined) {
				unknownVariables.push([name, actualVariableName]);
				return `${tagWrapStart}<unknown>@${options.replaceWithName ? variableName : name}@</unknown>${tagWrapEnd}`;
			}

			variable[0] = roundVariable(variable[0] * multiplier);
			variable[1] = roundVariable(variable[1] * multiplier);
			variables.set(variableName, variable as [number, number]);

			return `%i:meleeactive%${tagWrapStart}${options.replaceWithName ? variableName : variable[0]}${tagWrapEnd} | %i:rangedactive%${tagWrapStart}${options.replaceWithName ? variableName : variable[1]}${tagWrapEnd}`;
		}

		variable = roundVariable(variable * multiplier);
		variables.set(variableName, variable);

		const meleeRangedIconPath = variableType === 'item' && (variableValueFunctionArguments as Parameters<typeof itemVariableValue>)[2]?.isRanged
			? 'ranged'
			: 'melee';

		return isMeleeRanged
			? `%i:${meleeRangedIconPath}active% ${tagWrapStart}${options.replaceWithName ? variableName : variable}${tagWrapEnd}`
			: `${tagWrapStart}${options.replaceWithName ? variableName : variable.toString()}${tagWrapEnd}`;
	});

	return { replaced, variables, unknownVariables, variablesAllValues };
}

const statIconNameValues = Object.values(STAT_ICON);

export function replaceGameDescriptionIcons(minorVersion: string, text: string, onHitIcon?: string) {
	return text
		.replace(/%i:(\w+)%/g, (_, name: string) => {
			name = name.toLocaleLowerCase();
			return `<img src="https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/${statIconNameValues.includes(name) ? 'statsicon' : 'gameplay'}/${name}.png" width="20" height="20" aria-hidden="true">`;
		})
		.replace(/\{\{ ?Item_Keyword_OnHit ?\}\}/g, `${onHitIcon || '{{ Item_Keyword_OnHit }}'} <onhit>On-Hit</onhit>`);
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
