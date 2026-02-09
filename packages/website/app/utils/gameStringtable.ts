export function replaceGameDescriptionStringtableVariables(
	text: string,
	stringtable: Record<string, string>,
): {
	replaced: string;
	stringtableVariables: Map<string, string>;
	unknownStringtableVariables: [rawName: string, actualName: string | undefined][];
} {
	const unknownStringtableVariables: [string, string | undefined][] = [];
	const stringtableVariables = new Map<string, string>();

	const replaced = text.replace(/\{\{ ?(.+?) ?\}\}/g, (_, name) => {
		const variableName = name.toLowerCase();
		const variable = stringtable[variableName];

		if (variable === undefined) {
			// TODO resolve actual name, forgot what this todo means :c
			unknownStringtableVariables.push([name, variableName]);
			return `<unknown>{{${name}}}</unknown>`;
		}

		stringtableVariables.set(variableName, variable);
		return variable;
	});

	return { replaced, stringtableVariables, unknownStringtableVariables };
}
