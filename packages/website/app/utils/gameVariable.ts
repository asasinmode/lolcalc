import { ITEM_STAT_ICON_NAMES } from './item';
import { roundVariable } from './misc';

export interface IItemVariableCalculationTarget {
	isRanged?: boolean;
	stats?: IChampionStats;
}

interface IVariableValueResult {
	/** if not found, `undefined`. Otherwise a `number` if value is the same regardless of range or `[number, number]` for melee and ranged champions respectively */
	value?: string | number | [number | undefined, number | undefined];
	/** if `true`, the variable is different for melee and ranged champions */
	isMeleeRanged?: boolean;
	/** returns the variable name stripped of any dot path (`AdditionalUltAH.0` -> `AdditionalUltAH`) or `undefined` if same as provided */
	actualVariableName?: string;
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
		const result = ITEM_CALCULATIONS[item.id]?.[variable]?.(target);
		value = result;
	} else if (variable.startsWith('Effect')) {
		value = item.effectAmount?.[Number.parseInt(variable.slice(6)) - 1];
	}

	return { value, isMeleeRanged };
}

export function runeVariableValue(variable: string, rune: IRune): IVariableValueResult {
	let value: IVariableValueResult['value'];
	let actualVariableName: IVariableValueResult['actualVariableName'];

	const [variableName, ...dotPath] = variable.split('.');
	const sources = ['calculations' in rune && rune.calculations, 'effectAmount' in rune && rune.effectAmount];

	if (dotPath.length) {
		actualVariableName = variableName;
	}

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

export function championAbilityVariableValue(
	variable: string,
	abilityVariant: IChampionAbilityVariant,
	abilityLevel = 1,
	allAbilitiesVariants: IChampionAbility['variants'] = [],
): IVariableValueResult {
	let value: IVariableValueResult['value'];
	let actualVariableName: IVariableValueResult['actualVariableName'];

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
		value = value[abilityLevel];
	}

	return { value, actualVariableName };
}

export type IGameVariableType = 'item' | 'rune' | 'championAbility';

type ParametersExceptFirst<T extends (...args: any) => any> = T extends (first: any, ...rest: infer R) => any ? R : never;

export interface IGameVariableValueParameters {
	item: ParametersExceptFirst<typeof itemVariableValue>;
	rune: ParametersExceptFirst<typeof runeVariableValue>;
	championAbility: ParametersExceptFirst<typeof championAbilityVariableValue>;
};

interface IReplaceGameDescriptionVariablesRV {
	replaced: string;
	variables: Map<string, number | [number, number]>;
	unknownVariables: [rawName: string, actualName: string | undefined][];
}

export function replaceGameDescriptionVariables(text: string, variableType: 'item', variableValueFunctionArguments: ParametersExceptFirst<typeof itemVariableValue>): IReplaceGameDescriptionVariablesRV;
export function replaceGameDescriptionVariables(text: string, variableType: 'rune', variableValueFunctionArguments: ParametersExceptFirst<typeof runeVariableValue>): IReplaceGameDescriptionVariablesRV;
export function replaceGameDescriptionVariables(text: string, variableType: 'championAbility', variableValueFunctionArguments: ParametersExceptFirst<typeof championAbilityVariableValue>): IReplaceGameDescriptionVariablesRV;
export function replaceGameDescriptionVariables(
	text: string,
	variableType: IGameVariableType,
	variableValueFunctionArguments: any[],
): IReplaceGameDescriptionVariablesRV {
	const unknownVariables: [string, string | undefined][] = [];
	const variables = new Map<string, number | [number, number]>();

	const replaced = text.replace(/@(.+?)@/g, (_, name) => {
		let variableName = name;
		let multiplier = 1;

		const multiplierIndex = name.indexOf('*');
		if (~multiplierIndex) {
			multiplier = Number.parseFloat(name.slice(multiplierIndex + 1));
			variableName = name.slice(0, multiplierIndex);
		}

		let { value: variable, isMeleeRanged, actualVariableName } = (variableType === 'item'
			? itemVariableValue
			: variableType === 'championAbility'
				? championAbilityVariableValue
				// @ts-expect-error spread is fine
				: runeVariableValue)(variableName, ...variableValueFunctionArguments);

		if (typeof variable !== 'string' && (
			Array.isArray(variable)
				? variable.some(v => typeof v !== 'number' || Number.isNaN(v))
				: (typeof variable !== 'number' || Number.isNaN(variable)))
		) {
			variable = Array.isArray(variable)
				? variable.map(v => (typeof v !== 'number' || Number.isNaN(v)) ? undefined : v) as typeof variable
				: undefined;
		}

		if (variable === undefined) {
			unknownVariables.push([name, actualVariableName]);
			return `<unknown>@${name}@</unknown>`;
		}

		if (typeof variable === 'string') {
			return variable;
		}

		if (Array.isArray(variable)) {
			if (variable[0] === undefined || variable[1] === undefined) {
				unknownVariables.push([name, actualVariableName]);
				return `<unknown>@${name}@</unknown>`;
			}

			variable[0] = roundVariable(variable[0] * multiplier);
			variable[1] = roundVariable(variable[1] * multiplier);
			variables.set(variableName, variable as [number, number]);

			return `%i:meleeactive%${variable[0]} | %i:rangedactive%${variable[1]}`;
		}

		variable = roundVariable(variable * multiplier);
		variables.set(variableName, variable);

		const meleeRangedIconPath = variableType === 'item' && (variableValueFunctionArguments as Parameters<typeof itemVariableValue>)[2]?.isRanged
			? 'ranged'
			: 'melee';

		return isMeleeRanged
			? `%i:${meleeRangedIconPath}active% ${variable}`
			: variable.toString();
	});

	return { replaced, variables, unknownVariables };
}

const STAT_ICON_NAMES = Object.values(ITEM_STAT_ICON_NAMES);

export function replaceGameDescriptionIcons(text: string) {
	return text.replace(/%i:(\w+)%/g, (_, name: string) => {
		name = name.toLocaleLowerCase();
		return `<img src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/${STAT_ICON_NAMES.includes(name) ? 'statsicon' : 'gameplay'}/${name}.png" width="20" height="20" aria-hidden="true">`;
	});
}
