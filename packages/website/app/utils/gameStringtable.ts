export function replaceGameDescriptionStringtableVariables(
	text: string,
	stringtable: Record<string, string>,
	/** either resolved dynamic variables or possible values of dynamic variables */
	dynamicValues: Record<string, unknown> = {},
	wrapUnknown = true,
	unknownStringtableVariables: [string, string | undefined][] = [],
	stringtableVariables = new Map<string, string>(),
): {
	replaced: string;
	stringtableVariables: Map<string, string>;
	unknownStringtableVariables: [rawName: string, actualName: string | undefined][];
} {
	const replaced = text.replace(/\{\{ ?(.+?) ?\}\}/g, (_, name) => {
		let variableName = name.toLowerCase();

		const subVariableStartIndex = variableName.indexOf('@');
		if (~subVariableStartIndex) {
			const subVariablePrefix = variableName.slice(0, subVariableStartIndex);
			const subVariableName = variableName.slice(subVariableStartIndex + 1, -1);

			const subVariableValue = subVariableName in dynamicValues ? dynamicValues[subVariableName] : Object.entries(dynamicValues).find(([key]) => key.toLowerCase() === subVariableName)?.[1];

			if (subVariableValue !== undefined) {
				if (Array.isArray(subVariableValue)) {
					for (const possibleSubVariableValue of subVariableValue) {
						const possibleValueVariableName = `${subVariablePrefix}${possibleSubVariableValue}`;
						if (stringtableVariables.has(possibleValueVariableName)) {
							continue;
						}

						const possibleValueText = stringtable[possibleValueVariableName];
						if (!possibleValueText) {
							console.warn(`possible dynamic value stringtable key ${possibleValueVariableName} not found in the stringtable`);
							continue;
						}

						const { replaced } = replaceGameDescriptionStringtableVariables(possibleValueText, stringtable, dynamicValues, wrapUnknown, unknownStringtableVariables, stringtableVariables);
						stringtableVariables.set(possibleValueVariableName, replaced);
					}

					return name;
				} else {
					variableName = `${variableName.slice(0, subVariableStartIndex - 1)}_${subVariableValue}`;
				}
			}
		}

		const value = stringtable[variableName] ?? stringtableVariables.get(variableName);

		if (value === undefined) {
			unknownStringtableVariables.push([name, variableName]);
			return wrapUnknown ? `<unknown>{{${name}}}</unknown>` : `{{${name}}}`;
		}

		if (value.includes('{{')) {
			const { replaced } = replaceGameDescriptionStringtableVariables(
				value,
				stringtable,
				dynamicValues,
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
