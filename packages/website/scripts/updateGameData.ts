import type { IChampion } from '../app/composables/useChampions';
import type { IItemCategory } from '../app/composables/useItems';

const versions: string[] = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(res => res.json());

const [latestVersion] = versions;
const minorVersion = latestVersion.slice(0, latestVersion.lastIndexOf('.'));

console.log('Latest version', latestVersion);

const championFile = Bun.file('app/assets/champion.json');
let championData: typeof import('../app/assets/champion.json') | undefined;

if (await championFile.exists()) {
	championData = await championFile.json();
}

if (!championData || championData?.version !== latestVersion) {
	console.log('Champion data not present or outdated, fetching...');

	const { version, data } = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`).then(r => r.json());

	championData = {
		version,
		data: Object.fromEntries(
			(Object.entries(data) as [string, IChampion][])
				.sort(([, champA], [, champB]) => champA.name.localeCompare(champB.name))
				.map(([championId, championData]) => {
					const { id, key, name, image, partype, stats } = championData;

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

const itemFile = Bun.file('app/assets/item.json');
let itemData: typeof import('../app/assets/item.json') | undefined;

if (await itemFile.exists()) {
	itemData = await itemFile.json();
}

if (!itemData || itemData?.version !== latestVersion) {
	console.log('Item data not present or outdated, fetching...');

	const { version, data } = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`).then(r => r.json());

	const UNPURCHASABLES_TO_KEEP = [
		'2422', // slightly magical footwear
		'3040',	// seraph's embrace
		'3042',	// muramana
		'3121', // mobility boots
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
	];

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
					const { name, stats, gold, image } = itemData as any;
					return [itemId, {
						id: itemId,
						name,
						stats,
						gold,
						image,
					}];
				}),
		) as NonNullable<typeof itemData>['data'],
	};

	const moreItemData = await fetch(`https://raw.communitydragon.org/${minorVersion}/game/items.cdtb.bin.json`).then(r => r.json());

	for (const [itemId, item] of Object.entries(itemData.data)) {
		const itemMoreData = moreItemData[`Items/${itemId}`];

		if (!itemMoreData) {
			console.warn(`Haven't found more data for ${item.name} (${itemId})`);
			continue;
		}

		const statsToAdd: ([string, string, true] | [string, string])[] = [
			['AbilityHasteMod', 'mAbilityHasteMod'],
			['FlatMagicPenetrationMod', 'mFlatMagicPenetrationMod'],
			['PercentArmorPenetrationMod', 'mPercentArmorPenetrationMod', true],
			['PercentBaseHPRegenMod', 'mPercentBaseHPRegenMod'],
			['PercentBaseMPRegenMod', 'percentBaseMPRegenMod'],
			['PercentMagicPenetrationMod', 'mPercentMagicPenetrationMod', true],
			['PercentTenacityMod', 'mPercentTenacityItemMod', true],
			['PhysicalLethality', 'PhysicalLethality'],
		];

		const stats = item.stats as Record<string, number>;

		for (const [statKey, key, makeFloat] of statsToAdd) {
			if (itemMoreData[key]) {
				stats[statKey] = makeFloat ? Number.parseFloat(itemMoreData[key].toFixed(2)) : itemMoreData[key];
			}
		}

		const KNOWN_CATEGORYLESS_ITEMS = [
			'3170',	// swiftmarch
			'3171',	// crimson lucidity
			'3172',	// gunmetal greaves
			'3173',	// chainlaced crushers
			'3174',	// armored advance
			'3175',	// spellslinger's shoes
			'3176',	// forever forward
			'3869',	// celestial opposition
			'3870',	// dream maker
			'3871',	// zaz'zak's realmspike
			'3876',	// solstice sleigh
			'3877',	// bloodsong
		];

		if (!itemMoreData.mItemAttributes) {
			if (!KNOWN_CATEGORYLESS_ITEMS.includes(itemId)) {
				console.warn(`Haven't found category data for ${item.name} (${itemId})`);
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

		(item as { categories?: Record<string, boolean> }).categories = (itemMoreData.mItemAttributes as number[])
			.reduce((acc, categoryNumber) => ({
				...acc,
				[CATEGORY_NUMBER_TO_NAME[categoryNumber]]: true,
			}), {} as Partial<Record<IItemCategory, boolean>>);
	}

	await itemFile.write(JSON.stringify(itemData, null, '\t'));
}
