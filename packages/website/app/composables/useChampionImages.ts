const { version, minorVersion } = usePatchVersion();

function championImage(image: string, championId: IChampionId) {
	return championId === 'TargetDummy'
		? `https://raw.communitydragon.org/${minorVersion}/game/${image}`
		: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${image}`;
}

function abilityImage(path: string, championId: IChampionId, group: 'sources' | 'targets' = 'sources') {
	path = championId === 'TargetDummy'
		? path
				.replace('%s1', group === 'sources' ? 'order' : 'chaos')
				.replace('%s2', group === 'sources' ? 'blue' : 'red')
		: path;
	return `https://raw.communitydragon.org/${minorVersion}/game/${path}`;
}

function championImageSize(championId: IChampionId) {
	return championId === 'TargetDummy' ? 64 : 128;
}

function abilityImageSize(championId: IChampionId) {
	return championId === 'TargetDummy' ? 128 : 64;
}

const rv = { championImage, abilityImage, championImageSize, abilityImageSize };

export function useChampionImages() {
	return rv;
}
