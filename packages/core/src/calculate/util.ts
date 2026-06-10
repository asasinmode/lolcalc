export function addTenacity(base: number, ...values: number[]) {
	for (const value of values) {
		base *= 1 - value;
	}
	return base;
}
