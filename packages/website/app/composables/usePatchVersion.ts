import { version } from '../assets/champion.json';

const minorVersion = version.slice(0, version.lastIndexOf('.'));
const rv = { minorVersion, version };

export function usePatchVersion() {
	return rv;
}
