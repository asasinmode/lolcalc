import { version } from '../assets/champion.json';

const minorVersion = version.slice(0, version.lastIndexOf('.'));

export function usePatchVersion() {
	return { minorVersion, version };
}
