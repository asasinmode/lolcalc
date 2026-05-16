export function roundVariable(value: number, precision = 2, epsilon = 1e-9): number {
	const int = Math.round(value);
	if (Math.abs(value - int) < epsilon) {
		return int;
	}
	const factor = 10 ** precision;
	return Math.round(value * factor) / factor;
}

export function clamp(min: number, value: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
