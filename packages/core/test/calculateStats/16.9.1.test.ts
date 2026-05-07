import assert from 'node:assert';
import test from 'node:test';
import { ITEMS } from '@lolcalc/data';
import { ITEM_NAME_TO_ID } from '@lolcalc/shared';
import fixture from './16.9.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupItems } from './utils.ts';

test.before(() => {
	setupItems(fixture);
});

test('16.9.1 Ahri, shards 100', async (t) => {
	await t.test('mejai, blackfire, berserkers, guinsoo, riftmaker, rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ahri', { items: [ITEMS[ITEM_NAME_TO_ID.rabadon]] });

		assert.strictEqual(damageSource.champion.value?.id, 'Ahri');
		assert.strictEqual(damageSource.items.value[0]?.dataValues?.APAmp, 0.5);
	});
});
