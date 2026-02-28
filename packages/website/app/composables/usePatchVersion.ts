import fileData from '../assets/champion.json' with { type: 'json' };

const { version } = fileData;
const minorVersion = version.slice(0, version.lastIndexOf('.'));
const rv = { minorVersion, version };

export function usePatchVersion() {
	return rv;
}
