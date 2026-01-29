export function roundVariable(value: number, precision = 12, epsilon = 1e-9) {
	const int = Math.round(value);
	if (Math.abs(value - int) < epsilon) {
		return int;
	}
	return Number(value.toPrecision(precision));
}
