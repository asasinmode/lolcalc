import assert from 'node:assert';
import test from 'node:test';
<<<<<<<< HEAD:packages/core/test/lolcalc/utils.test.ts
import { roundVariable } from '../../lolcalc/utils.ts';
========
import { roundVariable } from '../src/utils.ts';
>>>>>>>> feat/separate-logic-package:packages/shared/test/utils.test.ts

test('lolcalc/utils.ts', async (t) => {
	await t.test('roundVariable formats numbers correctly', () => {
		/* runes */
		assert.strictEqual(roundVariable(1.8).toString(), '1.8', 'conqueror');
		assert.strictEqual(roundVariable(7.000000000000001).toString(), '7', 'celerity');
		assert.strictEqual(roundVariable(3 * 0.6).toString(), '1.8', 'absolute focus');
		assert.strictEqual(roundVariable(2.5).toString(), '2.5', 'triumph');
	});
});
