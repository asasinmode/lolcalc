import { ITEM_STAT_ICON_NAMES } from './item';
import { roundVariable } from './misc';

export interface IGameVariableCalculationTarget {
	isRanged?: boolean;
	stats?: IChampionStats;
}

interface IVariableValueResult {
	/** if not found, `undefined`. Otherwise a `number` if value is the same regardless of range or `[number, number]` for melee and ranged champions respectively */
	value?: number | [number | undefined, number | undefined];
	/** if `true`, the variable is different for melee and ranged champions */
	isMeleeRanged?: boolean;
	/** returns the variable name stripped of any dot path (`AdditionalUltAH.0` -> `AdditionalUltAH`) or `undefined` if same as provided */
	actualVariableName?: string;
}

// TODO maybe `ItemCalculations` could be saved in calculate champion stats, then passed here and results could just be displayed
export function itemVariableValue(variable: string, item: IItem, target?: IGameVariableCalculationTarget): IVariableValueResult {
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

export type IGameVariableType = 'item' | 'rune';

interface IVariableTypeValueFunctions {
	item: typeof itemVariableValue;
	rune: typeof runeVariableValue;
}

export function replaceGameDescriptionVariables<T extends IGameVariableType>(
	text: string,
	variableType: T,
	item: Parameters<IVariableTypeValueFunctions[T]>[1],
	{ target }: Partial<{ target: IGameVariableCalculationTarget }> = {},
): {
	replaced: string;
	variables: Map<string, number | [number, number]>;
	unknownVariables: [rawName: string, actualName: string | undefined][];
} {
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

		let { value: variable, isMeleeRanged, actualVariableName } = (variableType === 'item' ? itemVariableValue : runeVariableValue)(variableName, item as any, target);

		if (Array.isArray(variable) ? variable.some(v => typeof v !== 'number' || Number.isNaN(v)) : (typeof variable !== 'number' || Number.isNaN(variable))) {
			variable = Array.isArray(variable) ? variable.map(v => (typeof v !== 'number' || Number.isNaN(v)) ? undefined : v) as typeof variable : undefined;
		}

		if (variable === undefined) {
			unknownVariables.push([name, actualVariableName]);
			return `<unknown>@${name}@</unknown>`;
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
		return isMeleeRanged ? `%i:${target?.isRanged ? 'ranged' : 'melee'}active% ${variable}` : variable.toString();
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
];
