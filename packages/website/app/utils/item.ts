import { ITEM_STAT_ICON_NAMES } from '../composables/useUi';

interface IVariableValueResult {
	/** if not found, `undefined`. Otherwise a `number` if value is the same regardless of range or `[number, number]` for melee and ranged champions respectively */
	value: number | [number | undefined, number | undefined] | undefined;
	isMeleeRanged?: boolean;
}

export function itemDescriptionVariableValue(variable: string, item: IItem, isRanged?: boolean): IVariableValueResult {
	let value: IVariableValueResult['value'];
	let isMeleeRanged: IVariableValueResult['isMeleeRanged'];

	if (item.stats[variable as IItemStat] !== undefined) {
		value = item.stats[variable as IItemStat];
	} else if (item.dataValues?.[variable] !== undefined) {
		value = item.dataValues[variable];
	} else if (item.stringCalculations?.[variable]) {
		isMeleeRanged = true;
		if (isRanged === undefined) {
			value = [
				itemDescriptionVariableValue(item.stringCalculations[variable].MeleeResult.slice(1, -1), item, false).value as number | undefined,
				itemDescriptionVariableValue(item.stringCalculations[variable].RangedResult.slice(1, -1), item, true).value as number | undefined,
			];
		} else {
			const key: keyof NonNullable<IItem['stringCalculations']>[string] = isRanged ? 'RangedResult' : 'MeleeResult';
			value = itemDescriptionVariableValue(item.stringCalculations[variable][key].slice(1, -1), item, isRanged).value;
		}
	} else if (variable.startsWith('Effect')) {
		value = item.effectAmount?.[Number.parseInt(variable.slice(6)) - 1];
	}

	return { value, isMeleeRanged };
}

export function replaceItemDescriptionVariables(text: string, item: IItem, isRanged?: boolean): {
	replaced: string;
	variables: Map<string, number | [number, number]>;
	unknownVariables: string[];
} {
	const unknownVariables: string[] = [];
	const variables = new Map<string, number | [number, number]>();

	const replaced = text.replace(/@([\w*]+)@/g, (_, name) => {
		let variableName = name;
		let multiplier = 1;

		const multiplierIndex = name.indexOf('*');
		if (~multiplierIndex) {
			multiplier = Number.parseInt(name.slice(multiplierIndex + 1));
			variableName = name.slice(0, name.indexOf(multiplierIndex) - 1);
		}

		let { value: variable, isMeleeRanged } = itemDescriptionVariableValue(variableName, item, isRanged);

		if (variable === undefined) {
			unknownVariables.push(name);
			return `<unknown>@${name}@</unknown>`;
		}

		if (Array.isArray(variable)) {
			if (variable[0] === undefined || variable[1] === undefined) {
				unknownVariables.push(name);
				return `<unknown>@${name}@</unknown>`;
			}

			variable[0] = Math.round(variable[0] * multiplier);
			variable[1] = Math.round(variable[1] * multiplier);
			variables.set(variableName, variable as [number, number]);

			return `%i:meleeactive%${variable[0]} | %i:rangedactive%${variable[1]}`;
		}

		variable = Math.round(variable * multiplier);
		variables.set(variableName, variable);
		return isMeleeRanged ? `%i:${isRanged ? 'ranged' : 'melee'}active% ${variable}` : variable.toString();
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
