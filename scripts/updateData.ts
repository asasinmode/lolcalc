import type { ISpecificVariables } from '@lolcalc/core/specifics';
import type { IChampionAbilitySpecific, IChampionAbilityVariantSpecific, IChampionSpecific, IHypotheticalChampionSpecifics } from '@lolcalc/core/specifics/champion.ts';
import type { IHypotheticalDragonSpecifics } from '@lolcalc/core/specifics/dragon';
import type { IHypotheticalItemSpecifics } from '@lolcalc/core/specifics/item';
import type { IHypotheticalMiscSpecifics } from '@lolcalc/core/specifics/misc.ts';
import type { IHypotheticalRuneSpecifics } from '@lolcalc/core/specifics/rune';
import type { IDynamicVariables, IGameVariableType, IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type { IEffectData, ITEMS } from '@lolcalc/data';
import type { IItemShopStatFilter } from '@lolcalc/data/meta';
import type { IChampion, IChampionAbility, IChampionAbilityVariant, IChampionId, IDragonName, IItem, IListedChampion, IRuneShardSlotValue } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IEffectObjectName, IItemCategory } from '@lolcalc/shared';
import type { IChampionRole, ITexture } from '@lolcalc/shared/types';
import buffer from 'node:buffer';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion.ts';
import { DRAGON_SPECIFICS } from '@lolcalc/core/specifics/dragon.ts';
import { CUSTOM_EFFECTS, EFFECT_SPECIFICS, EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect.ts';
import { ITEM_SPECIFICS } from '@lolcalc/core/specifics/item.ts';
import { MISC_SPECIFICS } from '@lolcalc/core/specifics/misc.ts';
import { RUNE_SPECIFICS } from '@lolcalc/core/specifics/rune.ts';
import { replaceGameVariables } from '@lolcalc/core/variables/game.ts';
import { replaceStringtableVariables } from '@lolcalc/core/variables/stringtable.ts';
import { ABILITY_VARIANT_BOT_DATA_EFFECT_TAG_CC_FLAGS, ABILITY_VARIANT_BOT_DATA_EFFECT_TAG_DISPLACEMENT_FLAGS, ABILITY_VARIANT_IMMOBILIZING_SPELL_TAGS, ITEM_STAT_META, SHAPESHIFTING_CHAMPION_IDS } from '@lolcalc/data/meta.ts';
import { AbilityType, ITEM_NAME_TO_ID, KEPT_UNPURCHASABLE_ITEMS, TEAR_ITEM_TRANSFORMATIONS, TRANSFORMED_TEAR_ITEM_IDS } from '@lolcalc/shared';
import { KNOWN_GAME_DESCRIPTION_TAGS } from '@lolcalc/website';
import { xxh3 } from '@node-rs/xxhash';
import fnv1a from '@sindresorhus/fnv1a';
import { imageSize } from 'image-size';

let latestVersion = process.argv[2];

if (!latestVersion) {
	const versions: string[] = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(res => res.json());
	([latestVersion] = versions as [string]);
	console.log('latest version', latestVersion);
} else {
	console.log('using version override', latestVersion);
}

const minorVersion = latestVersion.slice(0, latestVersion.lastIndexOf('.'));

let stringtable: Record<string, string>;
let rcpFeLolCollectionsCss: string;
const cacheHits: Record<string, any> = {};

interface IDebugCategory {
	variables: Map<string, string[]>;
	/**
	 * parent map key is the ability in which unknown stringtable variables were found, like `Kalista passive[0] KalistaPassiveBuff tooltip`>
	 * parent map value is a map of raw stringtable variables, like `spell_kalistap_tooltip_@gamemodeinteger@`
	 * then that submap's value is the set with all resolved stringtable variables that weren't found, like `spell_kalistap_tooltip_1`
	 */
	stringtableVariables: Map<string, Map<string, Set<string>>>;
	tags: [string[], Set<string>];
}

const debug = {
	item: { variables: new Map(), stringtableVariables: new Map(), tags: [[], new Set()] } as IDebugCategory,
	rune: { variables: new Map(), stringtableVariables: new Map(), tags: [[], new Set()] } as IDebugCategory,
	champion: { variables: new Map(), stringtableVariables: new Map(), tags: [[], new Set()] } as IDebugCategory,
	effect: { variables: new Map(), stringtableVariables: new Map(), tags: [[], new Set()] } as IDebugCategory,
	misc: { variables: new Map(), stringtableVariables: new Map(), tags: [[], new Set()] } as IDebugCategory,
};

const textFilePath = path.join(import.meta.dirname, '../packages/data/files/text.json');
let textData = {
	version: latestVersion,
	data: {} as any,
} as typeof import('../packages/data/files/text.json');

try {
	await fs.access(textFilePath);
	textData = JSON.parse(await fs.readFile(textFilePath, 'utf8'));
	textData.data.stringtable ??= {} as any;
	textData.version ??= latestVersion;
} catch {}

const championFilePath = path.join(import.meta.dirname, '../packages/data/files/champion.json');
let championData: typeof import('../packages/data/files/champion.json') | undefined;

try {
	await fs.access(championFilePath);
	championData = JSON.parse(await fs.readFile(championFilePath, 'utf8'));
} catch {}

const potentialShapeshifters = new Set<string>();

if (!championData || championData?.version !== latestVersion) {
	console.log('champion data not present or outdated, fetching...');

	await loadStringTable();
	const { version, data } = await fetchCached(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`, 'ddragon/champion.json');

	const TargetDummy: IChampion = {
		id: 'TargetDummy',
		key: '-1',
		name: 'Target Dummy',
		partype: 'Mana',
		stats: {
			hp: 1000,
			hpperlevel: 0,
			mp: 500,
			mpperlevel: 0,
			movespeed: 0,
			armor: 0,
			armorperlevel: 0,
			spellblock: 0,
			spellblockperlevel: 0,
			attackrange: 0,
			hpregen: 0,
			hpregenperlevel: 0,
			mpregen: 0,
			mpregenperlevel: 0,
			crit: 0,
			critperlevel: 0,
			attackdamage: 0,
			attackdamageperlevel: 0,
			attackspeedperlevel: 0,
			attackspeed: 0,
			attackspeedratio: 0,
		},
		abilities: {
			q: {
				maxLevel: 1,
				variants: [
					{
						name: 'Target Dummy Q',
						objectName: 'TargetDummyQ',
						dataKey: 'TargetDummy/Q',
						image: 'assets/characters/ha_%s1minionmelee/hud/%s2melee_square.png',
						tooltip: 'Does nothing',
						cooldownTime: [1, 1, 1, 1, 1, 1, 1],
					},
				],
			},
			w: {
				maxLevel: 1,
				variants: [
					{
						name: 'Target Dummy W',
						objectName: 'TargetDummyW',
						dataKey: 'TargetDummy/W',
						image: 'assets/characters/ha_%s1minionranged/hud/%s2range_square.png',
						tooltip: 'Does nothing',
						cooldownTime: [1, 1, 1, 1, 1, 1, 1],
					},
				],
			},
			e: {
				maxLevel: 1,
				variants: [
					{
						name: 'Target Dummy E',
						objectName: 'TargetDummyE',
						dataKey: 'TargetDummy/E',
						image: 'assets/characters/ha_%s1minionsiege/hud/%s2mechcannon_square.png',
						tooltip: 'Does nothing',
						cooldownTime: [1, 1, 1, 1, 1, 1, 1],
					},
				],
			},
			r: {
				maxLevel: 1,
				variants: [
					{
						name: 'Target Dummy R',
						objectName: 'TargetDummyR',
						dataKey: 'TargetDummy/R',
						image: 'assets/characters/ha_%s1minionsuper/hud/%s2mechmelee_square.png',
						tooltip: 'Does nothing',
						cooldownTime: [1, 1, 1, 1, 1, 1, 1],
					},
				],
			},
			passive: {
				maxLevel: 0,
				variants: [
					{
						name: 'Target Dummy Passive',
						objectName: 'TargetDummyPassive',
						dataKey: 'TargetDummy/Passive',
						image: 'assets/characters/nexus/hud/nexus_%s2_square.png',
						tooltip: 'Does nothing',
					},
				],
			},
		},
		stringtable: {},
	};

	championData = {
		version,
		data: Object.assign({
			[TargetDummy.id]: {
				id: TargetDummy.id,
				key: TargetDummy.key,
				name: TargetDummy.name,
				image: 'assets/maps/particles/tft/item_icons/consumables/tft_item_consumable_dummy.png',
				roles: { top: true, jungle: true, mid: true, bot: true, support: true },
			} satisfies IListedChampion,
		}, Object.fromEntries(
			await Promise.all((Object.entries(data) as [IChampionId, (IChampion & { image: string })][])
				.filter(([championId]) => !championId.startsWith('Jade_'))
				.sort(([, champA], [, champB]) => champA.name.localeCompare(champB.name))
				.map(async ([championId, championData]) => {
					const { id, key, name, image, partype, stats } = championData;

					const additionalData = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin.json`, `game/data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin.json`);

					const characterRootKey = `Characters/${id === 'Fiddlesticks' ? 'FiddleSticks' : id}/CharacterRecords/Root`;
					const rootData = additionalData[characterRootKey];
					if (!rootData) {
						console.log(Object.keys(additionalData));
						throw new Error(`no root character data for ${name}`);
					}

					const { attackSpeedRatioModifiable, damagePerLevelModifiable } = rootData;

					stats.attackspeedratio = formatNumber(attackSpeedRatioModifiable.baseValue);
					/* between patches `16.4` and `16.9` attackdamage in `champion.json` from ddragon was set to 0 on some champions, so take the one from additionalData until it hopefully comes back? */
					if (damagePerLevelModifiable) {
						stats.attackdamageperlevel = formatNumber(damagePerLevelModifiable.baseValue);
					}

					const dedicatedChampionFilePath = path.join(import.meta.dirname, `../packages/data/files/champion/${id}.json`);
					const championFileDataStringtable: IChampion['stringtable'] = {};

					const dedicatedChampionFileData: IChampion = {
						id,
						key,
						name,
						partype,
						stats,
						abilities: Object.fromEntries((['q', 'w', 'e', 'r', 'passive'] satisfies IChampionAbilityKey[]).map((abilityKey, index) => {
							const { maxLevel, variants } = championAbilityData(
								[abilityKey, index],
								championId as IChampionId,
								additionalData,
								characterRootKey,
							);

							if (variants.length > 1) {
								potentialShapeshifters.add(championId);
							}

							return [abilityKey, {
								maxLevel,
								variants,
							} satisfies IChampionAbility];
						})) as IChampion['abilities'],
						stringtable: championFileDataStringtable,
					};

					if (championId === 'Aphelios') {
						Object.assign(championFileDataStringtable, adjustApheliosAbilityData(additionalData, characterRootKey, dedicatedChampionFileData.abilities));
					}

					setChampionAbilityVariantsText(dedicatedChampionFileData);

					await fs.writeFile(dedicatedChampionFilePath, stringifyObject(dedicatedChampionFileData));

					return [championId, {
						id,
						key,
						name,
						image: (image as unknown as { full: string }).full,
						roles: {},
					}];
				}),
			),
		)) as NonNullable<typeof championData>['data'],
	};

	const roleScript = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champion-statistics/global/default/rcp-fe-lol-champion-statistics.js`, 'plugins/rcp-fe-lol-champion-statistics/global/default/rcp-fe-lol-champion-statistics.js', 'text');
	const roleScriptData: Record<'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'SUPPORT', Record<string, number>> = JSON.parse(roleScript.match(/JSON\.parse\('([^']+)'/)?.[1] || '{}');

	const allChampions = Object.values(championData!.data);

	for (const [role, playrates] of Object.entries(roleScriptData)) {
		for (const championKey of Object.keys(playrates)) {
			const champion = allChampions.find(champion => champion.key === championKey);
			(champion!.roles as Record<string, boolean>)[role === 'MIDDLE' ? 'mid' : role === 'BOTTOM' ? 'bot' : role.toLowerCase()] = true;
		}
	}

	await fs.writeFile(path.join(import.meta.dirname, `../packages/data/files/champion/${TargetDummy.id}.json`), stringifyObject(TargetDummy));

	await fs.writeFile(championFilePath, stringifyObject(championData));
	await fs.writeFile(textFilePath, stringifyObject(textData));
}

const itemFilePath = path.join(import.meta.dirname, '../packages/data/files/item.json');
let itemData: typeof import('../packages/data/files/item.json') | undefined;

try {
	await fs.access(itemFilePath);
	itemData = JSON.parse(await fs.readFile(itemFilePath, 'utf8'));
} catch {}

if (!itemData || itemData?.version !== latestVersion || !textData.data.items) {
	console.log('item data not present or outdated, fetching...');

	await loadStringTable();
	const { version, data } = await fetchCached(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`, 'ddragon/item.json');

	const UNINTERESTING_ITEMS = [
		'3340',	// stealth ward
		'3363',	// farsight alteration
		'3364',	// oracle lens
		'2003',	// health potion
		'2055',	// control ward
		'2031',	// refillable potion
		'2141',	// cappa juice
		'1101',	// scorchclaw pup
		'1102',	// gustwalker hatchling
		'1103',	// mosstomper seedling
		'1105',	// mosstomper seedling
		'1106',	// gustwalker hatchling
		'1107',	// scorchclaw pup
		'2138',	// elixir of iron
		'2139',	// elixir of sorcery
		'2140',	// elixir of wrath
		'6032',	// stat bonus
		'2421', // shattered armguard
		'3039',	// atma's reckoning
		'3095', // stormrazor, there are 2 for some reason
		'2051', // guardian's horn
		'3112', // guardian's orb
		'3177', // guardian's blade
		'3184', // guardian's hammer
	];

	const filteredItems = Object.entries(data)
		.filter(([itemId, itemData]) => {
			const { maps: { 11: sr }, requiredChampion, gold } = itemData as {
				maps: Record<number, boolean>;
				requiredChampion?: boolean;
				gold: { purchasable: boolean; inStore?: boolean; hideFromAll?: boolean };
			};

			return !UNINTERESTING_ITEMS.includes(itemId)
				&& sr
				&& itemId.length <= 4
				&& gold.inStore !== false
				&& gold.hideFromAll !== false
				&& !requiredChampion
				&& (gold.purchasable || (KEPT_UNPURCHASABLE_ITEMS as string[]).includes(itemId));
		});

	const filteredItemIds = filteredItems.map(([itemId]) => itemId);

	itemData = {
		version,
		data: Object.fromEntries(
			filteredItems.map(([itemId, itemData]) => {
				const { name, stats, gold, image, into: rawInto, from: rawFrom, tags } = itemData as any;

				const searchTerms = Array.from(
					new Set(`${name};${(stringtable[`generatedtip_item_${itemId}_colloquialism`] || ';')
					};${tags.join(';').replace('NonbootsMovement', 'movement').replace('SpellBlock', 'magic resist').replace('Lane', '')
					};${Object.keys(stats).map(stat => ITEM_STAT_META[stat as keyof typeof ITEM_STAT_META]!.name).join(';')
					}`
						.toLocaleLowerCase()
						.replaceAll(/[^a-z;]/g, '')
						.split(';')
						.filter(Boolean)),
				);

				const into = rawInto?.filter((id: string) => filteredItemIds.includes(id));
				const from = rawFrom?.filter((id: string) => filteredItemIds.includes(id));

				return [itemId, {
					id: itemId,
					name,
					searchString: searchTerms.join(';'),
					epicness: undefined,
					gold: {
						total: gold.total,
						sell: gold.sell,
					},
					image: image.full,
					into: into?.length ? into : undefined,
					from: from?.length ? from : undefined,
					...(tags.includes('Boots') ? { isBoots: true } : undefined),
					...(tags.includes('OnHit') ? { isOnHit: true } : undefined),
					itemGroups: undefined,
					categories: undefined,
					stats,
					dataValues: undefined,
					itemCalculations: undefined,
					stringCalculations: undefined,
					effectAmount: undefined,
				}];
			}),
		) as unknown as NonNullable<typeof itemData>['data'],
	};

	const moreItemData = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/items.cdtb.bin.json`, 'game/items.cdtb.bin.json');

	const SPECIAL_EPICNESS_ITEMS: Record<string, number> = {
		[ITEM_NAME_TO_ID.celestialOpposition]: 7,
		[ITEM_NAME_TO_ID.dreamMaker]: 7,
		[ITEM_NAME_TO_ID.zazZakRealmspike]: 7,
		[ITEM_NAME_TO_ID.solsticeSleigh]: 7,
		[ITEM_NAME_TO_ID.bloodsong]: 7,
	};

	textData.data.items = {} as any;

	for (const [itemId, item] of Object.entries(itemData.data as unknown as Record<string, IItem>)) {
		const itemMoreData = moreItemData[`Items/${itemId}`];

		if (!itemMoreData) {
			console.warn(`haven't found more data for ${item.name} (${itemId})`);
			continue;
		}

		if (SPECIAL_EPICNESS_ITEMS[itemId]) {
			item.epicness = SPECIAL_EPICNESS_ITEMS[itemId];
		} else if (itemMoreData.epicness) {
			item.epicness = itemMoreData.epicness;
		}

		item.dataValues = itemMoreData.mDataValues?.length
			? Object.fromEntries(itemMoreData.mDataValues.map(({ mName, mValue }: Record<string, number>) =>
					[mName, mValue !== undefined ? formatNumber(mValue) : undefined],
				))
			: undefined;
		item.itemCalculations = cleanupObject(itemMoreData.mItemCalculations);
		item.stringCalculations = cleanupObject(itemMoreData.StringCalculations);
		item.gold.sellBackModifier = itemMoreData.sellBackModifier && formatNumber(itemMoreData.sellBackModifier);
		item.effectAmount = itemMoreData.mEffectAmount?.some((amount: number) => amount !== 0) ? itemMoreData.mEffectAmount?.map((amount: number) => formatNumber(amount)) : undefined;

		/* remove unused ChampRange, it's resolved more or less manually in `util/gameVariable.ts`, with some more info in this file's `updateItemShopItemTooltipText` */
		if (item.itemCalculations?.ChampRange) {
			const { mDefaultGameCalculation, mConditionalGameCalculation } = item.itemCalculations.ChampRange;

			if (mDefaultGameCalculation && mConditionalGameCalculation) {
				(item.itemCalculations as any)[mDefaultGameCalculation] = undefined;
				(item.itemCalculations as any)[mConditionalGameCalculation] = undefined;
				(item.itemCalculations as any).ChampRange = undefined;
			}
		}

		const itemGroups = itemMoreData.mItemGroups.filter((group: string) => {
			if (group === 'Items/ItemGroups/Default') {
				return false;
			}
			const groupObject = moreItemData[group];
			if (!groupObject) {
				console.error('[itemData item groups] no group object', { id: item.id, name: item.name, group });
			}
			if ('mMaxGroupOwnable' in groupObject) {
				if (groupObject.mMaxGroupOwnable !== 1) {
					console.warn('[itemData item groups] detected a group with mMaxGroupOwnable not 1', { id: item.id, name: item.name, group }, groupObject);
				}
				return true;
			}
			return false;
		});
		if (itemGroups.length) {
			item.itemGroups = itemGroups;
			if (itemGroups.includes('Items/ItemGroups/Boots')) {
				item.isBoots = true;
			};
		}

		for (const value of itemMoreData.mDataValues || []) {
			if (Object.keys(value).some(key => !['mName', 'mValue', '__type'].includes(key))) {
				console.log('unknown key in', itemId, itemMoreData.mDataValues);
			}
		}

		const statsToAdd: ([string, string, true] | [string, string])[] = [
			['AbilityHasteMod', 'mAbilityHasteMod'],
			['FlatCritDamageMod', 'mFlatCritDamageMod', true],
			['FlatMagicPenetrationMod', 'mFlatMagicPenetrationMod'],
			['PercentArmorPenetrationMod', 'mPercentArmorPenetrationMod', true],
			['PercentBaseHPRegenMod', 'mPercentBaseHPRegenMod'],
			['PercentBaseMPRegenMod', 'percentBaseMPRegenMod'],
			['PercentHealingAmountMod', 'mPercentHealingAmountMod', true],
			['PercentMagicPenetrationMod', 'mPercentMagicPenetrationMod', true],
			['PercentOmnivampMod', 'PercentOmnivampMod', true],
			['PercentTenacityMod', 'mPercentTenacityItemMod', true],
			['PhysicalLethality', 'PhysicalLethality'],
		];

		const stats = item.stats as Record<string, number>;

		for (const [statKey, key] of statsToAdd) {
			if (itemMoreData[key]) {
				stats[statKey] = formatNumber(itemMoreData[key]);
			}
		}

		updateItemShopItemTooltipText(item, itemMoreData.mItemDataClient);

		const SPECIAL_CATEGORY_ITEMS: Record<string, IItemCategory[]> = {
			[ITEM_NAME_TO_ID.celestialOpposition]: ['support'],
			[ITEM_NAME_TO_ID.dreamMaker]: ['support'],
			[ITEM_NAME_TO_ID.zazZakRealmspike]: ['support'],
			[ITEM_NAME_TO_ID.solsticeSleigh]: ['support'],
			[ITEM_NAME_TO_ID.bloodsong]: ['support'],
		};

		if (SPECIAL_CATEGORY_ITEMS[itemId]) {
			item.categories = SPECIAL_CATEGORY_ITEMS[itemId].reduce((acc, curr) => ({
				...acc,
				[curr]: true,
			}), {});
			continue;
		}

		const KNOWN_CATEGORYLESS_ITEMS: string[] = [
			ITEM_NAME_TO_ID.swiftmarch,
			ITEM_NAME_TO_ID.crimsonLucidity,
			ITEM_NAME_TO_ID.gunmetalGreaves,
			ITEM_NAME_TO_ID.chainlacedCrushers,
			ITEM_NAME_TO_ID.armoredAdvance,
			ITEM_NAME_TO_ID.spellslingersShoes,
			ITEM_NAME_TO_ID.foreverForward,
			ITEM_NAME_TO_ID.gluttonousGreaves,
			ITEM_NAME_TO_ID.immortalPath,
		];

		if (!itemMoreData.mItemAttributes) {
			if (!KNOWN_CATEGORYLESS_ITEMS.includes(itemId)) {
				console.warn(`haven't found category data for ${item.name} (${itemId})`);
			}
			continue;
		}

		const CATEGORY_NUMBER_TO_NAME: Record<number, IItemCategory> = {
			1: 'fighter',
			2: 'marksman',
			4: 'assassin',
			8: 'tank',
			16: 'mage',
			32: 'support',
		} as const;

		item.categories = (itemMoreData.mItemAttributes as number[])
			.reduce((acc, categoryNumber) => ({
				...acc,
				[CATEGORY_NUMBER_TO_NAME[categoryNumber]!]: true,
			}), {} as Partial<Record<IItemCategory, boolean>>);
	}

	/* manually set some from/into observed in game */
	itemData.data[ITEM_NAME_TO_ID.worldAtlas].into = [ITEM_NAME_TO_ID.runicCompass];
	itemData.data[ITEM_NAME_TO_ID.runicCompass].from = [ITEM_NAME_TO_ID.worldAtlas];
	itemData.data[ITEM_NAME_TO_ID.runicCompass].into = [ITEM_NAME_TO_ID.bountyOfWorlds];
	itemData.data[ITEM_NAME_TO_ID.bountyOfWorlds].from = [ITEM_NAME_TO_ID.runicCompass];
	for (const itemId of [ITEM_NAME_TO_ID.celestialOpposition, ITEM_NAME_TO_ID.dreamMaker, ITEM_NAME_TO_ID.zazZakRealmspike, ITEM_NAME_TO_ID.solsticeSleigh, ITEM_NAME_TO_ID.bloodsong]) {
		(itemData.data[itemId] as IItem).from = undefined;
	}

	for (const [item, transformation] of Object.entries(TEAR_ITEM_TRANSFORMATIONS)) {
		(itemData.data as typeof ITEMS)[item]![(TRANSFORMED_TEAR_ITEM_IDS as string[]).includes(item) ? 'from' : 'into']! = [transformation];
	}

	await fs.writeFile(itemFilePath, stringifyObject(itemData));
	await fs.writeFile(textFilePath, stringifyObject(textData));
}

const runeFilePath = path.join(import.meta.dirname, '../packages/data/files/rune.json');
let runeData: typeof import('../packages/data/files/rune.json') | undefined;

try {
	await fs.access(runeFilePath);
	runeData = JSON.parse(await fs.readFile(runeFilePath, 'utf8'));
} catch {}

if (!runeData || runeData?.version !== latestVersion || !textData.data.runes) {
	console.log('rune data not present or outdated, fetching...');

	await loadStringTable();
	await loadRcpFeLolCollectionsCss();
	const data = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/perks.cdtb.bin.json`, 'game/perks.cdtb.bin.json');

	textData.data.runes = {
		paths: {},
		slots: {},
		shards: {
			slotNames: {},
			slotValues: {},
		},
	} as any;

	const pathStyleCssStartIndex = rcpFeLolCollectionsCss!.indexOf('.primary-perk-selector.keystone.');
	let pathStyleCssSlice = '';
	if (~pathStyleCssStartIndex) {
		pathStyleCssSlice = rcpFeLolCollectionsCss!.slice(pathStyleCssStartIndex, pathStyleCssStartIndex + 350);
	} else {
		console.warn('rune path colors css slice start index not found');
	}

	runeData = {
		version: latestVersion,
		data: {
			paths: Object.fromEntries(['Precision', 'Domination', 'Sorcery', 'Resolve', 'Inspiration'].map((path) => {
				const dataKey = `Perks/Styles/${path}`;
				const { mPerkStyleId, mPerkStyleName, mTooltipNameLocalizationKey, mDisplayNameLocalizationKey, mSlots, mIconTextureName } = data[dataKey];

				const cssSliceSelector = `.primary-perk-selector.keystone.${mPerkStyleName.toLowerCase()}`;
				/** these selectors are expected to contain `{--middle-color:#dc4747}` hence the slice values */
				const iconColorSliceStartIndex = pathStyleCssSlice.indexOf(cssSliceSelector) + cssSliceSelector.length + 16;
				const iconColor = pathStyleCssSlice.slice(iconColorSliceStartIndex, iconColorSliceStartIndex + 7);

				(textData.data.runes.paths as any)[path] = {
					name: getStringtableValue(mDisplayNameLocalizationKey, 'rune paths'),
					tooltip: getStringtableValue(mTooltipNameLocalizationKey, 'rune paths'),
				};

				return [path, {
					id: mPerkStyleId,
					name: mPerkStyleName,
					icon: mIconTextureName.toLowerCase().replace('.tex', '.png'),
					dataKey,
					iconColor,
					slots: mSlots.map(({ mPerks }: { mPerks: string[] }) => Object.fromEntries(
						mPerks.map(perk => createRuneSlotData(perk, data[perk])),
					)),
				}];
			})),
			shards: Object.fromEntries(['OffensiveStats', 'FlexStats', 'DefensiveStats'].map((slotKey) => {
				const { mPerks, mSlotLabelKey } = data[`Perks/StatMods/Slots/${slotKey}`];
				slotKey = slotKey.slice(0, -5).toLowerCase();

				(textData.data.runes.shards.slotNames as any)[slotKey] = {
					name: getStringtableValue(mSlotLabelKey, `rune shards ${slotKey} name`),
				};

				return [slotKey, Object.fromEntries(mPerks.map((perkKey: string) => {
					const { mPerkId, mPerkName, mDisplayNameLocalizationKey, mShortDescLocalizationKey, mTooltipNameLocalizationKey, mIconTextureName, mScript } = data[perkKey];

					const slotValue = {
						id: mPerkId,
						icon: mIconTextureName.toLowerCase().replace('.tex', '.png'),
						dataKey: perkKey,
						effectAmount: cleanupObject(mScript.mSpellScriptData.mEffectAmount, true),
					} as any;

					const perkName: string = mPerkName.toLowerCase();

					(textData.data.runes.shards.slotValues as any)[perkName] = {
						name: getStringtableValue(mDisplayNameLocalizationKey, `rune shards ${slotKey} ${perkKey} name`),
						tooltip: getStringtableValue(mShortDescLocalizationKey, { category: 'rune', key: `rune shards ${slotKey} ${perkKey} tooltip`, variables: { variableType: 'rune', variableValueParameters: { rune: slotValue }, variableSourceKeys: ['effectAmount'] } }),
						tooltipStats: getStringtableValue(mTooltipNameLocalizationKey, {
							category: 'rune',
							key: `rune shards ${slotKey} ${perkKey} tooltip stats`,
							variables: {
								variableType: 'rune',
								variableValueParameters: {
									rune: slotValue,
									dynamicVariables: (RUNE_SPECIFICS as IHypotheticalRuneSpecifics).shards[perkName as IRuneShardSlotValue]!.variables,
								},
								variableSourceKeys: ['effectAmount'],
							},
						}),
					};

					return [mPerkName.toLowerCase(), slotValue];
				}))];
			})),
		} as unknown as NonNullable<(typeof runeData)>['data'],
	};

	await fs.writeFile(runeFilePath, stringifyObject(runeData));
	await fs.writeFile(textFilePath, stringifyObject(textData));
}

const DRAGONS: ([name: IDragonName] | [name: IDragonName, spellDataKey: string])[] = [
	['Cloud'],
	['Mountain'],
	['Infernal'],
	['Ocean'],
	['Chemtech', 'ChemTech'],
	['Hextech'],
];
const miscFilePath = path.join(import.meta.dirname, '../packages/data/files/misc.json');
let miscData: typeof import('../packages/data/files/misc.json') | undefined;

try {
	await fs.access(miscFilePath);
	miscData = JSON.parse(await fs.readFile(miscFilePath, 'utf8'));
} catch {}

if (!miscData || miscData?.version !== latestVersion || !textData.data.roleQuests || !textData.data.dragons) {
	console.log('misc data not present or outdated, fetching...');

	const sharedData = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/shared.cdtb.bin.json`, 'game/shared.cdtb.bin.json');
	await loadStringTable();

	miscData = {
		version: latestVersion,
		data: {
			dragons: Object.fromEntries(await Promise.all(DRAGONS.map(async ([name, spellKey]) => {
				const stackDataKey = `Shared/Spells/SRX_DragonBuff${spellKey || name}`;
				const soulDataKey = `Shared/Spells/SRX_DragonSoulBuff${spellKey || name}`;
				const stackData = sharedData[stackDataKey];
				const soulData = sharedData[soulDataKey];

				if (!stackData || !soulData) {
					throw new Error(`Dragon ${name} stack (${!!stackData}) / soul (${!!soulData}) data not present`);
				}

				const { ObjectName: stackObjectName, mSpell: { DataValues: stackDataValues, mSpellCalculations: stackSpellCalculations } } = stackData;
				const parsedStackDataValues = stackDataValues?.length
					? Object.fromEntries(stackDataValues.map(({ name, values }: Record<string, number[]>) =>
							[name, values?.length ? values.map(value => formatNumber(value)) : undefined],
						))
					: undefined;

				const { ObjectName: soulObjectName, mSpell: { DataValues: soulDataValues, mSpellCalculations: soulSpellCalculations } } = soulData;
				const parsedSoulDataValues = soulDataValues?.length
					? Object.fromEntries(soulDataValues.map(({ name, values }: Record<string, number[]>) =>
							[name, values?.length ? values.map(value => formatNumber(value)) : undefined],
						))
					: undefined;

				return [name, {
					name,
					stack: {
						objectName: stackObjectName,
						dataKey: stackDataKey,
						dataValues: parsedStackDataValues,
						spellCalculations: cleanupObject(stackSpellCalculations),
					},
					soul: {
						objectName: soulObjectName,
						dataKey: soulDataKey,
						dataValues: parsedSoulDataValues,
						spellCalculations: cleanupObject(soulSpellCalculations),
					},
				}];
			}))),
		} as unknown as NonNullable<(typeof miscData)>['data'],
	};

	textData.data.dragons = Object.fromEntries(DRAGONS.map(([name, spellKey]) => {
		const stackData = sharedData[`Shared/Spells/SRX_DragonBuff${spellKey || name}`];
		const soulData = sharedData[`Shared/Spells/SRX_DragonSoulBuff${spellKey || name}`];

		const stackAbility = miscData!.data.dragons[name as IDragonName].stack;
		const soulAbility = miscData!.data.dragons[name as IDragonName].soul;
		const allSpells = [[stackAbility, 'passive'], [soulAbility, 'passive']] as [IChampionAbilityVariant, IChampionAbilityKey][];

		const { mBuff: { mDescription: stackDescriptionKey } } = stackData;
		const { mBuff: { mTooltipData: { mLocKeys: { keyTooltip: soulTooltipKey } } } } = soulData;

		let stack = getStringtableValue(stackDescriptionKey, {
			category: 'misc',
			key: `dragon stack ${name}`,
			variables: {
				variableSourceKeys: ['DataValues'],
				variableType: 'championAbility',
				variableValueParameters: { abilityVariant: stackAbility, allAbilitiesVariants: allSpells },
			},
		});
		/* hextech soul has text only for both melee | ranged split but everywhere else I try to display appropriate melee/ranged/both so alter it to make that possible */
		const soul = getStringtableValue(soulTooltipKey, `dragon soul ${name}`)?.replace('(%i:meleeActive%@Spell.SRX_DragonSoulBuffHextech:TotalSlowAmountMelee@% || %i:rangedActive%@Spell.SRX_DragonSoulBuffHextech:TotalSlowAmountRanged@%)', '@lolcalcChampRange@')!;
		debugStringVariables(soul, {
			category: 'misc',
			key: `dragon soul ${name}`,
			variables: {
				variableSourceKeys: ['dataValues'],
				variableType: 'championAbility',
				variableValueParameters: { abilityVariant: soulAbility, allAbilitiesVariants: allSpells, dynamicVariables: (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[name]?.soul?.variables },
			},
		});

		if (!stack) {
			throw new Error(`[misc dragons] stack ${name} string not found`);
		}

		const stackTitleEndIndex = stack.indexOf('</titleLeft>');
		if (~stackTitleEndIndex) {
			stack = stack.slice(stackTitleEndIndex + 12);
		}
		stack = stack.replaceAll('<br>', '').replaceAll('<mainText>', '').replaceAll('</mainText>', '');

		return [name, { stack, soul }];
	})) as unknown as NonNullable<(typeof textData)>['data']['dragons'];

	/* role quest descriptions and values seem to be stored under items under item ids listed below */
	const moreItemData = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/items.cdtb.bin.json`, 'game/items.cdtb.bin.json');

	textData.data.roleQuests = {} as any;
	miscData.data.roleQuests = Object.fromEntries(([
		['top', 1220],
		['jungle', 1211],
		['mid', 1206],
		['bot', 1207],
		['support', 1208],
	] as [IChampionRole, number][]).map(([role, itemId]) => {
		const itemMoreData = moreItemData[`Items/${itemId}`];

		if (!itemMoreData) {
			throw new Error(`[misc role quest] failed to get ${role} quest item data "Items/${itemId}"`);
		}

		const tooltipData = itemMoreData.mItemDataClient?.mTooltipData?.mLocKeys;

		if (!(tooltipData?.keyName || tooltipData?.keyTooltip)) {
			throw new Error(`[misc role quest] ${role} quest item doesn't have expected tooltip names`);
		}

		textData.data.roleQuests[role] = {
			title: getStringtableValue(tooltipData.keyName, `role quest ${role}`)!,
			description: getStringtableValue(tooltipData.keyTooltip, `role quest ${role}`)!,
		};

		const value = {
			dataValues: itemMoreData.mDataValues?.length
				? Object.fromEntries(itemMoreData.mDataValues.map(({ mName, mValue }: Record<string, number>) =>
						[mName, mValue !== undefined ? formatNumber(mValue) : undefined],
					))
				: undefined,
		};

		debugStringVariables(textData.data.roleQuests[role].description, {
			key: `role-quest-${role}`,
			category: 'misc',
			variables: {
				variableType: 'item',
				variableSourceKeys: [],
				variableValueParameters: {
					item: value as IItem,
					dynamicVariables: (MISC_SPECIFICS as IHypotheticalMiscSpecifics).roleQuests[role]?.variables,
				},
			},
		});

		return [role, value];
	})) as unknown as NonNullable<(typeof miscData)>['data']['roleQuests'];

	/* jungle technically has 3 different items, each for a different smite with different pet name so to make it cooler manually put all of them here */
	textData.data.roleQuests.jungle.description = textData.data.roleQuests.jungle.description.replace('<font color = \'#800000\'>Scorchclaw</font>', '<font color = \'#800000\'>Scorchclaw</font> / <font color = \'#0B6623\'>Mosstomper</font> / <font color = \'#4682B4\'>Gustwalker</font>');

	await fs.writeFile(miscFilePath, stringifyObject(miscData));
	await fs.writeFile(textFilePath, stringifyObject(textData));
}

const uiFilePath = path.join(import.meta.dirname, '../packages/data/files/ui.json');
let uiData: typeof import('../packages/data/files/ui.json') | undefined;

try {
	await fs.access(uiFilePath);
	uiData = JSON.parse(await fs.readFile(uiFilePath, 'utf8'));
} catch {}

const uiAutoAtlasData: Record<string, any> = {};
const autoAtlasImages: Record<string, {
	width: number;
	height: number;
}> = {};

if (!uiData || uiData?.version !== latestVersion) {
	console.log('ui data not present or outdated, fetching...');

	const [itemshopUiBase, playerstatsUiBase, dragonUiPrototype, practiceToolUiBase] = await Promise.all([
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/itemshop/uibase.cdtb.bin.json`, 'game/clientstates/gameplay/ux/itemshop/uibase.cdtb.bin.json'),
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/lol/playerstats/uibase.cdtb.bin.json`, 'game/clientstates/gameplay/ux/lol/playerstats/uibase.cdtb.bin.json'),
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/scoreboard/scores_dragon_srx.cdtb.bin.json`, 'game/clientstates/gameplay/ux/scoreboard/scores_dragon_srx.cdtb.bin.json'),
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/lol/practicetool/uibase.cdtb.bin.json`, 'game/clientstates/gameplay/ux/lol/practicetool/uibase.cdtb.bin.json'),
		/* auto atlas data for playerstat icons, prefetch since it can be called multiple times */
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/lol/playerstats.cdtb.json`, 'game/clientstates/gameplay/ux/lol/playerstats.cdtb.json'),
	]);

	async function getTexture(data: any, debug: string, autoAtlasCdtbUrl?: string) {
		const { TextureData } = data || {};
		if (TextureData && 'mTextureName' in TextureData) {
			return {
				spriteSheet: TextureData.mTextureName.toLowerCase().replace('.tex', '.png'),
				resWidth: TextureData.mTextureSourceResolutionWidth,
				resHeight: TextureData.mTextureSourceResolutionHeight,
				uv: TextureData.mTextureUV,
			} as ITexture;
		}

		if (autoAtlasCdtbUrl && 'TextureName' in TextureData && TextureData.TextureName.endsWith('.png')) {
			uiAutoAtlasData[autoAtlasCdtbUrl] ||= await fetchCached(`https://raw.communitydragon.org/${minorVersion}/${autoAtlasCdtbUrl}`, autoAtlasCdtbUrl);

			const { atlasPath, startX, startY, endX, endY } = uiAutoAtlasData[autoAtlasCdtbUrl][TextureData.TextureName];

			let resWidth, resHeight;
			if (autoAtlasImages[atlasPath]) {
				({ width: resWidth, height: resHeight } = autoAtlasImages[atlasPath]);
			} else {
				const image: ArrayBuffer = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/${atlasPath}`, `game/${atlasPath}`, 'arrayBuffer');

				try {
					({ width: resWidth, height: resHeight } = imageSize(new Uint8Array(image)));
					autoAtlasImages[atlasPath] = { width: resWidth, height: resHeight };
				} catch (error) {
					console.error(error);
					throw new Error(`[itemData getTexture] failed to resolve atlas image "https://raw.communitydragon.org/${minorVersion}/game/${atlasPath}"`);
				}
			}

			return {
				spriteSheet: atlasPath,
				resWidth,
				resHeight,
				uv: [startX * resWidth, startY * resHeight, endX * resWidth, endY * resHeight],
			} as ITexture;
		}

		throw new Error(`Haven't found texture data for: ${debug}`, data);
	}

	uiData = {
		version: latestVersion,
		data: {
			shop: {
				categories: Object.fromEntries(await Promise.all(([
					['all', 'All', 'All'],
					['fighter', 'Attack', 'Atk'],
					['marksman', 'Marksman', 'Mark'],
					['assassin', 'Assassin', 'Ass'],
					['mage', 'Magic', 'Mag'],
					['tank', 'Defense', 'Def'],
					['support', 'Utility', 'Util'],
				] satisfies ([IItemCategory | 'all', string, string])[]).map(
					async ([itemCategory, dataPath1, dataPath2]) => {
						return [
							itemCategory,
							await getTexture(itemshopUiBase[`ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/filter/ItemShop_${dataPath1}Button/ItemShop_${dataPath2}Btn_IconDefault`], `category | ${itemCategory} | ${dataPath1} | ${dataPath2}`),
						];
					},
				))),
				stats: Object.fromEntries(await Promise.all(Object.entries({
					attackDamage: ['PhysicalDmg', 'PhysicalDamage'],
					crit: ['CritStrike', 'CriticalStrike'],
					attackSpeed: ['AttackSpeed'],
					onHit: ['OnHit'],
					armorPen: ['ArmorPenetration', 'ArmorPen'],
					abilityPower: ['AbilityPower'],
					mana: ['Mana'],
					magicPen: ['MagicPenetration', 'MagicPen'],
					health: ['Health'],
					magicResist: ['MagicResist'],
					armor: ['Armor'],
					abilityHaste: ['AbilityHaste'],
					movement: ['Movespeed'],
					vamp: ['Vamp'],
				} satisfies Record<IItemShopStatFilter, string[]>).map(
					async ([itemCategory, [dataPath1, dataPath2]]) => {
						const { uv: selectedUv } = await getTexture(itemshopUiBase[`ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/${dataPath1}Btn/${dataPath2 || dataPath1}_Selected`], `stat | ${itemCategory} | ${dataPath1} | ${dataPath2 || dataPath1} selected`);

						return [
							itemCategory,
							{
								default: await getTexture(itemshopUiBase[`ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/${dataPath1}Btn/${dataPath2 || dataPath1}_Default`], `stat | ${itemCategory} | ${dataPath1} | ${dataPath2 || dataPath1} default`),
								selected: { uv: selectedUv },
							},
						];
					},
				))),
				clearFilters: {
					default: await getTexture(itemshopUiBase['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/DisableBtn/Disable_Default'], 'default clear filters'),
					hover: { uv: (await getTexture(itemshopUiBase['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/DisableBtn/Disable_Hover'], 'hover clear filters')).uv },
				},
				swapItemOrder: {
					default: await getTexture(itemshopUiBase['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/filter/ItemShop_InvertButton/ItemShop_InvertButton_Default'], 'default swap sort order'),
					hover: { uv: (await getTexture(itemshopUiBase['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/filter/ItemShop_InvertButton/ItemShop_InvertButton_Hover'], 'hover swap sort order')).uv },
				},
				pin: {
					default: await getTexture(itemshopUiBase['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_BootsPanel/ItemShop_BootsPanel_PinButton/BootsPanel_PinButton_Default'], 'default pin'),
					hover: { uv: (await getTexture(itemshopUiBase['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_BootsPanel/ItemShop_BootsPanel_PinButton/BootsPanel_PinButton_Hover'], 'hover pin')).uv },
					slcHover: { uv: (await getTexture(itemshopUiBase['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_BootsPanel/ItemShop_BootsPanel_PinButton/BootsPanel_PinButton_SlcHover'], 'slc hover pin')).uv },
				},
			},
			playerStats: Object.fromEntries(await Promise.all([
				['healthResourceRegen', 'Player_AdvancedStats/Stats_HPR_Icon'],
				['healShieldPower', 'Player_AdvancedStats/Stats_HSP_Icon'],
				['armorPen', 'Player_AdvancedStats/Stats_APen_Icon'],
				['magicPen', 'Player_AdvancedStats/Stats_MPen_Icon'],
				['lifeSteal', 'Player_AdvancedStats/Stats_LS_Icon'],
				['omnivamp', 'Player_AdvancedStats/Stats_SV_Icon'],
				['attackRange', 'Player_AdvancedStats/Stats_AR_Icon'],
				['tenacity', 'Player_AdvancedStats/Stats_Ten_Icon'],
				['attackDamage', 'Player_Stats/Stats_AD_Icon'],
				['abilityPower', 'Player_Stats/Stats_AP_Icon'],
				['armor', 'Player_Stats/Stats_Armor_Icon'],
				['magicResist', 'Player_Stats/Stats_MR_Icon'],
				['attackSpeed', 'Player_Stats/Stats_AS_Icon'],
				['abilityHaste', 'Player_Stats/Stats_AH_Icon'],
				['crit', 'Player_Stats/Stats_Crit_Icon'],
				['moveSpeed', 'Player_Stats/Stats_MS_Icon'],
			].map(async ([name, key]) => {
				return [name, await getTexture(
					playerstatsUiBase[`ClientStates/Gameplay/UX/LoL/PlayerStats/UIBase/${key}`],
					`player stats ${name}`,
					'game/clientstates/gameplay/ux/lol/playerstats.cdtb.json',
				)];
			}))),
			dragons: Object.fromEntries(await Promise.all(DRAGONS.map(async ([name]) => {
				return [name, {
					stack: await getTexture(dragonUiPrototype[`ClientStates/Gameplay/UX/Scoreboard/Scores_Dragon_SRX/SB_MD_Source_${name}Icon`], `dragon stack ${name}`),
					soulActive: await getTexture(dragonUiPrototype[`ClientStates/Gameplay/UX/Scoreboard/Scores_Dragon_SRX/SB_MD_CSrceAct_${name}Icon`], `dragon soul active ${name}`),
				}];
			}))),
			practiceTool: {
				statusEffect: await getTexture(practiceToolUiBase['ClientStates/Gameplay/UX/LoL/PracticeTool/UIBase/CheatMenu/Icons/CheatStatusEffect_Icon'], 'practice tool status effect', 'game/clientstates/gameplay/ux/lol/practicetool.cdtb.json'),
			},
		} as unknown as NonNullable<(typeof uiData)>['data'],
	};

	await fs.writeFile(uiFilePath, stringifyObject(uiData));
}

const effectFilePath = path.join(import.meta.dirname, '../packages/data/files/effect.json');
let effectData: typeof import('../packages/data/files/effect.json') | undefined;

try {
	await fs.access(effectFilePath);
	effectData = JSON.parse(await fs.readFile(effectFilePath, 'utf8'));
} catch {}

if (!effectData || effectData?.version !== latestVersion || EFFECT_SPECIFICS_OBJECT_ENTRIES.some(entry => !(entry[0] in effectData!.data))) {
	console.log('effect data not present or outdated, fetching...');

	const [itemMoreData, sharedSpellsData] = await Promise.all([
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/items.cdtb.bin.json`, 'game/items.cdtb.bin.json'),
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/shared.cdtb.bin.json`, 'game/shared.cdtb.bin.json'),
		loadStringTable(),
	]);

	const effectDataStringtable = { stringtable: {} as Record<string, string> };
	const referenceEffectObjectNames: IEffectObjectName[] = [];

	effectData = {
		version: latestVersion,
		data: Object.fromEntries(await Promise.all(EFFECT_SPECIFICS_OBJECT_ENTRIES.filter(([effectObjectName]) => {
			const customEffect = CUSTOM_EFFECTS[effectObjectName];
			if (typeof customEffect === 'object' && 'objectName' in customEffect) {
				referenceEffectObjectNames.push(effectObjectName);
				return false;
			}
			return true;
		}).map(async ([effectObjectName, effectSpecific]) => {
			if (CUSTOM_EFFECTS[effectObjectName]) {
				const customEffect = CUSTOM_EFFECTS[effectObjectName];
				if (typeof customEffect === 'string') {
					const description = getStringtableValue(customEffect, `custom effect ${effectObjectName} description`);

					if (!description) {
						throw new Error(`[updateGameData effectData] custom effect "${effectObjectName}" stringtable value "${CUSTOM_EFFECTS[effectObjectName]}" not found`);
					}

					return [effectObjectName, {
						dataKey: effectObjectName,
						description: extractEffectDescription(description),
					}];
				} else if ('stringtable' in customEffect) {
					const description = getStringtableValue(customEffect.stringtable as string, `custom effect ${effectObjectName} description`);

					if (!description) {
						throw new Error(`[updateGameData effectData] custom effect "${effectObjectName}" stringtable value "${CUSTOM_EFFECTS[effectObjectName]}" not found`);
					}

					effectDataStringtable.stringtable[customEffect.stringtable as string] = extractEffectDescription(description);

					return [effectObjectName, {
						dataKey: effectObjectName,
						stringtable: customEffect.stringtable,
					}];
				} else if ('sharedSpellObjectKey' in customEffect || 'championSpellObjectKey' in customEffect) {
					const spellKey = (customEffect as any).sharedSpellObjectKey ?? (customEffect as any).championSpellObjectKey;

					let sourceSpell;
					if ('sharedSpellObjectKey' in customEffect) {
						sourceSpell = sharedSpellsData[customEffect.sharedSpellObjectKey];
					} else {
						const { id } = EFFECT_SPECIFICS[effectObjectName].sourceAbility;
						const championData = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin.json`, `game/data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin.json`);
						sourceSpell = championData[customEffect.championSpellObjectKey];
					}

					if (!sourceSpell) {
						throw new Error(`[updateGameData effectData] custom effect "${effectObjectName}" spell "${spellKey}" not found in target data`);
					}

					const effectData: Extract<IEffectData[string], { sharedSpellObjectKey: string }> | Extract<IEffectData[string], { championSpellObjectKey: string }> = {
						dataKey: effectObjectName,
						sharedSpellObjectKey: (customEffect as any).sharedSpellObjectKey,
						sharedSpellEffectObjectKey: (customEffect as any).sharedSpellEffectObjectKey,
						championSpellObjectKey: (customEffect as any).championSpellObjectKey,
						objectName: sourceSpell.ObjectName,
						name: undefined,
						description: '',
						image: undefined,
						dataValues: undefined,
						spellCalculations: undefined,
						cooldownTime: undefined,
					};

					if (sourceSpell.mBuff?.mDescription || 'sharedSpellEffectObjectKey' in customEffect) {
						let description = '';

						/* currently only exhaust applies 2 effects, 1 for slow and 1 for damage reduction, so support extracting multiple descriptions and combine them into 1 */
						const buffDescriptionSources = [sourceSpell];

						type ICustomEffectSharedKey = Extract<IEffectData[string], { sharedSpellObjectKey: string }>;

						if ((customEffect as ICustomEffectSharedKey).sharedSpellEffectObjectKey) {
							if (typeof (customEffect as ICustomEffectSharedKey).sharedSpellEffectObjectKey === 'string') {
								buffDescriptionSources[0] = sharedSpellsData[(customEffect as ICustomEffectSharedKey).sharedSpellEffectObjectKey as string];
							} else {
								buffDescriptionSources.splice(0, 1, ...((customEffect as ICustomEffectSharedKey).sharedSpellEffectObjectKey as string[]).map(key => sharedSpellsData[key]));
							}
						}

						for (const buffDescriptionSource of buffDescriptionSources) {
							const buffDescription = getStringtableValue(buffDescriptionSource.mBuff.mDescription, `custom effect ${effectObjectName} ${buffDescriptionSource.ObjectName} description`);

							if (buffDescription) {
								description += `${description ? ' ' : ''}${extractEffectDescription(buffDescription)}`;
							}
						}

						if (description) {
							effectData.description = description;
						}
					} else if (sourceSpell.mBuff?.mTooltipData?.mLocKeys?.keyTooltip) {
						effectData.description = getStringtableValue(sourceSpell.mBuff.mTooltipData.mLocKeys.keyTooltip, `custom effect ${effectObjectName} ${sourceSpell.ObjectName} description`)!;
					} else if ('sharedSpellEffectObjectKey' in customEffect && !sourceSpell.mSpell) {
						throw new Error(`[updateGameData effectData] custom effect "${effectObjectName}" mSpell not found in shared spell "${spellKey}" object`);
					}

					/* used for summoner spells to extract spell data but not needed for champion spells since that data should already be saved on champion */
					if (sourceSpell.mSpell && !('championSpellObjectKey' in customEffect)) {
						const { mImgIconName, DataValues, mSpellCalculations, mClientData, cooldownTime } = sourceSpell.mSpell;

						if (!mImgIconName?.[0]) {
							throw new Error(`${effectObjectName} expected mImgIconName in shared spell`);
						}

						(effectData as any).image = `assets/spells/icons2d/${mImgIconName[0].toLowerCase().replace('.dds', '.png')}`;
						(effectData as any).dataValues = DataValues?.length
							? Object.fromEntries(DataValues.map(({ name, values }: Record<string, number[]>) =>
									[name, values?.length ? values.map(value => formatNumber(value)) : undefined],
								))
							: undefined;
						(effectData as any).spellCalculations = cleanupObject(mSpellCalculations);
						(effectData as any).cooldownTime = cooldownTime && cooldownTime.map((v: number) => formatNumber(v));

						if (!effectData.description || 'sharedSpellObjectKey' in effectData) {
							if (!mClientData) {
								throw new Error(`${effectObjectName} expected mClientData in shared spell`);
							}
							if (!mClientData.mTooltipData) {
								throw new Error(`${effectObjectName} expected mTooltipData in shared spell`);
							}

							const variables: IBaseStringtableVariableDebug<'championAbility'>['variables'] = {
								variableType: 'championAbility',
								variableValueParameters: {
									abilityVariant: effectData,
									allAbilitiesVariants: [],
								},
								variableSourceKeys: ['spellCalculations'],
							};

							(effectData as any).name = mClientData?.mTooltipData?.mLocKeys?.keyName && getStringtableValue(mClientData.mTooltipData.mLocKeys.keyName, {
								category: 'effect',
								key: `${effectObjectName} name`,
								stringtableVariableSaveUnder: effectDataStringtable,
								variables,
							});
							(effectData as any)[effectData.description ? 'tooltip' : 'description'] = mClientData?.mTooltipData?.mLocKeys?.keyTooltip && getStringtableValue(mClientData.mTooltipData.mLocKeys.keyTooltip, {
								category: 'effect',
								key: `${effectObjectName} tooltip`,
								stringtableVariableSaveUnder: effectDataStringtable,
								variables,
							});

							if (!(effectData as any).name) {
								throw new Error(`[updateGameData effectData] custom effect "${effectObjectName}" failed to resolve name`);
							}
						}
					}

					if (!effectData.description) {
						throw new Error(`[updateGameData effectData] custom effect "${effectObjectName}" failed to resolve description`);
					}

					return [effectObjectName, effectData];
				} else {
					return [effectObjectName, { dataKey: effectObjectName, ...customEffect }];
				}
			}

			/* effects without sourceAbility, for now only grievous wounds, should be handled with `CUSTOM_EFFECTS` above */
			if (!effectSpecific.sourceAbility) {
				throw new Error('[updateGameData effectData] unexpected unhandled effect without source ability');
			}

			const { id, type } = effectSpecific.sourceAbility;
			const dataSource = type === AbilityType.champion
				? await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin.json`, `game/data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin.json`)
				: itemMoreData;

			const data = Object.entries(dataSource).find(([, abilityObject]) => (abilityObject as any).ObjectName === effectObjectName) as [string, any] | undefined;

			if (!data) {
				throw new Error(`[effectData] no effect data ${effectObjectName}`);
			}

			let descriptionKey = data[1].mBuff.mDescription;
			let extractMainText = true;

			if (!descriptionKey) {
				descriptionKey = data[1].mBuff?.mTooltipData?.mLocKeys?.keyTooltip;
				extractMainText = false;
			}

			if (!descriptionKey) {
				throw new Error(`[effectData] no description key ${effectObjectName}`);
			}

			let description = getStringtableValue(descriptionKey, `effectData`);

			if (!description) {
				throw new Error(`[effectData] no description for key ${descriptionKey} ${effectObjectName}`);
			}

			if (description && extractMainText) {
				description = extractEffectDescription(description);
			}

			description &&= description.trim();
			description && debugStringVariables(description, {
				category: 'effect',
				key: `effect-${effectObjectName}-descriptionKey`,
				stringtableVariableSaveUnder: effectDataStringtable,
			});

			return [effectObjectName, {
				description,
				dataKey: data[0],
			}];
		}))) as unknown as NonNullable<(typeof effectData)>['data'],
		stringtable: effectDataStringtable.stringtable as NonNullable<typeof effectData>['stringtable'],
	};

	for (const effectObjectName of referenceEffectObjectNames) {
		const customEffect = CUSTOM_EFFECTS[effectObjectName];
		const referencedText = (effectData.data as IEffectData)[(customEffect as Extract<NonNullable<typeof CUSTOM_EFFECTS[IEffectObjectName]>, { objectName: string }>).objectName as keyof IEffectData];
		if (!referencedText) {
			throw new Error(`[effectData] unresolved custom effect referenced objectName ${effectObjectName} ${JSON.stringify(customEffect, null, 2)}`);
		}
		(effectData.data as IEffectData)[effectObjectName] = {
			...referencedText,
			dataKey: effectObjectName,
		};
	}

	await fs.writeFile(effectFilePath, stringifyObject(effectData));
}

for (const category in debug) {
	const { variables, stringtableVariables, tags } = debug[category as keyof typeof debug];
	if (variables.size) {
		console.warn(`[${category}] unknown game variables`, variables);
	}
	if (stringtableVariables.size) {
		console.warn(`[${category}] unknown stringtable variables`, stringtableVariables);
	}
	if (tags[0].length) {
		console.warn(`[${category}] unknown tags`, tags[1], '\nfound in', tags[0]);
	}
}

const unknownShapeshifters = potentialShapeshifters.values().filter(championId => !SHAPESHIFTING_CHAMPION_IDS.includes(championId as IChampionId)).toArray();
if (potentialShapeshifters.size !== SHAPESHIFTING_CHAMPION_IDS.length || unknownShapeshifters.length) {
	console.warn('known shapeshifter champions mismatch', { potentialShapeshifters, unknownShapeshifters });
}

function itemDescriptionText(text: string, extrasStart: string): string[][] | undefined {
	const statsStartIndex = text.indexOf(extrasStart);
	const statsToEnd = text.slice(statsStartIndex + 19);
	const statsEndIndex = statsToEnd.indexOf('</section>');
	let extraToEnd = statsToEnd.slice(statsEndIndex + 19);
	let extraEndIndex = extraToEnd.indexOf('</section>');
	/** some items have an empty `<section></section>` between stats and passive, some don't */
	if (!extraEndIndex) {
		extraToEnd = extraToEnd.slice(19);
		extraEndIndex = extraToEnd.indexOf('</section>');
	}
	/** some items like ravenous hydra or youmuu's use 2 sections for their description so try to account for that with this abomination */
	if (!extraToEnd.slice(extraEndIndex).startsWith('</section><section><flavorText>')) {
		extraEndIndex = extraToEnd.indexOf('</section><section><flavorText>');
	}

	const rawExtra = extraToEnd.slice(0, extraEndIndex)
		.replace(/\{\{ ?Item_Passive_List ?\}\}/g, '')
		.replace(/\{\{ ?Item_Melee_Ranged_Split(_Dynamic)? ?\}\}/g, '@lolcalcChampRange@')
		/* exclusively for youmuu that seems to be done kind of silly */
		.replace(/\{\{ ?Item_Melee_Ranged_Split_Dynamic_B ?\}\}%/g, '@lolcalcChampRange@')
		.replaceAll(':</passive>', '</passive>')
		.replaceAll('</section><section>', '<br><br>');

	let extra = rawExtra
		? rawExtra
				.split('<br><br>')
				.map(text => text.split('<br>').map(t => t.trim()))
				.filter(text => text.some(Boolean))
		: undefined;
	/** some item descriptions are split with '' instead so try to handle it */
	if (extra?.length === 1) {
		const result = [];
		let current = [];
		for (const item of extra[0]!) {
			if (item) {
				current.push(item);
			} else if (current.length) {
				result.push(current);
				current = [];
			}
		}
		current.length && result.push(current.filter(Boolean));
		extra = result;
	}

	for (let i = 0; i < (extra?.length ?? 0); i++) {
		/* remove empty items from split text */
		for (let j = extra![i]!.length - 1; j >= 0; j--) {
			if (!extra![i]![j]) {
				extra![i]!.splice(j, 1);
			}
		}
		const replaced: string[] = [];
		let [heading] = extra![i] as [string];
		let liStartIndex = heading.indexOf('<li>');
		while (~liStartIndex) {
			const headingEndIndex = heading.indexOf('</passive>');
			const newHeading = heading.slice(4, headingEndIndex + 10);

			heading = heading.slice(headingEndIndex + 11);
			liStartIndex = heading.indexOf('<li>');

			const paragraphEndIndex = ~liStartIndex ? liStartIndex : undefined;
			replaced.push(newHeading, heading.slice(0, paragraphEndIndex));
			heading = heading.slice(paragraphEndIndex);
		}

		if (replaced.length) {
			extra![i] = replaced;
		}
	}

	return extra;
}

/**
 * also replaces `{{ Item_Melee_Ranged_Split_Dynamic }}` with `@lolcalcChampRange@` that gets special treatment in `@lolcalc/core/variables/game` and `@lolcalc/core/specifics/index`
 */
function updateItemShopItemTooltipText(item: IItem, mItemDataClient: any) {
	const specific = (ITEM_SPECIFICS as IHypotheticalItemSpecifics)[item.id as keyof IHypotheticalItemSpecifics];
	const preplaceTextInventory = specific?.preplaceTextInventory;

	/**
		* `mShopTooltip` looks like `generatedtip_item_3176_tooltipshop`
		* `mDynamicTooltip` looks like `generatedtip_item_3161_tooltipinventory`
		*/
	const { mShopTooltip, mDynamicTooltip, mTooltipData } = mItemDataClient;
	/**
	 * `keyTooltipExtendedRules` looks like `item_1054_tooltipextendedrules`
	 * `keyInventoryOnlyText` looks like `item_3170_inventoryonlytext`
	 * `keyKeywordDefinitions` looks like `item_6699_keyworddefinitions`
	 * `keyTooltip` looks like `item_6617_tooltip`
	 * `keyTooltipExtended` looks like `item_6617_tooltipextended`
	 */
	const { keyTooltipExtendedRules, keyInventoryOnlyText, keyKeywordDefinitions, keyTooltip, keyTooltipExtended } = mTooltipData?.mLocKeys || {};

	const textShop = getStringtableValue(mShopTooltip, 'item tooltipShop');
	const textInventory = getStringtableValue(mDynamicTooltip, 'item tooltipInventory');
	if (!textShop) {
		throw new Error('[updateItemShopItemTooltipText] no string');
	}

	const subtitleLeftStartIndex = textShop.indexOf('<subtitleLeft>');
	const subtitleLeftEndIndex = textShop.indexOf('</subtitleLeft>');
	/* move start by tag length + unused {{ Item_BriefIcon... }} */
	const subtitleLeft = textShop.slice(subtitleLeftStartIndex + 51, subtitleLeftEndIndex);

	const subtitleRightStartIndex = textShop.indexOf('<subtitleRight>');
	const subtitleRightEndIndex = textShop.indexOf('</subtitleRight>');
	const subtitleRight = textShop.slice(subtitleRightStartIndex + 15, subtitleRightEndIndex);

	const tooltipShop = itemDescriptionText(textShop, '</section><section>');

	let preplacedTextInventory: string | undefined;
	if (preplaceTextInventory) {
		preplacedTextInventory = preplaceTextInventory(textShop);
		if (preplacedTextInventory.length === textShop.length) {
			console.warn(`[updateItemShopItemTooltipText] preplaceTextInventory ran but text length didn't change ${item.name} (${item.id})`);
		}
	}

	let tooltipInventory = textInventory ? itemDescriptionText(textInventory, '<mainText><section>') : undefined;

	if (tooltipShop && tooltipInventory?.every((extra, extraIndex) => extra.every((line, lineIndex) =>
		tooltipShop[extraIndex]?.[lineIndex] === line,
	))) {
		tooltipInventory = undefined;
	}

	if (preplacedTextInventory) {
		if (tooltipInventory) {
			/* if this ever pops up probably remove existing preplaceTextInventory/adjust it and below make it run on original `textInventory` */
			console.warn(`[updateItemShopItemTooltipText] preplaceTextInventory present but ${item.name} (${item.id}) has own 'textInventory'`);
		}
		tooltipInventory = itemDescriptionText(preplacedTextInventory, '</section><section>');
	}

	const variableDebug = {
		category: 'item',
		variables: {
			variableSourceKeys: ['itemCalculations'],
			variableType: 'item',
			variableValueParameters: {
				item,
				dynamicVariables: {
					known: Object.assign(
						/* `ChampRange` is originally an object in `itemCalculations` with `mDefaultGameCalculation` and `mConditionalGameCalculation` that point to 2 other item calculations that both seem to resolve to either `1` or `2` hence the below */
						{ lolcalcChampRange: [1, 2], ChampRange: [1, 2] },
						specific?.variables?.known,
					),
					default: specific?.variables?.default,
				},
			},
		},
	} satisfies Omit<IStringtableVariableDebug, 'key'>;

	const combinedDescriptions = tooltipShop?.flatMap(tooltip => tooltip).concat(tooltipInventory?.flatMap(tooltip => tooltip) || []).join(' ');
	combinedDescriptions && debugStringVariables(combinedDescriptions, { ...variableDebug, key: `${item.id} ${item.name} text` });

	let extended = keyTooltipExtendedRules && getStringtableValue(keyTooltipExtendedRules, 'item tooltip extendedRules', true);
	if (keyTooltip && keyTooltipExtended) {
		const tooltipExtended = getStringtableValue(keyTooltipExtended, 'item tooltip tooltipExtended', true);
		const bracketIndex = tooltipExtended?.indexOf('}');
		if (tooltipExtended && ~bracketIndex! && tooltipExtended.slice(2, bracketIndex).toLowerCase() === keyTooltip?.toLowerCase()) {
			if (extended) {
				/* at the moment none of the items seem to have both, but if any do then maybe combine `extendedRules` and `tooltipExtended` with `<br>`? */
				console.warn(`[updateItemShopItemTooltipText] ${item.name} has both 'keyTooltipExtendedRules' & 'keyTooltipExtended'`);
			}
			extended = tooltipExtended.slice(bracketIndex! + 2);
		}
	}
	extended = cleanupItemText(extended);
	extended && debugStringVariables(extended, { ...variableDebug, key: `${item.id} ${item.name} keyTooltipExtendedRules/keyTooltipExtended` });

	let footerLeft = keyInventoryOnlyText && getStringtableValue(keyInventoryOnlyText, 'item keyInventoryOnlyText');
	footerLeft = cleanupItemText(footerLeft);
	footerLeft && debugStringVariables(footerLeft, { ...variableDebug, key: `${item.id} ${item.name} keyInventoryOnlyText` });

	let keywordDefinitions = keyKeywordDefinitions && getStringtableValue(keyKeywordDefinitions, 'item keyKeywordDefinitions');
	keywordDefinitions = cleanupItemText(keywordDefinitions);
	keywordDefinitions && debugStringVariables(keywordDefinitions, { ...variableDebug, key: `${item.id} ${item.name} keyKeywordDefinitions` });

	if (subtitleLeft || subtitleRight || tooltipShop?.length || tooltipInventory?.length || extended || footerLeft || keywordDefinitions) {
		(textData.data.items as any)[item.id] = {
			subtitleLeft: subtitleLeft || undefined,
			subtitleRight: subtitleRight || undefined,
			tooltipShop,
			tooltipInventory,
			extended: extended || undefined,
			footerLeft: footerLeft || undefined,
			keywordDefinitions: keywordDefinitions || undefined,
		};
	}
}

function cleanupItemText(text?: string): string | undefined {
	return text && trimBr(text.replace(/\{\{ ?Item_Melee_Ranged_Split(_Dynamic)? ?\}\}/g, '@lolcalcChampRange@'));
}

function trimBr(value: string) {
	while (value.startsWith('<br>')) {
		value = value.slice(4).trim();
	}
	while (value.endsWith('<br>')) {
		value = value.slice(0, -4).trim();
	}
	return value;
}

function createRuneSlotData(dataKey: string, data: any) {
	const { mPerkId, mPerkName, mScript: { mSpellScriptData }, mDisplayNameLocalizationKey, mTooltipNameLocalizationKey, mShortDescLocalizationKey, mLongDescLocalizationKey, mIconTextureName } = data;

	const value = {
		id: mPerkId,
		name: mPerkName,
		icon: mIconTextureName.toLowerCase().replace('.tex', '.png'),
		dataKey,
		calculations: cleanupObject(mSpellScriptData.mCalculations),
		effectAmount: cleanupObject(mSpellScriptData.mEffectAmount, true),
	};

	const variableDebug = {
		category: 'rune' as const,
		variables: {
			variableType: 'rune',
			variableValueParameters: { rune: value },
			variableSourceKeys: ['calculations', 'effectAmount'],
		},
	} satisfies Omit<IStringtableVariableDebug, 'key'>;

	(textData.data.runes.slots as any)[mPerkName] = {
		name: getStringtableValue(mDisplayNameLocalizationKey, 'rune slot'),
		tooltipShort: getStringtableValue(mShortDescLocalizationKey, { ...variableDebug, key: `${mPerkName}-tooltipShort` }),
		tooltipLong: getStringtableValue(mLongDescLocalizationKey, { ...variableDebug, key: `${mPerkName}-tooltipLong` }),
		// TODO add debug when implementing, replace long with {{}} if it uses it and is in the stringtable, similar to variant.tooltip = `{{${mLocKeys.keyTooltip}}}` in championAbilityVariants
		tooltipStats: getStringtableValue(mTooltipNameLocalizationKey, 'rune slot'),
	};

	return [mPerkName, value];
}

async function loadStringTable() {
	if (!stringtable) {
		console.log('fetching stringtable...');
		({ entries: stringtable } = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/en_us/data/menu/en_us/lol.stringtable.json`, 'game/en_us/data/menu/en_us/lol.stringtable.json'));
	}
}

async function loadRcpFeLolCollectionsCss() {
	if (!rcpFeLolCollectionsCss) {
		await fetchCached(`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/rcp-fe-lol-collections.css`, 'plugins/rcp-fe-lol-collections/global/default/rcp-fe-lol-collections.css', 'text').then((text) => {
			rcpFeLolCollectionsCss = text;
		});
	}
}

type IStringtableVariableDebug = IBaseStringtableVariableDebug<'item'>
	| IBaseStringtableVariableDebug<'rune'>
	| IBaseStringtableVariableDebug<'championAbility'>;

interface IBaseStringtableVariableDebug<T extends IGameVariableType> {
	category: keyof typeof debug;
	/** identifier of the variable, like rune-X-tooltipShort */
	key: string;
	variables?: {
		/** type of the game variable being resolved */
		variableType: T;
		/** parameters of the function used for resolving game variables except the dynamicValues parameter has both `known`, which will used in resolving stringtable variable, and `default`, which will be used in resolving game variable */
		variableValueParameters: Omit<IGameVariableValueParameters[T], 'dynamicVariables'> & { dynamicVariables?: Pick<ISpecificVariables, 'known' | 'default'> };
		/** the keys under which variables can be found on the target of the replacement. They will be used to replace recognized variables with their resolved names if they are hashed */
		variableSourceKeys: string[];
	};
	/** the object under which to save the stringtable variables. `textData` by default */
	stringtableVariableSaveUnder?: { stringtable?: Record<string, string> };
}

function getStringtableValue(path: string, variableDebug: string | IStringtableVariableDebug, optional?: boolean): string | undefined {
	const value = stringtable[path.toLowerCase()] || stringtable[hashXxh3(path, 38)];
	if (!optional && !value) {
		console.warn(`[${typeof variableDebug === 'string' ? variableDebug : variableDebug.key}] string "${path.toLowerCase()}" not found in the stringtable`);
	}
	if (value && typeof variableDebug === 'object') {
		debugStringVariables(value, variableDebug);
	}
	return value;
}

function debugStringVariables(value: string, variableDebug: IStringtableVariableDebug) {
	const { category, key, stringtableVariableSaveUnder, variables } = variableDebug;

	const { replaced: stringtableReplaced, stringtableVariables, unknownStringtableVariables } = replaceStringtableVariables(value, stringtable, { values: variables?.variableValueParameters.dynamicVariables?.known }, false);

	if (stringtableVariables.size && stringtableVariableSaveUnder) {
		stringtableVariableSaveUnder.stringtable ??= {};
	}

	for (const [stringtableKey, value] of stringtableVariables.entries()) {
		((stringtableVariableSaveUnder ?? textData.data).stringtable as any)[stringtableKey] = value;
	}
	// TODO try hashed stringtable variables, cant figure out what the hashing algorithm is atm (below uses `xxh3.Xxh3.withSeed(0n)`)
	// in passives only Zilean and Kalista have their tooltips hashed using xxh3 but the hashes my version outputs are 1 letter different from what's in the stringtable
	// for Kalista `74fdc9540b` instead of `34fdc9540b`
	// for Zilean `7ce6b5f53c` instead of `3ce6b5f53c`
	// so when implementing trying hash variable either make some workaround with checking if 9 match or find the cause of the problem
	// same for Hecarim in extended variables has `spell_listtype_hecarimw: resist amount`, which hashes to `ad503eb14e` but in stringtable there's `2d503eb14e`
	if (unknownStringtableVariables.size) {
		let anyUnknownResolved = false;
		const entries = unknownStringtableVariables.entries();
		for (const [variableName, resolvedNames] of entries) {
			let resolvedValue: [hashedKey: string, value: string, resolvedName: string] | undefined;
			for (const resolvedName of resolvedNames.values()) {
				const hash = hashXxh3(resolvedName);
				const stringtableValue = stringtable[hash];

				if (stringtableValue) {
					anyUnknownResolved = true;
					/* not sure if it can ever happen but unknown variables store a set of resolved names so idk */
					if (resolvedValue && resolvedValue[1] !== stringtableValue) {
						console.warn(`[debugStringVariables ${variableDebug.key}] unknown stringtable variable had multiple entries and their resolved values don't match`, { variableName, resolvedNames, resolvedValue, stringtableValue });
					}
					resolvedValue = [hash, stringtableValue, resolvedName];
					anyUnknownResolved ||= true;
				}
			}
			if (resolvedValue) {
				/* save on global stringtable for reuse in `updateData` (replaceStringtableVariables gets variables from this) */
				stringtable[resolvedValue[2]] = resolvedValue[1];
				/* save under target stringtable for use in rest of the code */
				((stringtableVariableSaveUnder ?? textData.data).stringtable as any)[resolvedValue[2]] = resolvedValue[1];
				((stringtableVariableSaveUnder ?? textData.data).stringtable as any).__resolvedHashes ??= {};
				((stringtableVariableSaveUnder ?? textData.data).stringtable as any).__resolvedHashes[resolvedValue[0]] = variableName;
				unknownStringtableVariables.delete(variableName);
				anyUnknownResolved ||= true;
			}
		}
		if (anyUnknownResolved) {
			return debugStringVariables(value, variableDebug);
		}
		debug[category].stringtableVariables.set(key, unknownStringtableVariables);
	}

	if (variables) {
		const { variableType, variableSourceKeys } = variables;
		/* duplicated because if original is modified then recursive calls (at the end of this if block) when any unknown variables are resolved won't work */
		const variableValueParameters = { ...variables.variableValueParameters };
		const variableSource = variableType === 'item'
			? (variableValueParameters as IGameVariableValueParameters['item']).item
			: variableType === 'championAbility'
				? (variableValueParameters as IGameVariableValueParameters['championAbility']).abilityVariant
				: (variableValueParameters as IGameVariableValueParameters['rune']).rune;

		if (variableValueParameters.dynamicVariables?.default) {
			(variableValueParameters.dynamicVariables as IDynamicVariables) = { values: variableValueParameters.dynamicVariables.default };
		}

		const { unknownVariables } = replaceGameVariables(
			stringtableReplaced,
			variableType as any,
			variableValueParameters as any,
		);

		let unknownChanged = false;

		outer: for (let i = unknownVariables.length - 1; i >= 0; i--) {
			const variableName = unknownVariables[i]![1] || unknownVariables[i]![0];
			const isHash = variableName.startsWith('{');
			const subaccessedVariables = variableValueParameters.accessedVariables?.get(variableName);
			if (subaccessedVariables?.values().some(variable => !unknownVariables.some(unknownV => unknownV[0] === variable))) {
				unknownChanged = true;
				unknownVariables.splice(i, 1);

				for (const subVar of subaccessedVariables!) {
					const subIndex = unknownVariables.findIndex(unknownV => unknownV[0] === subVar);
					if (subIndex !== -1) {
						unknownVariables.splice(subIndex, 1);
					}
				}

				continue;
			}
			const hash = isHash ? undefined : hashFnv1a(variableName);
			for (const sourceKey of variableSourceKeys.concat('dataValues') as (keyof typeof variableSource)[]) {
				let rename: [from: string, to: string] | undefined;

				if (isHash) {
					const hashedSourceKeys: [string, string][] = Object.keys(variableSource[sourceKey]).filter(key => !key.startsWith('{')).map(key => [key, hashFnv1a(key)]);
					const matchingKey = hashedSourceKeys.find(key => key[1] === variableName);
					if (matchingKey) {
						unknownChanged = objectReplaceAllEncounteredValues(variableSource, variableSourceKeys, variableName, matchingKey[0]);
						if (unknownChanged) {
							unknownVariables.splice(i, 1);
							(variableSource as any).__replacedVariables ||= {};
							(variableSource as any).__replacedVariables[variableName] = matchingKey[0];
							continue outer;
						}
					}
				} else if (hash && variableSource[sourceKey]?.[hash]) {
					rename = [hash, variableName];
				} else {
					const lowercaseKeys = Object.keys(variableSource[sourceKey] || {});
					for (const key of lowercaseKeys) {
						if (variableName !== key && variableName.toLowerCase() === key.toLowerCase()) {
							rename = [key, variableName];
						}
					}
				}

				if (rename) {
					const [from, to] = rename;
					variableSource[sourceKey][to] = variableSource[sourceKey][from];
					variableSource[sourceKey].__renamedVariables ||= {};
					variableSource[sourceKey].__renamedVariables[from] = to;
					variableSource[sourceKey][from] = undefined;
					unknownVariables.splice(i, 1);
					unknownChanged = true;
					continue outer;
				}
			}
		}
		if (unknownVariables.length) {
			debug[category].variables.set(key, unknownVariables.map(v => v[0]));
		}

		// TODO probably shouldn't do that, it's expected to happen when some unknown variables were resolved using their hashes. Rerun debug then to see if the newly resolved variables are actually known or also unknown but at least without a hash
		if (unknownChanged) {
			debugStringVariables(value, variableDebug);
		}
	}

	const unknownTags = getUnknownTags(value);
	if (unknownTags.size) {
		debug[category].tags[0].push(key);
		debug[category].tags[1] = debug[category].tags[1].union(unknownTags);
	}
}

function championAbilityDynamicVariables(specific?: IChampionSpecific<any>, abilityKey?: IChampionAbilityKey): Pick<ISpecificVariables, 'known' | 'default'> | undefined {
	return specific && (abilityKey
		? {
				known: {
					...specific.variables?.known,
					...specific[abilityKey]?.variables?.known,
				},
				default: {
					...specific.variables?.default,
					...specific[abilityKey]?.variables?.default,
				},
			}
		: specific.variables);
}

function championAbilityData(
	/** abilityKey - q-w-e-r-passive, abilityIndex 0-1-2-3-4 corresponding to abilityKey */
	abilityInfo: [IChampionAbilityKey, number],
	championId: IChampionId,
	championData: any,
	characterRootKey: string,
): IChampionAbility {
	const { mCharacterPassiveSpell, spells, '{1abb82c0}': spellLevelUpInfo, characterToolData } = championData[characterRootKey];
	const abilityDataKey = abilityInfo[1] === 4 ? mCharacterPassiveSpell : spells[abilityInfo[1]];

	const variantKeys = [abilityDataKey];
	if (abilityInfo[1] !== 4 && characterToolData?.alternateForms?.length) {
		const championDataEntries = Object.entries(championData);
		for (const form of characterToolData.alternateForms) {
			if (form.spells) {
				const maybeKey = championDataEntries.find(([, value]: any[]) => value.ObjectName === form.spells[abilityInfo[1]])?.[0];
				if (maybeKey) {
					variantKeys.push(maybeKey);
				} else {
					console.warn(`${championId} ${abilityInfo[0]} key with ObjectName of alternate form "${form.spells[abilityInfo[1]]}" not found`);
				}
			}
		}
	}

	let [maxLevel, variants] = championAbilityVariants(championId, championData, abilityInfo, variantKeys);

	if ((championId === 'Jayce' && abilityInfo[1] === 3)
		|| (championId === 'Aphelios' && abilityInfo[1] < 3)) {
		/* level up info used to be under `spellLevelUpInfo.mRequirements`, it's moved under this hash now (and `spellLevelUpInfo` was also changed to a hash) */
		const levelUpInfoProperty = '{0cfb5881}';
		if (!spellLevelUpInfo?.[levelUpInfoProperty]) {
			console.error(spellLevelUpInfo);
			throw new Error(`[championAbilityData] can't resolve spellLevelUpInfo maxLevel for ${championId} in ${characterRootKey}`);
		}
		maxLevel = spellLevelUpInfo[levelUpInfoProperty][abilityInfo[1]].mRequirements.length;
	}

	if (maxLevel === undefined) {
		console.warn(`${championId} ${abilityInfo[0]}[${abilityInfo[1]}] max ability level not found "${abilityDataKey}"`);
		maxLevel = 0;
	}

	return { maxLevel, variants };
}

function adjustApheliosAbilityData(
	championData: any,
	characterRootKey: string,
	abilities: IChampion['abilities'],
) {
	const { mAbilities } = championData[characterRootKey];
	const handledAbilities = Object.values(abilities).flatMap(ability => ability.variants.map(variant => variant.dataKey));

	abilities.w.variants = [];
	abilities.e.variants = [];

	const qVariantKeys = [];

	for (const abilityKey of mAbilities) {
		const abilityData = championData[abilityKey];
		if (!abilityData) {
			console.warn(`[adjustApheliosAbilityData] ability data not found for ${abilityKey} from ${characterRootKey} mAbilities`);
			continue;
		}

		if (handledAbilities.includes(abilityData.mRootSpell)) {
			continue;
		}

		const variantData = championData[abilityData.mRootSpell];

		if (!variantData?.mSpell) {
			console.warn(`[adjustApheliosAbilityData] data not found or no mSpell in ${abilityData.mRootSpell}`);
			continue;
		}

		if (variantData.ObjectName === 'ApheliosE') {
			if (!variantData.mSpell?.mImgIconName) {
				throw new Error(`[adjustApheliosAbilityData] expected Aphelios E with weapon swap icons in ${abilityData.mRootSpell}`);
			}

			const mLocKeys = variantData.mSpell.mClientData?.mTooltipData?.mLocKeys;

			if (!mLocKeys) {
				throw new Error(`[adjustApheliosAbilityData] expected Aphelios E tooltip data in ${abilityData.mRootSpell}`);
			}

			const variants: (IChampionAbilityVariant & { imageAlt: string })[] = [];
			for (const img of Array.from(new Set(variantData.mSpell.mImgIconName)) as string[]) {
				const image = img.toLowerCase().replace('.dds', '.png');
				const key = image.at(-5) === 'l' ? 'image' : 'imageAlt';
				const existingVariantIndex = variants.findIndex(variant => variant.image.slice(0, -6) === image.slice(0, -6));
				if (~existingVariantIndex) {
					variants[existingVariantIndex]![key] = image;
				} else {
					variants.push({
						name: undefined!,
						objectName: variantData.ObjectName,
						dataKey: abilityData.mRootSpell,
						image: '',
						imageAlt: '',
						[key]: image,
						tooltip: undefined,
						tooltipExtended: undefined,
						tooltipExtendedBelowLine: undefined,
					} as typeof variants[number]);
				}
			}

			variants.sort((a, b) => {
				const weaponA = a.image.slice(a.image.lastIndexOf('/') + 1, -6);
				const weaponB = b.image.slice(b.image.lastIndexOf('/') + 1, -6);

				const indexA = (CHAMPION_SPECIFICS.Aphelios.WEAPON_NAME_TO_VARIANT_INDEX as Record<string, number>)[weaponA] ?? Infinity;
				const indexB = (CHAMPION_SPECIFICS.Aphelios.WEAPON_NAME_TO_VARIANT_INDEX as Record<string, number>)[weaponB] ?? Infinity;

				return indexA - indexB;
			});

			for (const variant of variants) {
				variant.name = mLocKeys.keyName;
				variant.tooltip = mLocKeys.keyTooltip;
				variant.tooltipExtended = mLocKeys.keyTooltipExtended;
				variant.tooltipExtendedBelowLine = mLocKeys.keyTooltipExtendedBelowLine;
			}

			abilities.e.variants = variants as unknown as IChampionAbility['variants'];
			(abilities.e as any).dataKey = abilityData.mRootSpell;

			continue;
		}

		qVariantKeys.push(abilityData.mRootSpell);
	}

	([, abilities.q.variants] = championAbilityVariants('Aphelios', championData, ['q', 0], qVariantKeys));
	abilities.q.variants.sort((a, b) => {
		const weaponA = a.image.slice(a.image.lastIndexOf('/') + 3, -4);
		const weaponB = b.image.slice(b.image.lastIndexOf('/') + 3, -4);

		const indexA = (CHAMPION_SPECIFICS.Aphelios.WEAPON_NAME_TO_VARIANT_INDEX as Record<string, number>)[weaponA] ?? Infinity;
		const indexB = (CHAMPION_SPECIFICS.Aphelios.WEAPON_NAME_TO_VARIANT_INDEX as Record<string, number>)[weaponB] ?? Infinity;

		return indexA - indexB;
	});
}

function championAbilityVariants(
	championId: IChampionId,
	championData: any,
	[abilityKey]: [IChampionAbilityKey, number],
	variantDataKeys: string[],
): [maxLevel: number | undefined, IChampionAbility['variants']] {
	let maxLevel: number | undefined;
	const variants: IChampionAbility['variants'] = [];
	const otherAbilityTooltipVariantDataKeys: string[] = [];

	for (let i = 0; i < variantDataKeys.length; i++) {
		const [variant, variantMaxLevel] = championAbilityVariant(
			championId,
			abilityKey,
			championData,
			i,
			variantDataKeys[i]!,
			variants,
			otherAbilityTooltipVariantDataKeys,
		);
		variant && variants.push(variant);
		maxLevel ??= variantMaxLevel;
	}

	const unresolvedUsedVariantObjectNames = otherAbilityTooltipVariantDataKeys.filter(objectName => !variants.some(v => v.objectName === objectName || v.objectName.toLowerCase() === objectName.toLowerCase()));

	/*
	 * some ability tooltips use variables from ability variants that aren't extracted by `championAbilityData`
	 *
	 * i.e, while Elise's Spider Q has the `ObjectName` of `EliseSpiderQ`, in its tooltip it uses `Spell.EliseSpiderQCast:BaseDamage@`
	 * `EliseSpiderQCast` is another Q variant that from what I can tell seems almost identical to the `EliseSpiderQ` except it has different variables
	 *
	 * so while going through the default expected variants (ones `championAbilityData` finds), any other variants detected through `mClientData.mUseTooltipFromAnotherSpell` are saved and resolved here
	 * at the moment this seems to be only used for Elise (Aphelios also has `mUseTooltipFromAnotherSpell` already has dedicated treatment `adjustApheliosAbilityData`)
	 */
	let unresolvedVariantDataKey = unresolvedUsedVariantObjectNames.shift();
	while (unresolvedVariantDataKey) {
		const [variant] = championAbilityVariant(
			championId,
			abilityKey,
			championData,
			variants.length,
			unresolvedVariantDataKey,
			variants,
			otherAbilityTooltipVariantDataKeys,
			false,
		);
		variant && variants.push(variant);
		unresolvedVariantDataKey = unresolvedUsedVariantObjectNames.shift();
	}

	return [maxLevel, variants];
}

function championAbilityVariant(
	championId: IChampionId,
	abilityKey: IChampionAbilityKey,
	championData: any,
	variantIndex: number,
	variantDataKey: string,
	variants: IChampionAbilityVariant[],
	otherAbilityTooltipVariantDataKeys: string[],
	/** expected to be `false` only for additional ability variants (`unresolvedUsedVariantObjectNames`) which variables are used in shown variants' tooltips */
	saveTooltips = true,
): [IChampionAbilityVariant | undefined, maxLevel: number | undefined] {
	let maxLevel: number | undefined;
	const debugPrefix = `${championId} ${abilityKey}[${variantIndex}]`;
	const variantData = championData[variantDataKey!];
	const variantMSpell = variantData?.mSpell;

	if (variants.some(v => v.objectName === variantData.ObjectName)) {
		return [undefined, undefined];
	}

	if (!variantData || !variantMSpell) {
		throw new Error(`${debugPrefix} with key "${variantDataKey}" not found in championData`);
	}

	const { mImgIconName, DataValues, mSpellCalculations, mSpellTags, mEffectAmount, mClientData, mana, cooldownTime } = variantMSpell;

	if (variantIndex === 0) {
		if (!mClientData) {
			throw new Error(`${debugPrefix} expected mClientData in variant "${variantDataKey}"`);
		}
		if (!mClientData.mTooltipData) {
			throw new Error(`${debugPrefix} expected mTooltipData in variant "${variantDataKey}"`);
		}
		if (!mImgIconName) {
			throw new Error(`${debugPrefix} expected mImgIconName in variant "${variantDataKey}"`);
		}

		maxLevel = abilityKey === 'passive' ? 0 : mClientData.mTooltipData.mLists?.LevelUp?.levelCount;
	}

	let mLocKeys;
	/* further utilized with `unresolvedVariantDataKey` in `championAbilityVariants` */
	if (mClientData.mUseTooltipFromAnotherSpell) {
		const tooltipSourceSpell = championData[mClientData.mUseTooltipFromAnotherSpell];
		if (tooltipSourceSpell?.mSpell?.mClientData) {
			otherAbilityTooltipVariantDataKeys.push(mClientData.mUseTooltipFromAnotherSpell);
			({ mLocKeys } = tooltipSourceSpell.mSpell.mClientData.mTooltipData);
		}
	} else {
		({ mLocKeys } = mClientData.mTooltipData);
	}

	if (!(mLocKeys?.keyName || mLocKeys?.keyTooltip)) {
		throw new Error(`${debugPrefix} expected mLocKeys in variant "${variantDataKey}"`);
	}

	const extendedVariableNameOverrides = new Set<string>();
	for (const nameOverride of extendedVariableNameOverrides.values()) {
		(textData.data.stringtable as any)[nameOverride] = getStringtableValue(nameOverride, 'extended variables name overrides');
	}

	const variant = {
		name: undefined!,
		objectName: variantData.ObjectName,
		dataKey: variantDataKey,
		/** belveth has the fully highlighted q at last index */
		image: mImgIconName.at(championId === 'Belveth' && abilityKey === 'q' && variantIndex === 0 ? -1 : 0).toLowerCase().replace('.dds', '.png'),
		mana,
		cooldownTime: cooldownTime && cooldownTime.map((v: number) => formatNumber(v)),
		tooltip: undefined,
		tooltipExtended: undefined,
		tooltipExtendedBelowLine: undefined,
		extendedVariables: saveTooltips
			? mClientData.mTooltipData?.mLists?.LevelUp?.Elements
					?.filter((variable: any) => variable.type !== 'Cooldown')
					.map((variable: any) => {
						const { type, typeIndex } = variable;
						if (!type) {
							console.warn(`${debugPrefix} extended variable no type`, variable);
						}

						// TODO maybe save `.multiplier` not sure if needed since it extracts from calculated variables that should handle that?
						return {
							name: type.replace('%d', typeIndex),
							nameOverride: variable.nameOverride?.toLowerCase(),
						};
					})
			: undefined,
		dataValues: DataValues?.length
			? Object.fromEntries(DataValues.map(({ name, values }: Record<string, number[]>) =>
					[name, values?.length ? values.map(value => formatNumber(value)) : undefined],
				))
			: undefined,
		spellCalculations: cleanupObject(mSpellCalculations),
		effectAmount: cleanupObject(mEffectAmount, true),
		isImmobilizing: undefined,
	} as IChampionAbilityVariant;

	let abilityOrVariantSpecific: IChampionAbilitySpecific<any> | IChampionAbilityVariantSpecific | undefined = (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[championId]?.[abilityKey];

	if ((abilityOrVariantSpecific as IChampionAbilitySpecific)?.[variantIndex]) {
		abilityOrVariantSpecific = (abilityOrVariantSpecific as IChampionAbilitySpecific)[variantIndex];
	}

	if (abilityOrVariantSpecific?.dataOverrides?.isImmobilizing) {
		variant.isImmobilizing = true;
	} else if (abilityOrVariantSpecific?.dataOverrides?.isImmobilizing === undefined && isImmobilizingAbilityVariant(abilityKey, variant.dataValues, mSpellTags, variantData.BotData)) {
		variant.isImmobilizing = true;
	}

	/* these are later set to proper stringtable values in `setChampionAbilityVariantsText` */
	variant.name = mLocKeys.keyName;
	if (saveTooltips) {
		variant.tooltip = mLocKeys.keyTooltip;
		variant.tooltipExtended = mLocKeys.keyTooltipExtended;
		variant.tooltipExtendedBelowLine = mLocKeys.keyTooltipExtendedBelowLine;
	}

	return [variant, maxLevel];
}

/** used for detecting if an ability is an immobilzing one - will be affected by imperial mandate passive. It could possibly be improved because it returns some false flags like Yauso or Zaahen Q but I just have an option to override it (used above) from champion specifics */
function isImmobilizingAbilityVariant(abilityKey: IChampionAbilityKey, dataValues?: IChampionAbilityVariant['dataValues'], mSpellTags?: string[], botData?: any): boolean {
	if (abilityKey === 'passive' || !(mSpellTags || botData)) {
		return false;
	}

	if (mSpellTags?.some(tag => ABILITY_VARIANT_IMMOBILIZING_SPELL_TAGS.includes(tag))) {
		return true;
	}

	for (const key in botData) {
		if (!Array.isArray(botData[key])) {
			continue;
		}

		for (const entry of botData[key]) {
			if (!entry || typeof entry.EffectTag !== 'number') {
				continue;
			}

			if (entry.EffectTag & ABILITY_VARIANT_BOT_DATA_EFFECT_TAG_DISPLACEMENT_FLAGS) {
				return true;
			}

			/*
			 * most of the actual immobilzing spells should have been caught before this, through displacement flag or mSpellTags but this seems to be needed to catch ASol R and detect things like Annie R, which match the cc flag but don't have a data value that would be commonly used for cc duration
			 */
			if ((entry.EffectTag & ABILITY_VARIANT_BOT_DATA_EFFECT_TAG_CC_FLAGS)) {
				const durationNames = ['StunDuration', 'RootDuration', 'FearDuration', 'CharmDuration'];
				for (const durationName of durationNames) {
					if (dataValues?.[durationName]) {
						return true;
					}
				}
			}
		}
	}

	return false;
}

/**
 * sets champion ability variants' name and tooltips after their data is already parsed
 * done in a separate step because abilities' text can reference other abilities like `spell.CaitlynW:HeadshotBonusDamage`
 *
 * expects ability variant's text properties to be set to the stringtable keys they're supposed to be under so it doesn't have to go through the raw ability object again, as in
 * ```json
 * "name": "Spell_CaitlynP_Name",
 * "tooltip": "Spell_CaitlynP_Tooltip",
 * "tooltipExtended": "Spell_CaitlynP_TooltipExtended",
 * ```
 */
function setChampionAbilityVariantsText(champion: IChampion) {
	let filteredAbilitiesWithVariants = Object.entries(champion.abilities);
	if (champion.id === 'Aphelios') {
		filteredAbilitiesWithVariants = filteredAbilitiesWithVariants.filter(([abilityName]) => abilityName !== 'w');
	}

	const abilitiesWithVariants = filteredAbilitiesWithVariants.map(([abilityName, abilityData]) => [abilityName, abilityData.variants]) as [IChampionAbilityKey, IChampionAbility['variants']][];

	const allVariants = abilitiesWithVariants.flatMap(([abilityKey, variants]) => variants.map(variant => [variant, abilityKey] as [IChampionAbilityVariant, IChampionAbilityKey]));

	for (const [abilityKey, variants] of abilitiesWithVariants) {
		for (let i = 0; i < variants.length; i++) {
			const variant = variants[i]!;
			const debugPrefix = `${champion.id} ${abilityKey}[${i}]`;
			const variableDebug = {
				category: 'champion',
				variables: {
					variableType: 'championAbility',
					variableValueParameters: {
						abilityVariant: variant,
						allAbilitiesVariants: allVariants,
						dynamicVariables: championAbilityDynamicVariables((CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[champion.id], abilityKey),
					},
					variableSourceKeys: ['effectAmount'],
				},
				stringtableVariableSaveUnder: champion,
			} satisfies Omit<IStringtableVariableDebug, 'key'>;

			const variantTooltipStringtableKey = variant.tooltip;
			const lowercaseVariantTooltipStringtableKey = variantTooltipStringtableKey?.toLowerCase();

			variant.name = variant.name && getStringtableValue(variant.name, { ...variableDebug, key: `${debugPrefix} ${variant.objectName} name` })!;
			variant.name = transformAbilityText(variant.name);
			// TODO debug tooltips for all abilities, not just passive
			variant.tooltip = variant.tooltip && getStringtableValue(
				variant.tooltip,
				abilityKey === 'passive'
					? {
							...variableDebug,
							key: `${debugPrefix} ${variant.objectName} tooltip`,
						}
					: `${variant.dataKey} tooltip`,
			);
			variant.tooltip &&= transformAbilityText(variant.tooltip);
			variant.tooltipExtended = variant.tooltipExtended && getStringtableValue(
				variant.tooltipExtended,
				abilityKey === 'passive' ? { ...variableDebug, key: `${debugPrefix} ${variant.objectName} tooltip extended` } : `${variant.dataKey} tooltip extended`,
			);
			variant.tooltipExtended &&= transformAbilityText(variant.tooltipExtended);
			variant.tooltipExtendedBelowLine = variant.tooltipExtendedBelowLine && getStringtableValue(
				variant.tooltipExtendedBelowLine,
				{ ...variableDebug, key: `${debugPrefix} ${variant.dataKey} tooltip extended below line` },
			);
			variant.tooltipExtendedBelowLine &&= transformAbilityText(variant.tooltipExtendedBelowLine);

			for (const extendedVariable of variant.extendedVariables || []) {
				if (extendedVariable.nameOverride) {
					(champion.stringtable as any)[extendedVariable.nameOverride] = getStringtableValue(extendedVariable.nameOverride, abilityKey === 'passive' ? { ...variableDebug, key: `${debugPrefix} extendedVariables` } : `${debugPrefix} extendedVariables`);
				}
			}

			/* many extended tooltips reuse the regular version so save on data by replacing them with something akin to `{{self}}` */
			if (lowercaseVariantTooltipStringtableKey && (lowercaseVariantTooltipStringtableKey in champion.stringtable)) {
				champion.stringtable[lowercaseVariantTooltipStringtableKey] = variant.tooltip!;
				variant.tooltip = `{{${variantTooltipStringtableKey}}}`;
			}

			if (!variant.name) {
				throw new Error(`${debugPrefix} variant has no name`);
			}
		}
	}
}

function transformAbilityText(value: string) {
	if (value) {
		const liIndex = value.lastIndexOf('<li>');
		if (~liIndex) {
			const brIndex = value.indexOf('<br>', liIndex + 4);
			if (~brIndex && !value.slice(0, brIndex).endsWith('</li>')) {
				value = `${value.slice(0, brIndex)}</li>${value.slice(brIndex)}`;
			}
		}

		value = trimBr(value);
	}

	return value.replace('<rules><br>', '<rules>');
}

function extractEffectDescription(description: string) {
	const startIndex = description.indexOf('<mainText>');
	const endIndex = description.indexOf('</mainText>');
	if (~startIndex && ~endIndex) {
		return description.slice(startIndex + 10, endIndex);
	}
	return description;
}

function getUnknownTags(text: string): Set<string> {
	const tags = text.replaceAll('<br>', '').matchAll(/<\s*([a-z][\w-]*)\b[^>]*>/gi);
	return new Set(Array.from(tags, m => m[1]!.toLocaleLowerCase()).filter(tag => !KNOWN_GAME_DESCRIPTION_TAGS.includes(tag)));
}

function formatNumber(n: number): number {
	return Number(n.toPrecision(7));
}

function cleanupObject(obj?: object, removeType = false): any {
	const type = typeof obj;
	if (!obj || type !== 'object') {
		return type === 'number' ? formatNumber(obj as unknown as number) : obj;
	}

	let entries = Object.entries(obj).filter(([, value]) => !isEmptyObject(value));
	if (removeType) {
		entries = entries.filter(([key]) => key !== '__type');
	} else {
		entries = entries.filter(([key, value]) => key !== '__type' || ![
			'GameCalculation',
			'Breakpoint',
			'{e9a3c91d}', /* ranged multiplier */
			'{4750ceb6}', /* melee ranged result */
		].includes(value));
	}

	if (entries.length === 1 && entries[0]![0] === 'value') {
		return entries[0]![1].map((v: unknown) => typeof v === 'number' ? formatNumber(v) : v);
	}

	return Object.fromEntries(entries.map(([key, value]) =>
		[key, typeof value === 'object'
			? Array.isArray(value)
				? value.map(v => cleanupObject(v, removeType))
				: cleanupObject(value, removeType)
			: typeof value === 'number'
				? formatNumber(value)
				: value],
	),
	);
}

function isEmptyObject(obj: unknown): boolean {
	if (typeof obj !== 'object') {
		return false;
	}

	if (obj === null) {
		return true;
	}

	if (Array.isArray(obj)) {
		return obj.every(v => isEmptyObject(v));
	}

	const values = Object.values(obj as Record<string, unknown>);
	return (values.length === 1 && '__type' in obj) || values.every(v => isEmptyObject(v));
}

async function fetchCached(url: string, filename: string, responseMethod: 'text' | 'json' | 'arrayBuffer' = 'json') {
	if (cacheHits[filename]) {
		return cacheHits[filename];
	}

	const cacheFilePath = path.join(import.meta.dirname, `.cache/${minorVersion}/${filename}`);
	let data;
	try {
		await fs.access(cacheFilePath);
		data = await fs.readFile(cacheFilePath);
		data = responseMethod === 'text'
			? data.toString('utf8')
			: responseMethod === 'json'
				? JSON.parse(data.toString('utf8'))
				: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
	} catch {};
	if (!data || (typeof data === 'object' && !Object.keys(data).length)) {
		data = await fetch(url).then(r => r[responseMethod]()).catch((err) => {
			console.log(`[fetchCached] ${url} ${responseMethod}`);
			throw err;
		});
		await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
		await fs.writeFile(cacheFilePath, responseMethod === 'json' ? stringifyObject(data) : responseMethod === 'arrayBuffer' ? buffer.Buffer.from(data) : data);
	}
	cacheHits[filename] = data;
	return data;
}

/** like JSON.stringify but formats `number[]` into single line */
function stringifyObject(obj: object) {
	const json = JSON.stringify(obj, (_k, v) =>
		Array.isArray(v) && v.every(item => typeof item === 'number')
			? `__ARRAY__[${v.join(', ')}]__ARRAY__`
			: v, '\t');

	return json.replace(/"__ARRAY__(.*?)__ARRAY__"/g, '$1');
}

/** goes through all of the `properties` in the given object deeply, then replaces any values matching `searchValue` with `replaceValue` */
function objectReplaceAllEncounteredValues(object: any, keys: string[], searchValue: string, replaceValue: string): boolean {
	let anyReplaced = false;

	function deepReplace(obj: any): void {
		if (obj === null || typeof obj !== 'object') {
			return;
		}
		for (const key of Object.keys(obj)) {
			if (obj[key] === searchValue) {
				obj[key] = replaceValue;
				anyReplaced = true;
			} else {
				deepReplace(obj[key]);
			}
		}
	}

	for (const key of keys) {
		deepReplace(object[key]);
	}

	return anyReplaced;
}

function hashFnv1a(value: string): string {
	const bits = 32;
	const rv = fnv1a(value.toLowerCase(), { size: bits }).toString(16);
	return `{${rv.padStart(bits / 4, '0')}}`;
}

/* 38 bits according to testing and https://github.com/CommunityDragon/CDTB/blob/1826df05b502190a49fc77a21d29543a5727d484/cdtb/rstfile.py#L78 */
function hashXxh3(variable: string, bits = 38) {
	const hash = xxh3.Xxh3.withSeed(0n).update(variable.toLowerCase()).digest();

	const mask = (1n << BigInt(bits)) - 1n;
	const value = hash & mask;

	const hexLen = Math.ceil(bits / 4);
	return `{${value.toString(16).padStart(hexLen, '0')}}`;
}
