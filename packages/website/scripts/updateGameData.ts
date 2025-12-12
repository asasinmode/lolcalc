export {};

const versions: string[] = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(res => res.json());

const [latestVersion] = versions;

console.log('Latest version', latestVersion);

const championFile = Bun.file('app/assets/champion.json');
let championData: typeof import('../app/assets/champion.json') | undefined;

if (await championFile.exists()) {
	championData = await championFile.json();
}

if (!championData || championData?.version !== latestVersion) {
	console.log('No champion data or outdated, fetching...');

	championData = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`).then(r => r.json());

	await championFile.write(JSON.stringify(championData, null, '\t'));
}

const itemFile = Bun.file('app/assets/item.json');
let itemData: typeof import('../app/assets/item.json') | undefined;

if (await itemFile.exists()) {
	itemData = await itemFile.json();
}

if (!itemData || itemData?.version !== latestVersion) {
	console.log('No item data or outdated, fetching...');

	itemData = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`).then(r => r.json());

	await itemFile.write(JSON.stringify(itemData, null, '\t'));
}

const roleFile = Bun.file('app/assets/role.json');
let roleData: typeof import('../app/assets/role.json') | undefined;

if (!roleData || roleData?.version !== latestVersion) {
	console.log('No role data or outdated, fetching...');

	const roleScript = await fetch(`https://raw.communitydragon.org/${latestVersion.slice(0, latestVersion.lastIndexOf('.'))}/plugins/rcp-fe-lol-champion-statistics/global/default/rcp-fe-lol-champion-statistics.js`).then(r => r.text());
	const rawData = roleScript.match(/JSON\.parse\('([^']+)'/)?.[1];
	let scriptData: Record<'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'SUPPORT', Record<string, number>> = {
		TOP: {},
		JUNGLE: {},
		MIDDLE: {},
		BOTTOM: {},
		SUPPORT: {},
	};

	if (rawData) {
		scriptData = JSON.parse(rawData);
	} else {
		console.error('Failed to get role data', roleScript);
	}

	const champions = Object.values(championData!.data);
	roleData = Object.fromEntries(
		Object.entries(scriptData).map(([role, playratesByKey]) => (
			[role, Object.keys(playratesByKey).map(
				key => champions.find(champion => champion.key === key)?.id,
			)])),
	);

	await roleFile.write(JSON.stringify(roleData, null, '\t'));
}
