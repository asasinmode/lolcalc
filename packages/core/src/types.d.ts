/**
 * record containing possible dynamic values for a variable (all values the variable is expected to resolve to)
 * used for stringtable variables like `{{ Spell_ApheliosQ_Tooltip_@f3@ }}`
 */
export type IPossibleDynamicValues = Record<string, (string | number)[]>;

export interface IReplaceGameDescriptionVariablesRV {
	replaced: string;
	variables: Map<string, number | [number, number]>;
	/** all found variables' listed values, expected on champion variables like values for Q level 0-6 */
	variablesAllValues: Map<string, (string | number)[]>;
	unknownVariables: [rawName: string, actualName: string | undefined][];
}
