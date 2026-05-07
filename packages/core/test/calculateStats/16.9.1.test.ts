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
		const damageSource = await setupDamageSource(fixture, 'Ahri', {
			level: 18,
			runes: {
				shards: {
					offensive: 'attackspeed',
					flex: 'adaptive',
					defensive: 'health',
				},
			},
			items: [ITEMS[ITEM_NAME_TO_ID.mejai], ITEMS[ITEM_NAME_TO_ID.blackfireTorch], ITEMS[ITEM_NAME_TO_ID.berserkerGreaves], ITEMS[ITEM_NAME_TO_ID.guinsoo], ITEMS[ITEM_NAME_TO_ID.riftmaker], ITEMS[ITEM_NAME_TO_ID.rabadon]],
		});

		console.log(JSON.stringify(damageSource.stats.value, null, 2));

		assert.strictEqual(damageSource.computed.formattedStatTotals.value.abilityPower, 602);
	});
});
