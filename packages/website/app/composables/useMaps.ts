const MAPS = {
	sr: {
		name: 'Summoner\'s Rift',
		iconDirUrl: 'classic_sru',
		mask: 1 << 0,
	},
	ha: {
		name: 'Howling Abyss',
		iconDirUrl: 'aram',
		mask: 1 << 1,
	},
};

export function useMaps() {
	return MAPS;
}
