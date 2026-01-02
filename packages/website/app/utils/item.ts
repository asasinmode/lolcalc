import { ITEM_STAT_ICON_NAMES } from '../composables/useUi';

// TODO add item.stringCalculations and item.itemCalculations handling
export function itemDescriptionVariableValue(variable: string, item: IItem): number | undefined {
	if (item.stats[variable as IItemStat] !== undefined) {
		return item.stats[variable as IItemStat];
	}

	if (item.dataValues?.[variable] !== undefined) {
		return item.dataValues[variable];
	}

	if (variable.startsWith('Effect')) {
		return item.effectAmount?.[Number.parseInt(variable.slice(6)) - 1];
	}

	return undefined;
}
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

		const multiplierIndex = name.indexOf('*');
		if (~multiplierIndex) {
			multiplier = Number.parseInt(name.slice(multiplierIndex + 1));
			variableName = name.slice(0, name.indexOf(multiplierIndex));
		}

		let variable = itemDescriptionVariableValue(variableName, item);

		if (variable === undefined) {
			unknownVariables.push(name);
			return `<unknown>@${name}@</unknown>`;
		}

		variable = Math.round(variable * multiplier);
		variables[variableName] = variable;
		return variable.toString();
	});

	return { replaced, variables, unknownVariables };
}

const STAT_ICON_NAMES = Object.values(ITEM_STAT_ICON_NAMES);

export function replaceItemDescriptionIcons(text: string) {
	return text.replace(/%i:(\w+)%/g, (_, name: string) => {
		name = name.toLocaleLowerCase();
		return `<img src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/${STAT_ICON_NAMES.includes(name) ? 'statsicon' : 'gameplay'}/${name}.png" width="20" height="20" aria-hidden="true">`;
	});
}

/**
 * tags that appear in tooltip shop item hover description
 * they should have appropriate styles (like font color) set in `ItemDescription.vue`
 */
export const KNOWN_TOOLTIP_SHOP_EXTRA_TAGS = [
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
	'slow',	// voltaic cyclosword, seems to be same color as text
];
