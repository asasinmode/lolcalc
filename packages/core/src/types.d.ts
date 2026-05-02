/**
 * record containing possible dynamic values for a variable (all values the variable is expected to resolve to)
 * used for stringtable variables like `{{ Spell_ApheliosQ_Tooltip_@f3@ }}`
 */
export type IPossibleDynamicValues = Record<string, (string | number)[]>;
