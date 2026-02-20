export function replaceGameDescriptionStringtableVariables(
	text: string,
	stringtable: Record<string, string> = {},
	/** either resolved dynamic variables or possible values of dynamic variables */
	dynamicValues: Record<string, unknown> = {},
	wrapUnknown = true,
	unknownStringtableVariables = new Map<string, Set<string>>(),
	stringtableVariables = new Map<string, string>(),
): {
	replaced: string;
	stringtableVariables: Map<string, string>;
	unknownStringtableVariables: Map<string, Set<string>>;
} {
	const replaced = text.replace(/\{\{ ?(.+?) ?\}\}/g, (_, name) => {
		let variableName = name.toLowerCase();

		const subVariableStartIndex = variableName.indexOf('@');
		if (~subVariableStartIndex) {
			const subVariablePrefix = variableName.slice(0, subVariableStartIndex);
			const subVariableName = variableName.slice(subVariableStartIndex + 1, -1);

			const subVariableValue = subVariableName in dynamicValues ? dynamicValues[subVariableName] : Object.entries(dynamicValues).find(([key]) => key.toLowerCase() === subVariableName)?.[1];

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

						const { replaced } = replaceGameDescriptionStringtableVariables(possibleValueText, stringtable, dynamicValues, wrapUnknown, unknownStringtableVariables, stringtableVariables);
						stringtableVariables.set(possibleValueVariableName, replaced);

						if (replaced.includes('{{')) {
							replaceGameDescriptionStringtableVariables(replaced, stringtable, dynamicValues, wrapUnknown, unknownStringtableVariables, stringtableVariables);
						}
					}

					return `{{${name}}}`;
				} else {
					variableName = `${variableName.slice(0, subVariableStartIndex - 1)}_${subVariableValue}`;
				}
			}
		}

		const value = stringtable[variableName] ?? stringtableVariables.get(variableName);

		if (value === undefined) {
			addUnknownStringtableVariable(unknownStringtableVariables, name, variableName);
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

function addUnknownStringtableVariable(map: Map<string, Set<string>>, rawName: string, resolvedName: string) {
	const set = map.get(rawName);
	set ? set.add(resolvedName) : map.set(rawName, new Set([resolvedName]));
}

/**
 * tags that appear in game descriptions, like item shop hover tooltip or champ select rune hover
 * they should have appropriate styles (like font color) set in `ItemDescription.vue`
 */
export const KNOWN_GAME_DESCRIPTION_TAGS = [
	'passive',	// heading
	'scalead', // bloodmail, sterak
	'scaleap',	// rabadon, riftmaker
	'scalehealth', // roa, heartsteel
	'scalemana',	// manamune, archangel
	'scalearmor',	// hullbreaker, terminus
	'scalemr',	// malignance, force of nature
	'scalelethality',	// opportunity
	'attackspeed',	// yuntal, experimental hexplate
	'onhit',	// iceborn, statik
	'physicaldamage',	// heartsteel, titanic
	'magicdamage',	// bami, thornmail
	'truedamage',	// cosmic drive, shadowflame
	'health',	// protoplasm harness, no styles
	'healing',	// guardian angel, warmog
	'shield',	// fimbulwinter, hexdrinker
	'lifesteal', // maw of malmortius
	'omnivamp',	// riftmaker
	'speed',	// opportunity, slightly magical footwear
	'gold',	// world atlas, collector
	'status',	// botrk, iceborn
	'attention',	// statikk, knight's vow
	'raritygeneric',	// world atlas
	'raritylegendary',	// archangel, manamune
	'rules',	// crimson lucidity
	'keyword',	// phantom dancer, zeke's convergence
	'keywordmajor',	// terminus
	'keywordstealth',	// horizon focus
	'slow',	// voltaic cyclosword, no styles
	'active', // seeker's armguard, mercurial scimitar
	'lol-uikit-tooltipped-keyword', // in many runes
	'scalelevel', // long first strike, guardian, shield bash
	'statgood', // long precision legends
	'font',
	'b',
	'i',
	'hr',
	'li',
	'titleleft', // dragon stack descriptions
	'maintext', // dragon stack descriptions
];
