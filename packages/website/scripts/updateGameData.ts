import type { IChampion } from '../app/composables/useChampions';
import type { IItem, IItemCategory, IItemShopStatFilter } from '../app/composables/useItems';
import type { ITexture } from '../app/composables/useUi';
import type { IGameVariableType } from '../app/utils/gameVariable';
import { useMaps } from '../app/composables/useMaps';
import { KNOWN_GAME_DESCRIPTION_TAGS, replaceGameDescriptionVariables } from '../app/utils/gameVariable';

import { ALL_RUNE_PATHS } from '../app/utils/rune';

const versions: string[] = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(res => res.json());

const [latestVersion] = versions;
const minorVersion = latestVersion.slice(0, latestVersion.lastIndexOf('.'));

console.log('latest version', latestVersion);

let stringtable: Record<string, string>;
let rcpFeLolCollectionsCss: string;

interface IDebugCategory {
	variables: Map<string, string[]>;
	tags: [string[], Set<string>];
}

const debug = {
	item: { variables: new Map(), tags: [[], new Set()] } as IDebugCategory,
	rune: { variables: new Map(), tags: [[], new Set()] } as IDebugCategory,
};

const textFile = Bun.file(`${import.meta.dir}/../app/assets/text.json`);
let textData = {
	version: latestVersion,
	data: {
		items: {},
		runes: {
			paths: {},
		},
	},
} as typeof import('../app/assets/text.json');

if (await textFile.exists()) {
	textData = await textFile.json();
}

const championFile = Bun.file(`${import.meta.dir}/../app/assets/champion.json`);
let championData: typeof import('../app/assets/champion.json') | undefined;

if (await championFile.exists()) {
	championData = await championFile.json();
}

if (!championData || championData?.version !== latestVersion) {
	console.log('champion data not present or outdated, fetching...');

	const { version, data } = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`).then(r => r.json());

	championData = {
		version,
		data: Object.fromEntries(
			await Promise.all((Object.entries(data) as [string, IChampion][])
				.sort(([, champA], [, champB]) => champA.name.localeCompare(champB.name))
				.map(async ([championId, championData]) => {
					const { id, key, name, image, partype, stats } = championData;

					const additionalData = await fetch(`https://raw.communitydragon.org/${minorVersion}/game/data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin.json`).then(r => r.json());

					const characterRecordsKey = id === 'Fiddlesticks' ? 'FiddleSticks' : id;
					if (additionalData[`Characters/${characterRecordsKey}/CharacterRecords/Root`]) {
						stats.attackspeedratio = formatNumber(
							additionalData[`Characters/${characterRecordsKey}/CharacterRecords/Root`].attackSpeedRatio,
							3,
						);
					} else {
						console.error('no additional stat data for', name);
						console.log(Object.keys(additionalData));
					}

					return [championId, {
						id,
						key,
						name,
						partype,
						stats,
						image: (image as unknown as { full: string }).full,
						roles: {},
					}];
				}),
			),
		) as NonNullable<typeof championData>['data'],
	};

	const roleScript = await fetch(`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champion-statistics/global/default/rcp-fe-lol-champion-statistics.js`).then(r => r.text());
	const roleScriptData: Record<'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'SUPPORT', Record<string, number>> = JSON.parse(roleScript.match(/JSON\.parse\('([^']+)'/)?.[1] || '{}');

	const allChampions = Object.values(championData!.data);

	for (const [role, playrates] of Object.entries(roleScriptData)) {
		for (const championKey of Object.keys(playrates)) {
			const champion = allChampions.find(champion => champion.key === championKey);
			(champion!.roles as Record<string, boolean>)[role.toLowerCase()] = true;
		}
	}

	await championFile.write(JSON.stringify(championData, null, '\t'));
}

const itemFile = Bun.file(`${import.meta.dir}/../app/assets/item.json`);
let itemData: typeof import('../app/assets/item.json') | undefined;

if (await itemFile.exists()) {
	itemData = await itemFile.json();
}

if (!itemData || itemData?.version !== latestVersion || !textData.data.items) {
	console.log('item data not present or outdated, fetching...');

	await loadStringTable();
	const { version, data } = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`).then(r => r.json());

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
		'3095', // stormrazor
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
				if (sr) {
					mapMask |= MAPS.sr.mask;
				}
				if (ha) {
					mapMask |= MAPS.ha.mask;
				}

				const searchTerms = Array.from(
					new Set(`${name};${(stringtable[`generatedtip_item_${itemId}_colloquialism`] || ';')};${tags.join(';').replace('NonbootsMovement', 'movement').replace('SpellBlock', 'magic resist').replace('Lane', '')}`
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
					gold,
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

	const moreItemData = await fetch(`https://raw.communitydragon.org/${minorVersion}/game/items.cdtb.bin.json`).then(r => r.json());

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

		updateItemShopItemTooltipText(item, itemMoreData.mItemDataClient.mShopTooltip);

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
		item.effectAmount = itemMoreData.mEffectAmount?.some((amount: number) => amount !== 0) ? itemMoreData.mEffectAmount?.map((amount: number) => formatNumber(amount)) : undefined;

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
				[CATEGORY_NUMBER_TO_NAME[categoryNumber]]: true,
			}), {} as Partial<Record<IItemCategory, boolean>>);
	}

	await itemFile.write(JSON.stringify(itemData, null, '\t'));

	await textFile.write(JSON.stringify(textData, null, '\t'));
}

const runeFile = Bun.file(`${import.meta.dir}/../app/assets/rune.json`);
let runeData: typeof import('../app/assets/rune.json') | undefined;

if (await runeFile.exists()) {
	runeData = await runeFile.json();
}

if (!runeData || runeData?.version !== latestVersion || !textData.data.runes) {
	console.log('rune data not present or outdated, fetching...');

	await loadStringTable();
	await loadRcpFeLolCollectionsCss();
	const data = await fetch(`https://raw.communitydragon.org/${minorVersion}/game/perks.cdtb.bin.json`).then(r => r.json());

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
			paths: Object.fromEntries(ALL_RUNE_PATHS.map((path) => {
				const { mPerkStyleId, mPerkStyleName, mTooltipNameLocalizationKey, mDisplayNameLocalizationKey, mSlots, mIconTextureName } = data[`Perks/Styles/${path}`];

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
					iconColor,
					slots: mSlots.map(({ mPerks }: { mPerks: string[] }) => Object.fromEntries(
						mPerks.map(perk => createRuneSlotData(data[perk])),
					)),
				}];
			})),
			shards: Object.fromEntries(['OffensiveStats', 'FlexStats', 'DefensiveStats'].map((slotKey) => {
				const { mPerks, mSlotLabelKey } = data[`Perks/StatMods/Slots/${slotKey}`];
				slotKey = slotKey.slice(0, -5).toLowerCase();

				(textData.data.runes.shards.slotNames as any)[slotKey] = {
					name: getStringtableValue(mSlotLabelKey, 'rune shards'),
				};

				return [slotKey, Object.fromEntries(mPerks.map((perkKey: string) => {
					const { mPerkId, mPerkName, mDisplayNameLocalizationKey, mShortDescLocalizationKey, mIconTextureName, mScript } = data[perkKey];

					const slotValue = {
						id: mPerkId,
						icon: mIconTextureName.toLowerCase().replace('.tex', '.png'),
						effectAmount: cleanupObject(mScript.mSpellScriptData.mEffectAmount),
					} as any;

					(textData.data.runes.shards.slotValues as any)[mPerkName.toLowerCase()] = {
						name: getStringtableValue(mDisplayNameLocalizationKey, 'rune shards'),
						tooltip: getStringtableValue(mShortDescLocalizationKey, 'rune shards', { category: 'rune', key: slotKey, variableType: 'rune', variableStatSource: slotValue }),
					};

					return [mPerkName.toLowerCase(), slotValue];
				}))];
			})),
		} as unknown as NonNullable<(typeof runeData)>['data'],
	};

	await runeFile.write(JSON.stringify(runeData, null, '\t'));
	await textFile.write(JSON.stringify(textData, null, '\t'));
}

const uiFile = Bun.file(`${import.meta.dir}/../app/assets/ui.json`);
let uiData: typeof import('../app/assets/ui.json') | undefined;

if (await uiFile.exists()) {
	uiData = await uiFile.json();
}

if (!uiData || uiData?.version !== latestVersion) {
	console.log('ui data not present or outdated, fetching...');

	const data = await fetch(`https://raw.communitydragon.org/${minorVersion}/game/clientstates/gameplay/ux/itemshop/uibase.cdtb.bin.json`).then(r => r.json());

	function getTexture(data: any, debug: string) {
		const { TextureData } = data || {};
		if (!TextureData) {
			throw new Error(`Haven't found texture data for: ${debug}`);
		}
		return {
			spriteSheet: TextureData.mTextureName.toLowerCase().replace('.tex', '.png'),
			resWidth: TextureData.mTextureSourceResolutionWidth,
			resHeight: TextureData.mTextureSourceResolutionHeight,
			uv: TextureData.mTextureUV,
		} as ITexture;
	}

	uiData = {
		version: latestVersion,
		data: {
			shop: {
				categories: Object.fromEntries(([
					['all', 'All', 'All'],
					['fighter', 'Attack', 'Atk'],
					['marksman', 'Marksman', 'Mark'],
					['assassin', 'Assassin', 'Ass'],
					['mage', 'Magic', 'Mag'],
					['tank', 'Defense', 'Def'],
					['support', 'Utility', 'Util'],
				] satisfies ([IItemCategory | 'all', string, string])[]).map(
					([itemCategory, dataPath1, dataPath2]) => {
						return [
							itemCategory,
							getTexture(data[`ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/filter/ItemShop_${dataPath1}Button/ItemShop_${dataPath2}Btn_IconDefault`], `category | ${itemCategory} | ${dataPath1} | ${dataPath2}`),
						];
					},
				)),
				stats: Object.fromEntries(([
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
					([itemCategory, dataPath1, dataPath2]) => {
						const { uv: selectedUv } = getTexture(data[`ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/${dataPath1}Btn/${dataPath2 || dataPath1}_Selected`], `stat | ${itemCategory} | ${dataPath1} | ${dataPath2 || dataPath1} selected`);

						return [
							itemCategory,
							{
								default: getTexture(data[`ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/${dataPath1}Btn/${dataPath2 || dataPath1}_Default`], `stat | ${itemCategory} | ${dataPath1} | ${dataPath2 || dataPath1} default`),
								selected: { uv: selectedUv },
							},
						];
					},
				)),
				clearFilters: {
					default: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/DisableBtn/Disable_Default'], 'default clear filters'),
					hover: { uv: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/DisableBtn/Disable_Hover'], 'hover clear filters').uv },
				},
				swapItemOrder: {
					default: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/filter/ItemShop_InvertButton/ItemShop_InvertButton_Default'], 'default swap sort order'),
					hover: { uv: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/filter/ItemShop_InvertButton/ItemShop_InvertButton_Hover'], 'hover swap sort order').uv },
				},
				pin: {
					default: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_BootsPanel/ItemShop_BootsPanel_PinButton/BootsPanel_PinButton_Default'], 'default pin'),
					hover: { uv: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_BootsPanel/ItemShop_BootsPanel_PinButton/BootsPanel_PinButton_Hover'], 'hover pin').uv },
					slcHover: { uv: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_BootsPanel/ItemShop_BootsPanel_PinButton/BootsPanel_PinButton_SlcHover'], 'slc hover pin').uv },
				},
			},
		} as unknown as NonNullable<(typeof uiData)>['data'],
	};

	await uiFile.write(JSON.stringify(uiData, null, '\t'));
}

for (const category in debug) {
	const { variables, tags } = debug[category as keyof typeof debug];
	if (variables.size) {
		console.warn(`[${category}] unknown game variables`, variables);
	}
	if (tags[0].length) {
		console.warn(`[${category}] unknown tags`, tags[1], '\nfound in', tags[0]);
	}
}

function updateItemShopItemTooltipText(item: IItem, mShopTooltip: string) {
	const text = getStringtableValue(mShopTooltip, 'item shop tooltip');

	const subtitleLeftStartIndex = text.indexOf('<subtitleLeft>');
	const subtitleLeftEndIndex = text.indexOf('</subtitleLeft>');
	/* move start by tag length + unused {{ Item_BriefIcon... }} */
	const subtitleLeft = text.slice(subtitleLeftStartIndex + 51, subtitleLeftEndIndex);

	const subtitleRightStartIndex = text.indexOf('<subtitleRight>');
	const subtitleRightEndIndex = text.indexOf('</subtitleRight>');
	const subtitleRight = text.slice(subtitleRightStartIndex + 15, subtitleRightEndIndex);

	const statsStartIndex = text.indexOf('</section><section>');
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

	// TODO uncomment
	// const { unknownVariables } = replaceGameDescriptionVariables(rawExtra, 'item', item);
	// if (unknownVariables.length) {
	// 	debug.item.variables.set(item.name, unknownVariables);
	// }
	// const unknownTags = getUnknownTags(rawExtra);
	// if (unknownTags.size) {
	// 	debug.item.tags[0].push(item.name);
	// 	debug.item.tags[1] = debug.item.tags[1].union(unknownTags);
	// }

	const extra = rawExtra ? rawExtra.split('<br><br>').map(text => text.split('<br>')) : undefined;
	for (let i = 0; i < (extra?.length || 0); i++) {
		const replaced: string[] = [];
		let [heading] = extra![i];
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

	if (subtitleLeft.length || subtitleRight.length || extra?.length) {
		(textData.data.items as any)[item.id] = { tooltipShop: {
			subtitleLeft: subtitleLeft || undefined,
			subtitleRight: subtitleRight || undefined,
			extra,
		} };
	}
}

function createRuneSlotData(data: any) {
	const { mPerkId, mPerkName, mScript: { mSpellScriptData }, mDisplayNameLocalizationKey, mTooltipNameLocalizationKey, mShortDescLocalizationKey, mLongDescLocalizationKey, mIconTextureName } = data;

	const value = {
		id: mPerkId,
		name: mPerkName,
		icon: mIconTextureName.toLowerCase().replace('.tex', '.png'),
		calculations: cleanupObject(mSpellScriptData.mCalculations),
		effectAmount: cleanupObject(mSpellScriptData.mEffectAmount),
	};

	const variableDebug: Omit<IStringtableVariableDebug, 'key'> = { category: 'rune' as const, variableType: 'rune', variableStatSource: value };

	(textData.data.runes.slots as any)[mPerkName] = {
		name: getStringtableValue(mDisplayNameLocalizationKey, 'rune slot'),
		tooltipShort: getStringtableValue(mShortDescLocalizationKey, 'rune slot', { ...variableDebug, key: `${mPerkName}-tooltipShort` }),
		tooltipLong: getStringtableValue(mLongDescLocalizationKey, 'rune slot', { ...variableDebug, key: `${mPerkName}-tooltipLong` }),
		// TODO add debug when implementing
		tooltipStats: getStringtableValue(mTooltipNameLocalizationKey, 'rune slot'),
	};

	return [mPerkName, value];
}

async function loadStringTable() {
	if (!stringtable) {
		console.log('fetching stringtable...');
		({ entries: stringtable } = await fetch(`https://raw.communitydragon.org/${minorVersion}/game/en_us/data/menu/en_us/lol.stringtable.json`).then(r => r.json()));
	}
}

async function loadRcpFeLolCollectionsCss() {
	if (!rcpFeLolCollectionsCss) {
		await fetch(`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/rcp-fe-lol-collections.css`).then(r => r.text()).then((text) => {
			rcpFeLolCollectionsCss = text;
		});
	}
}

interface IStringtableVariableDebug {
	category: keyof typeof debug;
	key: string;
	variableType: IGameVariableType;
	variableStatSource: any;
}

function getStringtableValue(path: string, debugPrefix: string, variableDebug?: IStringtableVariableDebug) {
	const value = stringtable[path.toLowerCase()];
	if (!value) {
		console.warn(`[${debugPrefix}] string "${path.toLowerCase()}" not found in the stringtable`);
	}
	if (variableDebug) {
		const { unknownVariables } = replaceGameDescriptionVariables(value, variableDebug.variableType, variableDebug.variableStatSource);
		if (unknownVariables.length) {
			debug[variableDebug.category].variables.set(variableDebug.key, unknownVariables);
		}
		const unknownTags = getUnknownTags(value);
		if (unknownTags.size) {
			debug[variableDebug.category].tags[0].push(variableDebug.key);
			debug[variableDebug.category].tags[1] = debug[variableDebug.category].tags[1].union(unknownTags);
		}
	}
	return value;
}

function getUnknownTags(text: string): Set<string> {
	const tags = text.replaceAll('<br>', '').matchAll(/<\s*([a-z][\w-]*)\b[^>]*>/gi);
	return new Set(Array.from(tags, m => m[1].toLocaleLowerCase()).filter(tag => !KNOWN_GAME_DESCRIPTION_TAGS.includes(tag)));
}

function formatNumber(n: number, precision = 2): number {
	return Number.isInteger(n) ? n : Number(n.toFixed(precision));
}

function cleanupObject(obj?: object): any {
	return obj && Object.fromEntries(Object.entries(obj).filter(([key]) => key !== '__type').map(([key, value]) =>
		[key, typeof value === 'object'
			? Array.isArray(value) ? value.map(cleanupObject) : cleanupObject(value)
			: typeof value === 'number'
				? formatNumber(value)
				: value]),
	);
}
