import { data } from '../assets/rune.json';

export function useRunes() {
	return data as unknown as IRunes;
}

export const RUNE_SLOT_NAME_TO_NUMBER = Object.fromEntries(Object.entries(data.paths)
	.flatMap(([, { slots }]) =>
		slots.flatMap((slot, slotIndex) => Object.keys(slot).map(slotName => [slotName, slotIndex])),
	),
) as Record<IRuneSlotName, number>;
