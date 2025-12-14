import { version } from '~/assets/champion.json';

export function usePatchVersion(full = true) {
	return full ? version : version.slice(0, version.lastIndexOf('.'));
}
