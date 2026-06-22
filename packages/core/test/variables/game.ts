import type { IReplaceGameVariablesRV } from '@lolcalc/core/variables/game.ts';
import type { TText } from '@lolcalc/data';
import assert from 'node:assert';
import test from 'node:test';
import { replaceGameVariables } from '@lolcalc/core/variables/game.ts';
import { ITEMS_BY_NAME, STAT_ICON, TEXT } from '@lolcalc/data';
import { ITEM_NAME_TO_ID } from '@lolcalc/shared';
import fixture from '../fixtures/16.12.1.fixture.json' with { type: 'json' };
import { setupPatchFixture } from '../utils.ts';

function assertMetaSuffix(variableName: string, expected: string, replaceResult: IReplaceGameVariablesRV) {
	return assert.strictEqual(replaceResult.variables.get(variableName)?.metaSuffix, ` = (${expected})`);
}

test.before(() => {
	setupPatchFixture(fixture);
});

test.only('extended equals', async (t) => {
	t.test('single stat scaling', () => {
		const runaanSource = (TEXT as unknown as TText).items[ITEM_NAME_TO_ID.runaan].tooltipShop[0]![2]!;
		const runaan = replaceGameVariables(runaanSource, 'item', { item: ITEMS_BY_NAME.runaan }, undefined, { isExtended: true });
		assertMetaSuffix('BoltDamage', `<scalead>55%</scalead>%i:${STAT_ICON.attackDamage}%`, runaan);
	});
});
