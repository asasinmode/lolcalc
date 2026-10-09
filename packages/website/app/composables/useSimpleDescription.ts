import { simpleDescriptionFormatting } from '@lolcalc/core/misc';

export function useSimpleDescription(key: string, description: string, addAlt = true) {
	const { data } = useAsyncData(key, () => simpleDescriptionFormatting(description, addAlt), {
		default: () => 'loading...',
	});

	return data;
}
