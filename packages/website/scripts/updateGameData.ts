import type { IChampion } from '../app/composables/useChampions';
import type { IItem, IItemCategory } from '../app/composables/useItems';
import type { IItemShopStatFilter, ITexture } from '../app/composables/useUi';
import { useMaps } from '../app/composables/useMaps';

const versions: string[] = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(res => res.json());

const [latestVersion] = versions;
const minorVersion = latestVersion.slice(0, latestVersion.lastIndexOf('.'));

console.log('latest version', latestVersion);

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
						stats.attackspeedratio = Number.parseFloat(
							additionalData[`Characters/${characterRecordsKey}/CharacterRecords/Root`].attackSpeedRatio.toFixed(3),
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
						image,
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
			champion!.roles[role.toLowerCase()] = true;
		}
	}

	await championFile.write(JSON.stringify(championData, null, '\t'));
}

const itemFile = Bun.file(`${import.meta.dir}/../app/assets/item.json`);
let itemData: typeof import('../app/assets/item.json') | undefined;

if (await itemFile.exists()) {
	itemData = await itemFile.json();
}

if (!itemData || itemData?.version !== latestVersion) {
	console.log('item data not present or outdated, fetching...');

	const { version, data } = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`).then(r => r.json());

	const UNPURCHASABLES_TO_KEEP = [
		'2422', // slightly magical footwear
		'3040',	// seraph's embrace
		'3042',	// muramana
		'3121', // fimbulwinter
	];

	const UNINTERESTING_ITEMS = [
		'3330',	// scarecrow effigy
		'3340',	// stealth ward
		'3363',	// farsight alteration
		'3364',	// oracle lens
		'3599',	// kalista's black spear
		'3600',	// kalista's black spear
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
	];

	const MAPS = useMaps();

	itemData = {
		version,
		data: Object.fromEntries(
			Object.entries(data)
				.filter(([itemId, itemData]) => {
					const { maps: { 11: sr, 12: ha }, gold } = itemData as {
						maps: Record<number, boolean>;
						gold: { purchasable: boolean; inStore?: boolean; hideFromAll?: boolean };
					};

					return !UNINTERESTING_ITEMS.includes(itemId)
						&& (sr || ha)
						&& itemId.length <= 4
						&& gold.inStore !== false
						&& gold.hideFromAll !== false
						&& (gold.purchasable || UNPURCHASABLES_TO_KEEP.includes(itemId));
				})
				.map(([itemId, itemData]) => {
					const { name, stats, gold, image, maps: { 11: sr, 12: ha }, tags } = itemData as any;

					let mapMask = 0;
					if (sr) {
						mapMask |= MAPS.sr.mask;
					}
					if (ha) {
						mapMask |= MAPS.ha.mask;
					}

					return [itemId, {
						id: itemId,
						name,
						stats,
						gold,
						image,
						mapMask,
						...(tags.includes('Boots') ? { isBoots: true } : undefined),
						...(tags.includes('OnHit') ? { isOnHit: true } : undefined),
					}];
				}),
		) as NonNullable<typeof itemData>['data'],
	};

	const moreItemData = await fetch(`https://raw.communitydragon.org/${minorVersion}/game/items.cdtb.bin.json`).then(r => r.json());

	const SPECIAL_EPICNESS_ITEMS: Record<string, number> = {
		3869: 7,	// celestial opposition
		3870: 7,	// dream maker
		3871: 7,	// zaz'zak's realmspike
		3876: 7,	// solstice sleigh
		3877: 7,	// bloodsong
	};

	for (const [itemId, item] of Object.entries(itemData.data as Record<string, IItem>)) {
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

		for (const [statKey, key, makeFloat] of statsToAdd) {
			if (itemMoreData[key]) {
				stats[statKey] = makeFloat ? Number.parseFloat(itemMoreData[key].toFixed(2)) : itemMoreData[key];
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
}

const runeFile = Bun.file(`${import.meta.dir}/../app/assets/runes.json`);
let runeData: typeof import('../app/assets/runes.json') | undefined;

if (await runeFile.exists()) {
	runeData = await runeFile.json();
}

if (!runeData || runeData?.version !== latestVersion) {
	console.log('rune data not present or outdated, fetching...');

	const data = await fetch(`https://raw.communitydragon.org/${minorVersion}/game/perks.cdtb.bin.json`).then(r => r.json());

	const shardAdaptiveForce = data['Perks/StatMods/Adaptive'].mScript.mSpellScriptData.mEffectAmount.StatGain2;
	const shardScalingHealth = data['Perks/StatMods/HealthScaling'].mScript.mSpellScriptData.mEffectAmount.StatGainMin;
	const shardDefensiveFlatHealthKey = data['Perks/StatMods/Slots/DefensiveStats'].mPerks[0];
	const shardDefensiveTenacityKey = data['Perks/StatMods/Slots/DefensiveStats'].mPerks[1];

	runeData = {
		version: latestVersion,
		data: {
			shards: {
				offensive: {
					adaptiveForce: shardAdaptiveForce,
					percentAttackSpeed: Number.parseFloat((data['Perks/StatMods/AttackSpeed'].mScript.mSpellScriptData.mEffectAmount.StatGain / 100).toFixed(2)),
					abilityHaste: data['Perks/StatMods/CDRScaling'].mScript.mSpellScriptData.mEffectAmount.HasteGain,
				},
				flex: {
					adaptiveForce: shardAdaptiveForce,
					percentMoveSpeed: Number.parseFloat((data['Perks/StatMods/MovementSpeed'].mScript.mSpellScriptData.mEffectAmount.StatGain1 / 100).toFixed(3)),
					scalingHealth: shardScalingHealth,
				},
				defensive: {
					flatHealth: data[shardDefensiveFlatHealthKey].mScript.mSpellScriptData.mEffectAmount.StatGain,
					percentTenacityMod: Number.parseFloat((data[shardDefensiveTenacityKey].mScript.mSpellScriptData.mEffectAmount.StatGain / 100).toFixed(2)),
					scalingHealth: shardScalingHealth,
				},
			},
		},
	};

	await runeFile.write(JSON.stringify(runeData, null, '\t'));
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
					['magicResists', 'MagicResist'],
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
				clearFilters: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/statfilters/DisableBtn/Disable_Default'], 'clear filters'),
				swapSortOrder: getTexture(data['ClientStates/Gameplay/UX/ItemShop/UIBase/ItemShop/ItemShop_TabView_AllItems/filter/ItemShop_InvertButton/ItemShop_InvertButton_Default'], 'swap sort order'),
			},
		} as unknown as NonNullable<(typeof uiData)>['data'],
	};

	await uiFile.write(JSON.stringify(uiData, null, '\t'));
}
