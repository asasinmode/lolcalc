import type { ICalculatedDynamicVariable } from '../specifics';
import type { IReplaceStringtableVariablesRV } from '../types';

export function replaceStringtableVariables(
	text: string,
	stringtable: Record<string, string> = {},
	/** either resolved dynamic variables or possible values of dynamic variables, see also the interface's itself documentation */
	dynamicVariables: { values?: Record<string, ICalculatedDynamicVariable | number[]> } = {},
	/** whether to wrap unknown variables in `<unknown>` */
	wrapUnknown = true,
	unknownStringtableVariables: Map<string, Set<string>> = new Map(),
	stringtableVariables: Map<string, string> = new Map(),
): IReplaceStringtableVariablesRV {
	const replaced = text.replace(/\{\{ ?(.+?) ?\}\}/g, (_, name) => {
		let variableName = name.toLowerCase();

		const subVariableStartIndex = variableName.indexOf('@');
		if (~subVariableStartIndex) {
			const subVariablePrefix = variableName.slice(0, subVariableStartIndex);
			let subVariableName = variableName.slice(subVariableStartIndex + 1);
			subVariableName = subVariableName.slice(0, subVariableName.indexOf('@'));

			const subVariableValue = dynamicVariables.values
				? subVariableName in dynamicVariables.values
					? dynamicVariables.values[subVariableName]
					: Object.entries(dynamicVariables.values).find(([key]) => key.toLowerCase() === subVariableName)?.[1]
				: undefined;

			if (subVariableValue !== undefined) {
				/** array branch means it's most likely updateGameData and it's being used to get all of the possible values for this variable to save in the champion's stringtable */
				if (Array.isArray(subVariableValue)) {
					for (const possibleSubVariableValue of subVariableValue) {
						const possibleValueVariableName = `${subVariablePrefix}${possibleSubVariableValue}`;
						if (stringtableVariables.has(possibleValueVariableName)) {
							continue;
						}

						const possibleValueText = stringtable[possibleValueVariableName];
						if (!possibleValueText) {
							addUnknownStringtableVariable(unknownStringtableVariables, variableName, possibleValueVariableName);
							continue;
						}

						const { replaced } = replaceStringtableVariables(possibleValueText, stringtable, dynamicVariables, wrapUnknown, unknownStringtableVariables, stringtableVariables);
						stringtableVariables.set(possibleValueVariableName, replaced);

						if (replaced.includes('{{')) {
							replaceStringtableVariables(replaced, stringtable, dynamicVariables, wrapUnknown, unknownStringtableVariables, stringtableVariables);
						}
					}

					return `{{${name}}}`;
					// TODO possibly have to handle array values too
				} else if (typeof subVariableValue.value === 'number') {
					variableName = `${variableName.slice(0, subVariableStartIndex - 1)}_${subVariableValue.value}`;
				}
			}
		}

		const value = stringtable[variableName] ?? stringtableVariables.get(variableName);

		if (value === undefined) {
			addUnknownStringtableVariable(unknownStringtableVariables, name, variableName);
			return wrapUnknown ? `<unknown>{{${name}}}</unknown>` : `{{${name}}}`;
		}

		if (value.includes('{{')) {
			const { replaced } = replaceStringtableVariables(
				value,
				stringtable,
				dynamicVariables,
				wrapUnknown,
				unknownStringtableVariables,
				stringtableVariables,
			);
			stringtableVariables.set(variableName, replaced);
			return replaced;
		}

		stringtableVariables.set(variableName, value);
		return value;
	});

	return { replaced, stringtableVariables, unknownStringtableVariables };
}

function addUnknownStringtableVariable(map: Map<string, Set<string>>, rawName: string, resolvedName: string) {
	const set = map.get(rawName);
	set ? set.add(resolvedName) : map.set(rawName, new Set([resolvedName]));
}
