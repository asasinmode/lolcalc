import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import assert from 'node:assert';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.12.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Evelynn, dragons', async (t) => {
	const sourceCommon: IOverrides<'Evelynn'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.zhonya, ITEMS_BY_NAME.shadowflame, ITEMS_BY_NAME.stormsurge, ITEMS_BY_NAME.sorcerersShoes, ITEMS_BY_NAME.lichBane],
	};

	await t.test('rfc sharpshooter', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			/* game shows 404, not sure why */
			attackRange: 405,
		});
		assert.strictEqual(damageSource.stats.value.isRanged, false);
	});
});
