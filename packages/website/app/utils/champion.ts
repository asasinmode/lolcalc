export function cooldownReductionPercentageFromHaste(haste: number) {
	return haste / (haste + 100) * 100;
}

export const CHAMPION_SPECIFICS = {
	Aphelios: {
		WEAPON_ORDER: ['calibrum', 'severum', 'gravitum', 'infernum', 'crescendum'],
	},
};
