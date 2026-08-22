/** like JSON.stringify but formats `number[]` into single line */
export function stringifyObject(obj: object) {
	const json = JSON.stringify(obj, (_k, v) =>
		Array.isArray(v) && v.every(item => typeof item === 'number')
			? `__ARRAY__[${v.join(', ')}]__ARRAY__`
			: v, '\t');

	return json.replace(/"__ARRAY__(.*?)__ARRAY__"/g, '$1');
}
