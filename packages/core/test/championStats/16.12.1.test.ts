import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalDragonDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
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
	};

	await t.test('lvl 18 | sorc shoes | mountain', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.zhonya, ITEMS_BY_NAME.shadowflame, ITEMS_BY_NAME.stormsurge, ITEMS_BY_NAME.sorcerersShoes, ITEMS_BY_NAME.lichBane],
			dragonStacks: ['Mountain'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 719,
			armor: 175,
			magicResist: 70,
			abilityHaste: 10,
			moveSpeed: 423,
			flatMagicPen: 42,
		});
	});

	const swiftnessBootsCommon = {
		...sourceCommon,
		items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.zhonya, ITEMS_BY_NAME.shadowflame, ITEMS_BY_NAME.stormsurge, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.lichBane],
	};

	await t.test('lvl 18 | mountain, cloud+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', {
			...swiftnessBootsCommon,
			dragonStacks: ['Mountain', 'Cloud'],
			internalDragonData: { isOOC: 1 } satisfies IInternalDragonDataOf<'Cloud', 'stack'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 448,
			slowResist: 29,
		});
	});

	await t.test('lvl 18 | swiftness boots | mountain, cloud, hextech', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', {
			...swiftnessBootsCommon,
			dragonStacks: ['Mountain', 'Cloud', 'Hextech'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 0.938,
			abilityHaste: 15,
			moveSpeed: 432,
			slowResist: 29,
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

	await t.test('lvl 18 | ad | infernal, chemtech, mountain', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...adItemsCommon,
			dragonStacks: ['Infernal', 'Chemtech', 'Mountain'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 484,
			healShieldPower: 6,
			tenacity: 20,
			armor: 117,
			magicResist: 70,
		});
	});

	await t.test('lvl 18 | ad | infernal, chemtech, mountain, cloud | cloud soul', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...adItemsCommon,
			dragonStacks: ['Infernal', 'Chemtech', 'Mountain', 'Cloud'],
			dragonSoul: 'Cloud',
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 407,
		});
	});

	const apTankItemsCommon: IOverrides<'Rammus'> = {
		level: adItemsCommon.level,
		runes: adItemsCommon.runes,
		items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.forceOfNature, ITEMS_BY_NAME.bandlepipes, ITEMS_BY_NAME.rabadon],
		dragonStacks: ['Infernal', 'Chemtech', 'Mountain', 'Cloud'],
		dragonSoul: 'Cloud',
	};

	await t.test('lvl 18 | ap tank | "', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', apTankItemsCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 174,
			abilityPower: 291,
			armor: 185,
			magicResist: 196,
			moveSpeed: 462,
		});
	});

	await t.test('lvl 18 | ap tank | " | bandlepipes+ jak\'sho+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...apTankItemsCommon,
			internalItemData: { fanfare: 1, vbResistance: 1 } satisfies IInternalItemDataOf<'bandlepipes' | 'jakSho'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 183,
			armor: 206,
			magicResist: 234,
			moveSpeed: 479,
			attackSpeed: 1.123,
		});
	});

	await t.test('lvl 18 | ap tank | " | bandlepipes+, blackfire torch+ | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...apTankItemsCommon,
			roleQuest: 'mid',
			internalItemData: { fanfare: 1, bBlaze: 1 } satisfies IInternalItemDataOf<'bandlepipes' | 'blackfireTorch'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 179,
			abilityPower: 353,
			moveSpeed: 485,
			attackSpeed: 1.123,
			slowResist: 52,
		});
	});

	const mixedItemsCommon: IOverrides<'Rammus'> = {
		level: adItemsCommon.level,
		runes: adItemsCommon.runes,
		roleQuest: 'mid',
		items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.rabadon],
		dragonStacks: ['Infernal', 'Chemtech', 'Mountain', 'Cloud'],
		dragonSoul: 'Cloud',
	};

	await t.test('lvl 18 | mixed | " | jak\'sho+, riftmaker+, blackfire torch+ | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...mixedItemsCommon,
			internalItemData: { vbResistance: 1, corruption: 4, bBlaze: 1 } satisfies IInternalItemDataOf<'jakSho' | 'riftmaker' | 'blackfireTorch'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 235,
			abilityPower: 489,
			moveSpeed: 459,
			omnivamp: 10,
		});
	});

	await t.test('lvl 18 | mixed | " cloud soul+ | - | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...mixedItemsCommon,
			internalDragonData: { isOOC: 1, hasUlted: 1 } satisfies IInternalDragonDataOf<'Cloud', 'stack' | 'soul'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 483,
			moveSpeed: 575,
		});
	});

	await t.test('lvl 18 | mixed | " | jak\'sho+, bloodmail+ | mid quest', { only: true }, async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...mixedItemsCommon,
			currentHealth: 932,
			internalItemData: { vbResistance: 1 } satisfies IInternalItemDataOf<'jakSho'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 257,
			abilityPower: 475,
			armor: 179,
			magicResist: 132,
		});
		/* game shows 3596, see help page for known discrepancies */
		assert.equal(damageSource.maxHealth.value, 3595);
	});
});
