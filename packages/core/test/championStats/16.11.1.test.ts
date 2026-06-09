import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import assert from 'node:assert';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from './16.11.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from './utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Rakan, attack range modifying items', async (t) => {
	await t.test('rfc sharpshooter', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rakan', {
			items: [ITEMS_BY_NAME.rfc],
			internalItemData: { sharpshooter: 1 } satisfies IInternalItemDataOf<'rfc'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			/* game shows 404, not sure why */
			attackRange: 405,
		});
		assert.strictEqual(damageSource.isRanged.value, false);
	});

	await t.test('hexoptics arcane aim', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rakan', {
			items: [ITEMS_BY_NAME.hexoptics],
			internalItemData: { arcaneAim: 1 } satisfies Partial<IInternalItemDataOf<'hexoptics'>>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackRange: 400,
		});
		assert.strictEqual(damageSource.isRanged.value, false);
	});

	await t.test('rfc sharpshooter + hexoptics arcane aim', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rakan', {
			items: [ITEMS_BY_NAME.hexoptics, ITEMS_BY_NAME.rfc],
			internalItemData: { arcaneAim: 1, sharpshooter: 1 } satisfies Partial<IInternalItemDataOf<'hexoptics' | 'rfc'>>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			/* game shows 539, not sure why */
			attackRange: 540,
		});
		assert.strictEqual(damageSource.isRanged.value, false);
	});
});
