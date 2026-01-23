export function roundVariable(value: number, epsilon = 1e-9, precision = 12) {
	const int = Math.round(value);
	if (Math.abs(value - int) < epsilon) {
		return int;
	}
	return Number(value.toPrecision(precision));
}
