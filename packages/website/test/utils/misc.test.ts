import { describe, expect, it } from 'bun:test';
import { roundVariable } from '../../app/utils/misc';

describe('app/utils/misc.ts', () => {
	it('roundVariable formats numbers correctly', () => {
		/* runes */
		expect(roundVariable(1.8).toString(), 'conqueror').toBe('1.8');
		expect(roundVariable(7.000000000000001).toString(), 'celerity').toBe('7');
		expect(roundVariable(3 * 0.6).toString(), 'absolute focus').toBe('1.8');
		expect(roundVariable(2.5).toString(), 'triumph').toBe('2.5');
	});
});
