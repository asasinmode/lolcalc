import { simpleDescriptionFormatting } from '@lolcalc/core/misc';

export function useSimpleDescription(key: string, description: string, addAlt = true, textureSize = 20) {
	return useAsyncData(key, () => simpleDescriptionFormatting(description, addAlt, textureSize), {
		default: () => 'loading...',
	}).data;
}
