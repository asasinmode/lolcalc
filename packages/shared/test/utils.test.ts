import assert from 'node:assert';
import test from 'node:test';
import { roundNumber } from '../src/utils.ts';

test('@lolcalc/shared/utils', async (t) => {
	await t.test('roundNumber formats numbers correctly', () => {
		assert.strictEqual(roundNumber(7.0 + 1e-9).toString(), '7');
		/* runes */
		assert.strictEqual(roundNumber(1.8).toString(), '1.8', 'conqueror');
		assert.strictEqual(roundNumber(7.000000000000001).toString(), '7', 'celerity');
		assert.strictEqual(roundNumber(3 * 0.6).toString(), '1.8', 'absolute focus');
		assert.strictEqual(roundNumber(2.5).toString(), '2.5', 'triumph');
		/* damage results attack speed comparison */
		assert.strictEqual(roundNumber(105.4).toString(), '105.4', 'results comparison attack speed');
		/* damage results calculated item variables */
		assert.strictEqual(roundNumber(105.0375).toString(), '105.04', 'results muramana');
		assert.strictEqual(roundNumber(70.025).toString(), '70.03', 'results muramana');
		assert.strictEqual(roundNumber(272.66499999999996).toString(), '272.66', 'results fimbulwinter computed shield');
	});
});
