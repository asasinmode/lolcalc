import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
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
	await t.test('lvl 18 | mejai, blackfire, berserkers, guinsoo, riftmaker, rabadon', async () => {
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
			internalItemData: {
				glory: 20,
				bBlaze: 1,
				seething: 1,
			} satisfies IInternalItemDataOf<'mejai' | 'blackfireTorch' | 'guinsoo'>,
		});

		assert.strictEqual(damageSource.computed.formattedStatTotals.value.attackDamage, 134);
		assert.strictEqual(damageSource.computed.formattedStatTotals.value.abilityPower, 602);
		assert.strictEqual(damageSource.computed.formattedStatTotals.value.armor, 92);
		assert.strictEqual(damageSource.computed.formattedStatTotals.value.magicResist, 52);
		assert.strictEqual(damageSource.computed.formattedStatTotals.value.attackSpeed, 1.33);
		assert.strictEqual(damageSource.computed.formattedStatTotals.value.abilityHaste, 35);
		assert.strictEqual(damageSource.computed.formattedStatTotals.value.moveSpeed, 413);
	});

	await t.test('lvl 18 | archangel, blackfire, berserkers, guinsoo, riftmaker, rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ahri', {
			level: 18,
			runes: {
				shards: {
					offensive: 'attackspeed',
					flex: 'adaptive',
					defensive: 'health',
				},
			},
			items: [ITEMS[ITEM_NAME_TO_ID.archangelsStaff], ITEMS[ITEM_NAME_TO_ID.blackfireTorch], ITEMS[ITEM_NAME_TO_ID.berserkerGreaves], ITEMS[ITEM_NAME_TO_ID.guinsoo], ITEMS[ITEM_NAME_TO_ID.riftmaker], ITEMS[ITEM_NAME_TO_ID.rabadon]],
			internalItemData: {
				manaflow: 10,
				bBlaze: 1,
			} satisfies IInternalItemDataOf<'archangelsStaff' | 'blackfireTorch'>,
		});

		assert.strictEqual(damageSource.computed.formattedStatTotals.value.abilityPower, 549);
		assert.strictEqual(damageSource.computed.formattedStatTotals.value.abilityHaste, 60);
		assert.strictEqual(damageSource.computed.formattedStatTotals.value.mana, 2053);
	});
});
