const { version, minorVersion } = usePatchVersion();

function championImage(image: string, championId: string) {
	return championId === 'TargetDummy'
		? `https://raw.communitydragon.org/${minorVersion}/game/${image}`
		: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${image}`;
}

function abilityImage(path: string, championId: string, group: 'sources' | 'targets' = 'sources') {
	path = championId === 'TargetDummy'
		? path
				.replace('%s', group === 'sources' ? 'order' : 'chaos')
				.replace('%s', group === 'sources' ? 'blue' : 'red')
		: path;
	return `https://raw.communitydragon.org/${minorVersion}/game/${path}`;
}

const rv = { championImage, abilityImage };

export function useChampionImages() {
	return rv;
}
