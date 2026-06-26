import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import assert from 'node:assert';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.11.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

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
		assert.strictEqual(damageSource.stats.value.isRanged, false);
	});

	await t.test('hexoptics arcane aim', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rakan', {
			items: [ITEMS_BY_NAME.hexoptics],
			internalItemData: { arcaneAim: 1 } satisfies Partial<IInternalItemDataOf<'hexoptics'>>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackRange: 400,
		});
		assert.strictEqual(damageSource.stats.value.isRanged, false);
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
		assert.strictEqual(damageSource.stats.value.isRanged, false);
	});
});

test('Jax, passive and ms/as items', async (t) => {
	let sourceCommon: IOverrides<'Jax'> = {
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.mercurialScimitar, ITEMS_BY_NAME.titanicHydra, ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.trinity],
	};

	await t.test('lvl 1 | passive 5 | quicken', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jax', {
			...sourceCommon,
			internalData: { passiveStacks: 5 } satisfies IInternalDataOf<'Jax'>,
			internalItemData: { quicken: 1 } satisfies IInternalItemDataOf<'trinity'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 370,
			attackSpeed: 0.989,
		});
	});

	await t.test('lvl 1 | passive 8 | quicken, quicksilver', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jax', {
			...sourceCommon,
			internalData: { passiveStacks: 8 } satisfies IInternalDataOf<'Jax'>,
			internalItemData: { quicken: 1, quicksilver: 1 } satisfies IInternalItemDataOf<'trinity' | 'mercurialScimitar'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 508,
			attackSpeed: 1.085,
		});
	});

	await t.test('lvl 1 | quicksilver', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jax', {
			...sourceCommon,
			internalItemData: { quicksilver: 1 } satisfies IInternalItemDataOf<'trinity' | 'mercurialScimitar'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 493,
		});
	});

	await t.test('lvl 8 | passive 8', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jax', {
			...sourceCommon,
			level: 8,
			internalData: { passiveStacks: 8 } satisfies IInternalDataOf<'Jax'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 1.363,
		});
	});

	await t.test('lvl 18 | passive 5', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jax', {
			...sourceCommon,
			level: 18,
			internalData: { passiveStacks: 5 } satisfies IInternalDataOf<'Jax'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 1.597,
		});
	});

	sourceCommon = {
		runes: {
			shards: {
				offensive: 'attackspeed',
				flex: 'adaptive',
				defensive: 'tenacity',
			},
		},
		level: 20,
		roleQuest: 'top',
		items: [ITEMS_BY_NAME.guinsoo, ITEMS_BY_NAME.yunTal, ITEMS_BY_NAME.lichBane, ITEMS_BY_NAME.steraksGage, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.mercurysTreads],
	};

	await t.test('lvl 20 | passive 2 | guinsoo, yun\'tal, lich\'bane, sterak, endless hunger, mercury\'s treads', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jax', {
			...sourceCommon,
			internalData: { passiveStacks: 5 } satisfies IInternalDataOf<'Jax'>,
			internalItemData: { seething: 4, flurry: 1, practice: 0 } satisfies IInternalItemDataOf<'guinsoo' | 'yunTal'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			tenacity: 62,
			attackSpeed: 2.385,
		});
	});
});
