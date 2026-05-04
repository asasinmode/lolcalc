export function roundVariable(value: number, precision = 12, epsilon = 1e-9): number {
	const int = Math.round(value);
	if (Math.abs(value - int) < epsilon) {
		return int;
	}
	return Number(value.toPrecision(precision));
}

export function clamp(min: number, value: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
