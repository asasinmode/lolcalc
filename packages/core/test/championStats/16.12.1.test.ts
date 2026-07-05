import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalDragonDataOf } from '@lolcalc/core/specifics/index.ts';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.12.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Evelynn, dragons', async (t) => {
	const sorcShoesCommon: IOverrides<'Evelynn'> = {
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.zhonya, ITEMS_BY_NAME.shadowflame, ITEMS_BY_NAME.stormsurge, ITEMS_BY_NAME.sorcerersShoes, ITEMS_BY_NAME.lichBane],
	};

	await t.test('lvl 1', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', { ...sorcShoesCommon, level: 1 });

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 719,
			armor: 87,
			abilityHaste: 10,
			moveSpeed: 423,
			flatMagicPen: 42,
		});
	});

	await t.test('lvl 18, mountain', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', {
			...sorcShoesCommon,
			level: 18,
			dragonStacks: ['Mountain'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 175,
			magicResist: 70,
		});
	});

	const swiftnessBootsCommon: IOverrides<'Evelynn'> = {
		level: 18,
		runes: sorcShoesCommon.runes,
		items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.zhonya, ITEMS_BY_NAME.shadowflame, ITEMS_BY_NAME.stormsurge, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.lichBane],
	};

	await t.test('lvl 18, mountain, cloud', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', {
			...swiftnessBootsCommon,
			level: 18,
			dragonStacks: ['Mountain', 'Cloud'],
			internalDragonData: { isOOC: 1 } satisfies IInternalDragonDataOf<'Cloud', 'stack'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 448,
			slowResist: 29,
		});
	});

	await t.test('lvl 18, mountain, cloud, hextech', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', {
			...swiftnessBootsCommon,
			level: 18,
			dragonStacks: ['Mountain', 'Cloud', 'Hextech'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 0.938,
			abilityHaste: 15,
			moveSpeed: 432,
		});
	});
});

test('Rammus, dragons & percentage items', async (t) => {
	const adItemsCommon: IOverrides<'Rammus'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'movementspeed',
				defensive: 'tenacity',
			},
		},
		items: [ITEMS_BY_NAME.infinityEdge, ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.krakenSlayer, ITEMS_BY_NAME.collector, ITEMS_BY_NAME.botrk, ITEMS_BY_NAME.ldr],
	};

	await t.test('lvl 18, ad', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', adItemsCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 469,
		});
	});

	await t.test('lvl 18, ad, infernal', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...adItemsCommon,
			dragonStacks: ['Infernal'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 483,
		});
	});

	// const apTankItemsCommon: IOverrides<'Rammus'> = {
	// 	level: adItemsCommon.level,
	// 	runes: adItemsCommon.runes,
	// 	items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.forceOfNature, ITEMS_BY_NAME.bandlepipes, ITEMS_BY_NAME.rabadon],
	// };
});
