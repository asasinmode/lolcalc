export function cooldownReductionPercentageFromHaste(haste: number) {
	return haste / (haste + 100) * 100;
}
