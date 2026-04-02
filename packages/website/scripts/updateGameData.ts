import type { IChampion, IChampionAbility, IChampionAbilityKey, IChampionAbilityVariant, IListedChampion } from '../app/composables/useChampions';
import type { IItem, IItemCategory, IItemShopStatFilter } from '../app/composables/useItems';
import type { IDragonName } from '../app/composables/useMisc';
import type { IGameVariableType, IGameVariableValueParameters } from '../app/utils/gameVariable';
import type { IPossibleDynamicValues, ITexture, IWithPossibleDynamicValues } from '../app/utils/types';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import fnv1a from '@sindresorhus/fnv1a';
import { imageSize } from 'image-size';
import { useMaps } from '../app/composables/useMaps.ts';
import { CHAMPION_SPECIFICS } from '../app/utils/champion.ts';
import { KNOWN_GAME_DESCRIPTION_TAGS, replaceGameDescriptionStringtableVariables } from '../app/utils/gameStringtable.ts';
import { replaceGameDescriptionVariables } from '../app/utils/gameVariable.ts';
import { ITEM_STAT_META } from '../app/utils/item.ts';
import { RUNE_SPECIFICS } from '../app/utils/rune.ts';

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
	misc: { variables: new Map(), stringtableVariables: new Map(), tags: [[], new Set()] } as IDebugCategory,
};

const textFilePath = `${import.meta.dirname}/../app/assets/text.json`;
let textData = {
	version: latestVersion,
	data: {
		items: {},
		runes: {
			paths: {},
		},
		stringtable: {},
	},
} as typeof import('../app/assets/text.json');

try {
	await fs.access(textFilePath);
	textData = JSON.parse(await fs.readFile(textFilePath, 'utf8'));
	textData.data.stringtable ||= {} as any;
} catch {}

const championFilePath = `${import.meta.dirname}/../app/assets/champion.json`;
let championData: typeof import('../app/assets/champion.json') | undefined;

try {
	await fs.access(championFilePath);
	championData = JSON.parse(await fs.readFile(championFilePath, 'utf8'));
} catch {}

if (!championData || championData?.version !== latestVersion) {
	console.log('champion data not present or outdated, fetching...');

	await loadStringTable();
	const { version, data } = await fetchCached(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`, 'ddragon/champion.json');

	const TargetDummy: IChampion = {
		version,
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
						image: 'assets/characters/ha_%s1minionmelee/hud/%s2melee_square.png',
						tooltip: 'Does nothing',
						cooldownTime: [1, 1, 1, 1, 1, 1, 1],
						dataKey: 'TargetDummy/Q',
					},
				],
			},
			w: {
				maxLevel: 1,
				variants: [
					{
						name: 'Target Dummy W',
						objectName: 'TargetDummyW',
						image: 'assets/characters/ha_%s1minionranged/hud/%s2range_square.png',
						tooltip: 'Does nothing',
						cooldownTime: [1, 1, 1, 1, 1, 1, 1],
						dataKey: 'TargetDummy/W',
					},
				],
			},
			e: {
				maxLevel: 1,
				variants: [
					{
						name: 'Target Dummy E',
						objectName: 'TargetDummyE',
						image: 'assets/characters/ha_%s1minionsiege/hud/%s2mechcannon_square.png',
						tooltip: 'Does nothing',
						cooldownTime: [1, 1, 1, 1, 1, 1, 1],
						dataKey: 'TargetDummy/E',
					},
				],
			},
			r: {
				maxLevel: 1,
				variants: [
					{
						name: 'Target Dummy R',
						objectName: 'TargetDummyR',
						image: 'assets/characters/ha_%s1minionsuper/hud/%s2mechmelee_square.png',
						tooltip: 'Does nothing',
						cooldownTime: [1, 1, 1, 1, 1, 1, 1],
						dataKey: 'TargetDummy/R',
					},
				],
			},
			passive: {
				maxLevel: 0,
				variants: [
					{
						name: 'Target Dummy Passive',
						objectName: 'TargetDummyPassive',
						image: 'assets/characters/nexus/hud/nexus_%s2_square.png',
						tooltip: 'Does nothing',
						dataKey: 'TargetDummy/Passive',
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
			await Promise.all((Object.entries(data) as [string, (IChampion & { image: string })][])
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

					const { attackSpeedRatio } = rootData;

					stats.attackspeedratio = formatNumber(attackSpeedRatio, 3);

					const dedicatedChampionFilePath = `${import.meta.dirname}/../public/data/champion/${id}.json`;
					const championFileDataStringtable: IChampion['stringtable'] = {};

					const dedicatedChampionFileData: IChampion = {
						version: latestVersion,
						id,
						key,
						name,
						partype,
						stats,
						abilities: Object.fromEntries(['q', 'w', 'e', 'r', 'passive'].map((abilityName, index) => {
							const { maxLevel, variants } = championAbilityData(
								[abilityName, index],
								championId,
								additionalData,
								characterRootKey,
							);

							return [abilityName, {
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

	await fs.writeFile(`${import.meta.dirname}/../public/data/champion/${TargetDummy.id}.json`, stringifyObject(TargetDummy));

	await fs.writeFile(championFilePath, stringifyObject(championData));
	await fs.writeFile(textFilePath, stringifyObject(textData));
}

const itemFilePath = `${import.meta.dirname}/../app/assets/item.json`;
let itemData: typeof import('../app/assets/item.json') | undefined;

try {
	await fs.access(itemFilePath);
	itemData = JSON.parse(await fs.readFile(itemFilePath, 'utf8'));
} catch {}

if (!itemData || itemData?.version !== latestVersion || !textData.data.items) {
	console.log('item data not present or outdated, fetching...');

	await loadStringTable();
	const { version, data } = await fetchCached(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`, 'ddragon/item.json');

	const UNPURCHASABLES_TO_KEEP = [
		'2422', // slightly magical footwear
		'3040',	// seraph's embrace
		'3042',	// muramana
		'3121', // fimbulwinter
	];

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
	];

	const MAPS = useMaps();

	const filteredItems = Object.entries(data)
		.filter(([itemId, itemData]) => {
			const { maps: { 11: sr, 12: ha }, requiredChampion, gold } = itemData as {
				maps: Record<number, boolean>;
				requiredChampion?: boolean;
				gold: { purchasable: boolean; inStore?: boolean; hideFromAll?: boolean };
			};

			return !UNINTERESTING_ITEMS.includes(itemId)
				&& (sr || ha)
				&& itemId.length <= 4
				&& gold.inStore !== false
				&& gold.hideFromAll !== false
				&& !requiredChampion
				&& (gold.purchasable || UNPURCHASABLES_TO_KEEP.includes(itemId));
		});

	const filteredItemIds = filteredItems.map(([itemId]) => itemId);

	itemData = {
		version,
		data: Object.fromEntries(
			filteredItems.map(([itemId, itemData]) => {
				const { name, stats, gold, image, into: rawInto, from: rawFrom, tags, maps: { 11: sr, 12: ha } } = itemData as any;

				let mapMask = 0;
				/* aram guardian items, seem to have been added to sr with swiftplay */
				if (sr && !['2051', '3112', '3177', '3184'].includes(itemId)) {
					mapMask |= MAPS.sr.mask;
				}
				if (ha) {
					mapMask |= MAPS.ha.mask;
				}

				const searchTerms = Array.from(
					new Set(`${name};${
						(stringtable[`generatedtip_item_${itemId}_colloquialism`] || ';')
					};${
						tags.join(';').replace('NonbootsMovement', 'movement').replace('SpellBlock', 'magic resist').replace('Lane', '')
					};${
						Object.keys(stats).map(stat => ITEM_STAT_META[stat as keyof typeof ITEM_STAT_META]!.name).join(';')
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
					stats,
					gold: {
						total: gold.total,
						sell: gold.sell,
					},
					image: image.full,
					mapMask,
					into,
					from,
					...(tags.includes('Boots') ? { isBoots: true } : undefined),
					...(tags.includes('OnHit') ? { isOnHit: true } : undefined),
				}];
			}),
		) as unknown as NonNullable<typeof itemData>['data'],
	};

	const moreItemData = await fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/items.cdtb.bin.json`, 'game/items.cdtb.bin.json');

	const SPECIAL_EPICNESS_ITEMS: Record<string, number> = {
		3869: 7,	// celestial opposition
		3870: 7,	// dream maker
		3871: 7,	// zaz'zak's realmspike
		3876: 7,	// solstice sleigh
		3877: 7,	// bloodsong
	};

	textData.data.items = {} as any;

	for (const [itemId, item] of Object.entries(itemData.data as unknown as Record<string, IItem>)) {
		const itemMoreData = moreItemData[`Items/${itemId}`];

		if (!itemMoreData) {
			console.warn(`haven't found more data for ${item.name} (${itemId})`);
			continue;
		}

		/*
		 * `mShopTooltip` looks like `generatedtip_item_3170_tooltipshop`
		 * `mDynamicTooltip` looks like `generatedtip_item_3161_tooltipinventory`
		 * `keyTooltipExtendedRules` looks like `item_1054_tooltipextendedrules`
		 */
		updateItemShopItemTooltipText(item, itemMoreData.mItemDataClient.mShopTooltip, itemMoreData.mItemDataClient.mDynamicTooltip, itemMoreData.mItemDataClient.mTooltipData?.mLocKeys?.keyTooltipExtendedRules);

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

		const itemGroups = itemMoreData.mItemGroups.filter((group: string) => group !== 'Items/ItemGroups/Default');
		if (itemGroups.length) {
			item.itemGroups = itemGroups;
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

		const SPECIAL_CATEGORY_ITEMS: Record<string, IItemCategory[]> = {
			3869: ['support'],	// celestial opposition
			3870: ['support'],	// dream maker
			3871: ['support'],	// zaz'zak's realmspike
			3876: ['support'],	// solstice sleigh
			3877: ['support'],	// bloodsong
		};

		if (SPECIAL_CATEGORY_ITEMS[itemId]) {
			item.categories = SPECIAL_CATEGORY_ITEMS[itemId].reduce((acc, curr) => ({
				...acc,
				[curr]: true,
			}), {});
			continue;
		}

		const KNOWN_CATEGORYLESS_ITEMS = [
			'3170',	// swiftmarch
			'3171',	// crimson lucidity
			'3172',	// gunmetal greaves
			'3173',	// chainlaced crushers
			'3174',	// armored advance
			'3175',	// spellslinger's shoes
			'3176',	// forever forward
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

	await fs.writeFile(itemFilePath, stringifyObject(itemData));
	await fs.writeFile(textFilePath, stringifyObject(textData));
}

const runeFilePath = `${import.meta.dirname}/../app/assets/rune.json`;
let runeData: typeof import('../app/assets/rune.json') | undefined;

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
						effectAmount: cleanupObject(mScript.mSpellScriptData.mEffectAmount),
					} as any;

					const perkName: string = mPerkName.toLowerCase();

					(textData.data.runes.shards.slotValues as any)[perkName] = {
						name: getStringtableValue(mDisplayNameLocalizationKey, `rune shards ${slotKey} ${perkKey} name`),
						tooltip: getStringtableValue(mShortDescLocalizationKey, { category: 'rune', key: `rune shards ${slotKey} ${perkKey} tooltip`, variableType: 'rune', variableValueParameters: [slotValue], variableSourceKeys: ['effectAmount'] }),
						tooltipStats: getStringtableValue(mTooltipNameLocalizationKey, {
							category: 'rune',
							key: `rune shards ${slotKey} ${perkKey} tooltip stats`,
							variableType: 'rune',
							variableValueParameters: [
								(RUNE_SPECIFICS.shards as IWithPossibleDynamicValues)[perkName]?.POSSIBLE_DYNAMIC_VALUES
									? {
											...slotValue,
											dynamicValues: possibleDynamicValues((RUNE_SPECIFICS.shards as IWithPossibleDynamicValues)[perkName]!.POSSIBLE_DYNAMIC_VALUES),
										}
									: slotValue,
							],
							variableSourceKeys: ['effectAmount'],
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
const miscFilePath = `${import.meta.dirname}/../app/assets/misc.json`;
let miscData: typeof import('../app/assets/misc.json') | undefined;

try {
	await fs.access(miscFilePath);
	miscData = JSON.parse(await fs.readFile(miscFilePath, 'utf8'));
} catch {}

if (!miscData || miscData?.version !== latestVersion) {
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
					? Object.fromEntries(stackDataValues.map(({ mName, mValues }: Record<string, number[]>) =>
							[mName, mValues?.length ? mValues.map(value => formatNumber(value)) : undefined],
						))
					: undefined;

				const { ObjectName: soulObjectName, mSpell: { DataValues: soulDataValues, mSpellCalculations: soulSpellCalculations } } = soulData;
				const parsedSoulDataValues = soulDataValues?.length
					? Object.fromEntries(soulDataValues.map(({ mName, mValues }: Record<string, number[]>) =>
							[mName, mValues?.length ? mValues.map(value => formatNumber(value)) : undefined],
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
		const allSpells = [stackAbility, soulAbility];

		const { mBuff: { mDescription: stackDescriptionKey } } = stackData;
		const { mBuff: { mTooltipData: { mLocKeys: { keyTooltip: soulTooltipKey } } } } = soulData;

		let stack = getStringtableValue(stackDescriptionKey, {
			category: 'misc',
			key: `dragon stack ${name}`,
			variableSourceKeys: ['DataValues'],
			variableType: 'championAbility',
			variableValueParameters: [stackAbility, undefined, allSpells],
		});
		const soul = getStringtableValue(soulTooltipKey, {
			category: 'misc',
			key: `dragon soul ${name}`,
			variableSourceKeys: ['DataValues'],
			variableType: 'championAbility',
			variableValueParameters: [soulAbility, undefined, allSpells],
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

	textData.data.roleQuests = Object.fromEntries(['top', 'jungle', 'mid', 'bot', 'support'].map(role =>
		[role, getStringtableValue(`role_quest_bark_${role}_completed`, `role quest ${role}`)?.split('<br>')],
	)) as NonNullable<(typeof textData)>['data']['roleQuests'];

	await fs.writeFile(miscFilePath, stringifyObject(miscData));
	await fs.writeFile(textFilePath, stringifyObject(textData));
}

const uiFilePath = `${import.meta.dirname}/../app/assets/ui.json`;
let uiData: typeof import('../app/assets/ui.json') | undefined;

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

	const [itemshopUiBase, playerstatsUiBase, dragonUiPrototype] = await Promise.all([
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/itemshop/uibase.cdtb.bin.json`, 'game/clientstates/gameplay/ux/itemshop/uibase.cdtb.bin.json'),
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/lol/playerstats/uibase.cdtb.bin.json`, 'game/clientstates/gameplay/ux/lol/playerstats/uibase.cdtb.bin.json'),
		fetchCached(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/scoreboard/scores_dragon_srx.cdtb.bin.json`, 'game/clientstates/gameplay/ux/scoreboard/scores_dragon_srx.cdtb.bin.json'),
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

				({ width: resWidth, height: resHeight } = imageSize(new Uint8Array(image)));
				autoAtlasImages[atlasPath] = { width: resWidth, height: resHeight };
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
				stats: Object.fromEntries(await Promise.all(([
					['attackDamage', 'PhysicalDmg', 'PhysicalDamage'],
					['crit', 'CritStrike', 'CriticalStrike'],
					['attackSpeed', 'AttackSpeed'],
					['onHit', 'OnHit'],
					['armorPen', 'ArmorPenetration', 'ArmorPen'],
					['abilityPower', 'AbilityPower'],
					['mana', 'Mana'],
					['magicPen', 'MagicPenetration', 'MagicPen'],
					['health', 'Health'],
					['magicResist', 'MagicResist'],
					['armor', 'Armor'],
					['abilityHaste', 'AbilityHaste'],
					['movement', 'Movespeed'],
					['vamp', 'Vamp'],
				] satisfies ([IItemShopStatFilter, string] | [IItemShopStatFilter, string, string])[]).map(
					async ([itemCategory, dataPath1, dataPath2]) => {
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
					soulInactive: await getTexture(dragonUiPrototype[`ClientStates/Gameplay/UX/Scoreboard/Scores_Dragon_SRX/SB_MD_CSrceKnwn_${name}Icon`], `dragon soul inactive ${name}`),
					soulActive: await getTexture(dragonUiPrototype[`ClientStates/Gameplay/UX/Scoreboard/Scores_Dragon_SRX/SB_MD_CSrceAct_${name}Icon`], `dragon soul active ${name}`),
				}];
			}))),
		} as unknown as NonNullable<(typeof uiData)>['data'],
	};

	await fs.writeFile(uiFilePath, stringifyObject(uiData));
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

function itemDescriptionExtras(text: string, extrasStart: string): string[][] | undefined {
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
	const rawExtra = extraToEnd.slice(0, extraEndIndex).replace(/\{\{ ?Item_Passive_List ?\}\}/g, '').replaceAll(':</passive>', '</passive>');

	const extra = rawExtra ? rawExtra.split('<br><br>').map(text => text.split('<br>')).filter(text => text.some(Boolean)) : undefined;
	for (let i = 0; i < (extra?.length || 0); i++) {
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

function updateItemShopItemTooltipText(item: IItem, mShopTooltip: string, mDynamicTooltip: string, keyTooltipExtendedRules?: string) {
	// TODO add debug
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

	const tooltipShop = itemDescriptionExtras(textShop, '</section><section>');
	let tooltipInventory = textInventory ? itemDescriptionExtras(textInventory, '<mainText><section>') : undefined;

	if (tooltipShop && tooltipInventory?.every((extra, extraIndex) => extra.every((line, lineIndex) =>
		tooltipShop[extraIndex]?.[lineIndex] === line,
	))) {
		tooltipInventory = undefined;
	}

	let rules = keyTooltipExtendedRules && getStringtableValue(keyTooltipExtendedRules, 'item tooltip extendedRules', true);
	while (rules?.startsWith('<br>')) {
		rules = rules.slice(4).trim();
	}
	while (rules?.endsWith('<br>')) {
		rules = rules.slice(0, -4).trim();
	}

	if (subtitleLeft.length || subtitleRight.length || tooltipShop?.length || tooltipInventory?.length || rules?.length) {
		(textData.data.items as any)[item.id] = {
			subtitleLeft: subtitleLeft || undefined,
			subtitleRight: subtitleRight || undefined,
			rules: rules || undefined,
			tooltipShop,
			tooltipInventory,
		};
	}
}

function createRuneSlotData(dataKey: string, data: any) {
	const { mPerkId, mPerkName, mScript: { mSpellScriptData }, mDisplayNameLocalizationKey, mTooltipNameLocalizationKey, mShortDescLocalizationKey, mLongDescLocalizationKey, mIconTextureName } = data;

	const value = {
		id: mPerkId,
		name: mPerkName,
		icon: mIconTextureName.toLowerCase().replace('.tex', '.png'),
		dataKey,
		calculations: cleanupObject(mSpellScriptData.mCalculations),
		effectAmount: cleanupObject(mSpellScriptData.mEffectAmount),
	};

	const variableDebug = { category: 'rune' as const, variableType: 'rune', variableValueParameters: [value], variableSourceKeys: ['calculations', 'effectAmount'] } satisfies Omit<IStringtableVariableDebug, 'key'>;

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

type IStringtableVariableDebug = IBaseStringtableVariableDebug<'item', IGameVariableValueParameters['item']>
	| IBaseStringtableVariableDebug<'rune', IGameVariableValueParameters['rune']>
	| IBaseStringtableVariableDebug<'championAbility', IGameVariableValueParameters['championAbility']>;

interface IBaseStringtableVariableDebug<T extends IGameVariableType, P extends IGameVariableValueParameters[T]> {
	category: keyof typeof debug;
	/** identifier of the variable, like rune-X-tooltipShort */
	key: string;
	/** type of the game variable being resolved */
	variableType: T;
	/** parameters of the function used for resolving game variables */
	variableValueParameters: P;
	/** the keys under which variables can be found on the target of the replacement. They will be used to replace recognized variables with their resolved names if they are hashed */
	variableSourceKeys: string[];
	/** the object under which to save the stringtable variables. `textData` by default */
	stringtableVariableSaveUnder?: { stringtable?: Record<string, string> };
}

function getStringtableValue(path: string, variableDebug: string | IStringtableVariableDebug, optional?: boolean) {
	const value = stringtable[path.toLowerCase()];
	if (!optional && !value) {
		console.warn(`[${typeof variableDebug === 'string' ? variableDebug : variableDebug.key}] string "${path.toLowerCase()}" not found in the stringtable`);
	}
	if (value && typeof variableDebug === 'object') {
		const { category, key, stringtableVariableSaveUnder, variableType, variableValueParameters, variableSourceKeys } = variableDebug;

		const { replaced: stringtableReplaced, stringtableVariables, unknownStringtableVariables } = replaceGameDescriptionStringtableVariables(value, stringtable, (variableValueParameters[0] as any)?.dynamicValues, false);

		if (stringtableVariables.size && stringtableVariableSaveUnder) {
			stringtableVariableSaveUnder.stringtable ||= {};
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
			debug[category].stringtableVariables.set(key, unknownStringtableVariables);
		}

		const variableSource = variableValueParameters[0];

		const { unknownVariables } = replaceGameDescriptionVariables(stringtableReplaced, variableType as any, variableValueParameters as any);

		outer: for (let i = unknownVariables.length - 1; i >= 0; i--) {
			const variableName = unknownVariables[i]![1] || unknownVariables[i]![0];
			const hash = hashRuneVariable(variableName);
			for (const sourceKey of variableSourceKeys as (keyof typeof variableSource)[]) {
				let rename: [from: string, to: string] | undefined;

				if (variableSource[sourceKey]?.[hash]) {
					rename = [hash, variableName];
				}

				// TODO not sure if legal for variables other than the rune ones, they might be case sensitive
				if (!rename) {
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
					continue outer;
				}
			}
		}
		if (unknownVariables.length) {
			debug[category].variables.set(key, unknownVariables.map(v => v[0]));
		}
		const unknownTags = getUnknownTags(value);
		if (unknownTags.size) {
			debug[category].tags[0].push(key);
			debug[category].tags[1] = debug[category].tags[1].union(unknownTags);
		}
	}
	return value;
}

function possibleDynamicValues(value?: IPossibleDynamicValues, abilityKey?: Exclude<keyof IPossibleDynamicValues, 'all'>) {
	return value && (abilityKey ? { ...value.all, ...value[abilityKey] } : value.all);
}

function championAbilityData(
	/** abilityName - q-w-e-r-passive, abilityIndex 0-1-2-3-4 corresponding to abilityName */
	abilityInfo: [string, number],
	championId: string,
	championData: any,
	characterRootKey: string,
): IChampionAbility {
	const { mCharacterPassiveSpell, spells, spellLevelUpInfo, characterToolData } = championData[characterRootKey];
	const abilityDataKey = abilityInfo[1] === 4 ? mCharacterPassiveSpell : spells[abilityInfo[1]];

	const variantKeys = [abilityDataKey];

	if (abilityInfo[1] !== 4 && characterToolData?.alternateForms?.length) {
		const championDataEntries = Object.entries(championData);
		for (const form of characterToolData.alternateForms) {
			if (form.spells) {
				const maybeKey = championDataEntries.find(([,value]: any[]) => value.ObjectName === form.spells[abilityInfo[1]])?.[0];
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
		maxLevel = spellLevelUpInfo[abilityInfo[1]].mRequirements.length;
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
						image: '',
						imageAlt: '',
						[key]: image,
						tooltip: undefined,
						tooltipExtended: undefined,
						tooltipExtendedBelowLine: undefined,
						dataKey: abilityData.mRootSpell,
					} as typeof variants[number]);
				}
			}

			variants.sort((a, b) => {
				const weaponA = a.image.slice(a.image.lastIndexOf('/') + 1, -6);
				const weaponB = b.image.slice(b.image.lastIndexOf('/') + 1, -6);

				const indexA = (CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP as Record<string, number>)[weaponA] ?? Infinity;
				const indexB = (CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP as Record<string, number>)[weaponB] ?? Infinity;

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
}

function championAbilityVariants(
	championId: string,
	championData: any,
	[abilityName]: [string, number],
	variantKeys: string[],
): [number | undefined, IChampionAbility['variants']] {
	let maxLevel: number | undefined;
	const variants: IChampionAbility['variants'] = [];

	for (let i = 0; i < variantKeys.length; i++) {
		const debugPrefix = `${championId} ${abilityName}[${i}]`;
		const variantDataKey = variantKeys[i];
		const variantData = championData[variantDataKey!];
		const variantMSpell = variantData?.mSpell;
		if (!variantData || !variantMSpell) {
			throw new Error(`${debugPrefix} with key "${variantDataKey}" not found in championData`);
		}

		const { mImgIconName, DataValues, mSpellCalculations, mEffectAmount, mClientData, mana, cooldownTime } = variantMSpell;

		if (i === 0) {
			if (!mClientData) {
				throw new Error(`${debugPrefix} expected mClientData in variant "${variantDataKey}"`);
			}
			if (!mImgIconName) {
				throw new Error(`${debugPrefix} expected mImgIconName in variant "${variantDataKey}"`);
			}
			if (!mClientData.mTooltipData) {
				throw new Error(`${debugPrefix} expected mTooltipData in variant "${variantDataKey}"`);
			}

			maxLevel = abilityName === 'passive' ? 0 : mClientData.mTooltipData.mLists?.LevelUp?.levelCount;
		}

		let mLocKeys;
		if (mClientData.mUseTooltipFromAnotherSpell) {
			const tooltipSourceSpell = championData[mClientData.mUseTooltipFromAnotherSpell];
			if (tooltipSourceSpell?.mSpell?.mClientData) {
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
			image: mImgIconName[0].toLowerCase().replace('.dds', '.png'),
			tooltip: undefined,
			tooltipExtended: undefined,
			tooltipExtendedBelowLine: undefined,
			extendedVariables: mClientData.mTooltipData?.mLists?.LevelUp?.Elements
				?.filter((variable: any) => variable.type !== 'Cooldown')
				.map((variable: any) => {
					const { type, typeIndex } = variable;
					if (!type) {
						console.warn(`${debugPrefix} extended variable no type`, variable);
					}

					// TODO maybe save `.multiplier` not sure if needed since it extracts from calculated variables that should handle that?
					return {
						type: type.replace('%d', typeIndex),
						nameOverride: variable.nameOverride?.toLowerCase(),
					};
				}),
			mana,
			cooldownTime: cooldownTime && cooldownTime.map((v: number) => formatNumber(v)),
			dataValues: DataValues?.length
				? Object.fromEntries(DataValues.map(({ mName, mValues }: Record<string, number[]>) =>
						[mName, mValues?.length ? mValues.map(value => formatNumber(value)) : undefined],
					))
				: undefined,
			spellCalculations: cleanupObject(mSpellCalculations),
			effectAmount: cleanupObject(mEffectAmount),
			dataKey: variantDataKey,
		} as IChampionAbilityVariant;

		/* these are later set to proper stringtable values in `setChampionAbilityVariantsText` */
		variant.name = mLocKeys.keyName;
		variant.tooltip = mLocKeys.keyTooltip;
		variant.tooltipExtended = mLocKeys.keyTooltipExtended;
		// TODO should be done for all abilities
		if (abilityName === 'passive') {
			variant.tooltipExtendedBelowLine = mLocKeys.keyTooltipExtendedBelowLine;
		}

		variants.push(variant);
	}

	variants.sort((a, b) => {
		const weaponA = a.image.slice(a.image.lastIndexOf('/') + 3, -4);
		const weaponB = b.image.slice(b.image.lastIndexOf('/') + 3, -4);

		const indexA = (CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP as Record<string, number>)[weaponA] ?? Infinity;
		const indexB = (CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP as Record<string, number>)[weaponB] ?? Infinity;

		return indexA - indexB;
	});

	return [maxLevel, variants];
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

	const allVariants = abilitiesWithVariants.flatMap(([, variants]) => variants);

	for (const [abilityName, variants] of abilitiesWithVariants) {
		for (let i = 0; i < variants.length; i++) {
			const variant = variants[i]!;
			const debugPrefix = `${champion.id} ${abilityName}[${i}]`;
			const variableDebug = {
				category: 'champion',
				variableType: 'championAbility',
				variableValueParameters: [{
					...variant,
					dynamicValues: {
						...variant.dataValues,
						...possibleDynamicValues((CHAMPION_SPECIFICS as IWithPossibleDynamicValues)[champion.id]?.POSSIBLE_DYNAMIC_VALUES, abilityName),
					},
				}, undefined, allVariants],
				variableSourceKeys: ['effectAmount'],
				stringtableVariableSaveUnder: champion,
			} satisfies Omit<IStringtableVariableDebug, 'key'>;

			const variantTooltipStringtableKey = variant.tooltip;

			variant.name = variant.name && getStringtableValue(variant.name, { ...variableDebug, key: `${debugPrefix} ${variant.objectName} name` })!;
			// TODO debug tooltips for all abilities, not just passive
			variant.tooltip = variant.tooltip && getStringtableValue(
				variant.tooltip,
				abilityName === 'passive' ? { ...variableDebug, key: `${debugPrefix} ${variant.objectName} tooltip` } : `${variant.dataKey} tooltip`,
			);
			variant.tooltipExtended = variant.tooltipExtended && getStringtableValue(
				variant.tooltipExtended,
				abilityName === 'passive' ? { ...variableDebug, key: `${debugPrefix} ${variant.objectName} tooltip extended` } : `${variant.dataKey} tooltip extended`,
			);
			// TODO TMP some abilities have it but found in stringtable, they're probably hashed so uncomment it when hashed versions are tried and resolved
			if (abilityName === 'passive') {
				variant.tooltipExtendedBelowLine = variant.tooltipExtendedBelowLine && getStringtableValue(
					variant.tooltipExtendedBelowLine,
					{ ...variableDebug, key: `${debugPrefix} ${variant.dataKey} tooltip extended below line` },
				);
			}

			for (const extendedVariable of variant.extendedVariables || []) {
				if (extendedVariable.nameOverride) {
					(champion.stringtable as any)[extendedVariable.nameOverride] = getStringtableValue(extendedVariable.nameOverride, abilityName === 'passive' ? { ...variableDebug, key: `${debugPrefix} extendedVariables` } : `${debugPrefix} extendedVariables`);
				}
			}

			/* many extended tooltips reuse the regular version so save on data by replacing them with something akin to `{{self}}` */
			if (variantTooltipStringtableKey && (variantTooltipStringtableKey.toLowerCase() in champion.stringtable)) {
				variant.tooltip = `{{${variantTooltipStringtableKey}}}`;
			}

			if (!variant.name) {
				throw new Error(`${debugPrefix} variant has no name`);
			}
		}
	}
}

function getUnknownTags(text: string): Set<string> {
	const tags = text.replaceAll('<br>', '').matchAll(/<\s*([a-z][\w-]*)\b[^>]*>/gi);
	return new Set(Array.from(tags, m => m[1]!.toLocaleLowerCase()).filter(tag => !KNOWN_GAME_DESCRIPTION_TAGS.includes(tag)));
}

function formatNumber(n: number, precision = 3): number {
	return Number.isInteger(n) ? n : Number(n.toFixed(precision));
}

function cleanupObject(obj?: object, removeType = true): any {
	const type = typeof obj;
	if (!obj || type !== 'object') {
		return type === 'number' ? formatNumber(obj as unknown as number) : obj;
	}

	let entries = Object.entries(obj).filter(([, value]) => !isEmptyObject(value));
	if (removeType) {
		entries = entries.filter(([key]) => key !== '__type');
	}

	if (entries.length === 1 && entries[0]![0] === 'value') {
		return entries[0]![1].map((v: unknown) => typeof v === 'number' ? formatNumber(v) : v);
	}

	return Object.fromEntries(entries.map(([key, value]) =>
		[key, typeof value === 'object'
			? Array.isArray(value)
				? value.map(v => cleanupObject(v, key !== 'mFormulaParts'))
				: cleanupObject(value)
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

	const cacheFilePath = `${import.meta.dirname}/.cache/${minorVersion}/${filename}`;
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
	if (!data) {
		data = await fetch(url).then(r => r[responseMethod]()).catch((err) => {
			console.log(`[fetchCached] ${url} ${responseMethod}`);
			throw err;
		});
		await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
		await fs.writeFile(cacheFilePath, responseMethod === 'json' ? stringifyObject(data) : data);
	}
	cacheHits[filename] = data;
	return data;
}

function stringifyObject(obj: object) {
	const json = JSON.stringify(obj, (_k, v) =>
		Array.isArray(v) && v.every(item => typeof item === 'number')
			? `__ARRAY__[${v.join(', ')}]__ARRAY__`
			: v, '\t');

	return json.replace(/"__ARRAY__(.*?)__ARRAY__"/g, '$1');
}

function hashRuneVariable(variable: string) {
	const value = fnv1a(variable.toLowerCase(), { size: 32 });
	return `{${value.toString(16)}}`;
}

// TODO champion variables hash resolving possibly
// import { xxh3 } from '@node-rs/xxhash';
// function hashVariableName(variable: string, bits = 32) {
// 	const hash = xxh3.Xxh3.withSeed(0n).update(variable.toLowerCase()).digest();
//
// 	const mask = (1n << BigInt(bits)) - 1n;
// 	const value = hash & mask;
//
// 	const hexLen = bits / 4;
// 	return `{${value.toString(16).padStart(hexLen, '0')}}`;
// }
