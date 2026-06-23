import type { IReplaceGameVariablesRV } from '@lolcalc/core/variables/game.ts';
import type { TText } from '@lolcalc/data';
import assert from 'node:assert';
import test from 'node:test';
import { CHAMPION_STAT_TO_SCALING_TAG, replaceGameVariables } from '@lolcalc/core/variables/game.ts';
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
		const runaan = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.runaan].tooltipShop[0]![2]!, 'item', { item: ITEMS_BY_NAME.runaan }, undefined, { isExtended: true });
		assertMetaSuffix('BoltDamage', `<${CHAMPION_STAT_TO_SCALING_TAG.attackDamage}>55%</${CHAMPION_STAT_TO_SCALING_TAG.attackDamage}>%i:${STAT_ICON.attackDamage}%`, runaan);

		const manamune = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.manamune].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.manamune }, undefined, { isExtended: true });
		assertMetaSuffix('BonusADFromMana', `<${CHAMPION_STAT_TO_SCALING_TAG.mana}>2%</${CHAMPION_STAT_TO_SCALING_TAG.mana}>%i:${STAT_ICON.mana}%`, manamune);

		const unendingDespair = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.unendingDespair].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.unendingDespair }, undefined, { isExtended: true });
		assertMetaSuffix('DrainCalc', `<${CHAMPION_STAT_TO_SCALING_TAG.hp}>3% bonus</${CHAMPION_STAT_TO_SCALING_TAG.hp}> %i:${STAT_ICON.hp}%`, unendingDespair);

		const icebornGauntlet = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.icebornGauntlet].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.icebornGauntlet }, undefined, { isExtended: true });
		assertMetaSuffix('SpellbladeDamage', `<${CHAMPION_STAT_TO_SCALING_TAG.attackDamage}>150% base</${CHAMPION_STAT_TO_SCALING_TAG.attackDamage}> %i:${STAT_ICON.attackDamage}%`, icebornGauntlet);
	});
});
