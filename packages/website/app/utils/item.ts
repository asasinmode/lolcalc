// TODO add item.stringCalculations and item.itemCalculations handling
export function replaceItemDescriptionVariables(text: string, item: IItem): {
	replaced: string;
	variables: Record<string, number>;
	unknownVariables: string[];
} {
	const unknownVariables: string[] = [];
	const variables: Record<string, number> = {};

	const replaced = text.replace(/@([\w*]+)@/g, (_, name) => {
		let variableName = name;
		let multiplier = 1;
		let variable: number | undefined;

		const multiplierIndex = name.indexOf('*');
		if (~multiplierIndex) {
			multiplier = Number.parseInt(name.slice(multiplierIndex + 1));
			variableName = name.slice(0, name.indexOf(multiplierIndex));
		}

		const dataValue = item.dataValues?.[name];
		if (dataValue) {
			variable = Math.round((dataValue * multiplier));
		} else if (variableName.startsWith('Effect')) {
			variable = item.effectAmount?.[Number.parseInt(variableName.slice(6)) - 1];
		}

		if (variable === undefined) {
			unknownVariables.push(name);
			return `<unknown>@${name}@</unknown>`;
		}

		variables[variableName] = variable;
		return variable.toString();
	});

	return { replaced, variables, unknownVariables };
}

/**
 * tags that appear in tooltip shop item hover description
 * they should have appropriate styles (like font color) set in `ItemDescription.vue`
 */
export const KNOWN_TOOLTIP_SHOP_EXTRA_TAGS = ['passive', 'scalemana', 'healing', 'physicaldamage', 'status', 'gold'];

// TODO handle tags
// "physicalDamage",
// "scaleMana",
// "keyword",
// "scaleAP",
// "li",
// "speed",
// "scaleAD",
// "magicDamage",
// "shield",
// "rarityLegendary",
// "attackSpeed",
// "scaleArmor",
// "scaleHealth",
// "OnHit",
// "attention",
// "scaleMR",
// "lifeSteal",
// "rules",
// "keywordMajor",
// "rarityGeneric",
// "keywordStealth",
// "trueDamage",
// "omnivamp",
// "slow",
// "scaleLethality"
