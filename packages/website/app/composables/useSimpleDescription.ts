import { simpleDescriptionFormatting } from '@lolcalc/core/misc';

export function useSimpleDescription(key: string, description: string, addAlt = true, textureSize = 20) {
	const { data } = useAsyncData(key, () => simpleDescriptionFormatting(description, addAlt, textureSize), {
		default: () => 'loading...',
	});

	return data;
}
