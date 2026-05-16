import assert from 'node:assert';
import test from 'node:test';
import { roundVariable } from '../src/utils.ts';

test('@lolcalc/shared/utils', async (t) => {
	await t.test('roundVariable formats numbers correctly', () => {
		/* runes */
		assert.strictEqual(roundVariable(1.8).toString(), '1.8', 'conqueror');
		assert.strictEqual(roundVariable(7.000000000000001).toString(), '7', 'celerity');
		assert.strictEqual(roundVariable(3 * 0.6).toString(), '1.8', 'absolute focus');
		assert.strictEqual(roundVariable(2.5).toString(), '2.5', 'triumph');
		/* damage results attack speed comparison */
		assert.strictEqual(roundVariable(105.4).toString(), '105.4', 'results comparison attack speed');
		/* damage results calculated item variables */
		assert.strictEqual(roundVariable(105.0375).toString(), '105.04', 'results muramana');
		assert.strictEqual(roundVariable(70.025).toString(), '70.03', 'results muramana');
	});
});
