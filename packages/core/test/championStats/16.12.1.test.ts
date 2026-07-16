import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalDragonDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import type { IDragonName } from '@lolcalc/data/types.js';
import assert from 'node:assert';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.12.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Evelynn dragons', async (t) => {
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

	await t.test('lvl 18 | mixed | " | jak\'sho+, bloodmail+ | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...mixedItemsCommon,
			currentHealth: 934,
			internalItemData: { vbResistance: 1 } satisfies IInternalItemDataOf<'jakSho'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 262,
			abilityPower: 475,
			armor: 179,
			magicResist: 132,
		});
		/* game shows 3596, see help page for known discrepancies */
		assert.equal(damageSource.maxHealth.value, 3595);
	});

	await t.test('bloodmail, mountain/infernal & mid quest interactions', async (t) => {
		const sourceCommon: IOverrides<'Rammus'> = {
			level: 4,
			runes: {
				shards: {
					offensive: 'cdrscaling',
					flex: 'healthscaling',
					defensive: 'healthscaling',
				},
			},
			items: [ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.steraksGage, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.forceOfNature],
			abilityLevels: { w: 2 },
		};
		const dragonStacks: IDragonName[] = ['Mountain', 'Mountain', 'Infernal', 'Infernal'];

		await t.test('base', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', sourceCommon);

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 277,
				armor: 90,
				magicResist: 137,
				abilityHaste: 40,
				moveSpeed: 406,
			});

			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 301,
				armor: 168,
				magicResist: 222,
				abilityHaste: 43,
			}, 'W enabled');
		});

		await t.test('partial hp', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				currentHealth: 806,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 310,
				abilityHaste: 44,
			});

			damageSource.currentHealth.value = 812;
			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 337,
				armor: 168,
				magicResist: 222,
				abilityHaste: 48,
			}, 'W enabled');
		});

		await t.test('dragons', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				dragonStacks,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 297,
				armor: 99,
				magicResist: 150,
				abilityHaste: 42,
			});

			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 326,
				armor: 185,
				magicResist: 244,
				abilityHaste: 46,
			}, 'W enabled');
		});

		await t.test('mid quest', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				roleQuest: 'mid',
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 307,
				armor: 90,
				magicResist: 137,
				abilityHaste: 44,
			});

			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 333,
				armor: 168,
				magicResist: 222,
				abilityHaste: 47,
			}, 'W enabled');
		});

		await t.test('dragons | mid quest', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				dragonStacks,
				roleQuest: 'mid',
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 329,
				abilityHaste: 47,
				moveSpeed: 416,
			});
		});

		await t.test('dragons | mid quest | partial hp', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				dragonStacks,
				roleQuest: 'mid',
				currentHealth: 800,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 366,
				abilityHaste: 51,
			});

			damageSource.currentHealth.value = 817;
			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 400,
				armor: 185,
				magicResist: 244,
				abilityHaste: 56,
			}, 'W enabled');
		});

		await t.test('dragons | partial hp', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				dragonStacks,
				currentHealth: 806,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 330,
				abilityHaste: 47,
			});
		});

		await t.test('mid quest | partial hp', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				roleQuest: 'mid',
				currentHealth: 806,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 343,
				abilityHaste: 48,
			});

			damageSource.currentHealth.value = 817;
			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 373,
				armor: 168,
				magicResist: 222,
				abilityHaste: 52,
			}, 'W enabled');
		});

		await t.test('dragons | partial hp | jak\'sho+, force of nature+', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				dragonStacks,
				currentHealth: 1200,
				internalItemData: { vbResistance: 1, steadfast: 1 } satisfies IInternalItemDataOf<'jakSho' | 'forceOfNature'>,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 349,
				armor: 114,
				magicResist: 283,
				abilityHaste: 49,
				moveSpeed: 426,
			});
		});

		await t.test('lvl 5 | dragons | mid quest | partial hp | jak\'sho+, force of nature+', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				level: 5,
				dragonStacks,
				currentHealth: 466,
				roleQuest: 'mid',
				internalItemData: { vbResistance: 1, steadfast: 1 } satisfies IInternalItemDataOf<'jakSho' | 'forceOfNature'>,
				abilityLevels: { w: 3 },
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 401,
				armor: 118,
				magicResist: 285,
				abilityHaste: 56,
				moveSpeed: 435,
			});

			damageSource.currentHealth.value = 459;
			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 462,
				armor: 248,
				magicResist: 476,
				abilityHaste: 64,
			}, 'W enabled');
		});
	});

	await t.test('W interactions', async (t) => {
		const sourceCommon: IOverrides<'Rammus'> = {
			level: 5,
			runes: {
				shards: {
					offensive: 'cdrscaling',
					flex: 'healthscaling',
					defensive: 'healthscaling',
				},
			},
			items: [ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.steraksGage, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.overlordsBloodmail],
			abilityLevels: { w: 3 },
		};
		const dragonStacks: IDragonName[] = ['Mountain', 'Mountain', 'Infernal', 'Infernal'];

		await t.test('base', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', sourceCommon);

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 263,
				armor: 94,
				magicResist: 83,
				abilityHaste: 38,
			});

			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 290,
				armor: 190,
				magicResist: 164,
				abilityHaste: 41,
			}, 'W enabled');

			damageSource.internalData.value.defensiveCurl = 0;
			(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 267,
				armor: 107,
				magicResist: 97,
				abilityHaste: 38,
			}, 'jak\'sho');

			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 300,
				armor: 225,
				magicResist: 197,
				abilityHaste: 42,
			}, 'W enabled & jak\'sho');
		});

		await t.test('dragons', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				dragonStacks,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 282,
				armor: 103,
				magicResist: 92,
				abilityHaste: 40,
			});

			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 313,
				armor: 209,
				magicResist: 181,
				abilityHaste: 44,
			}, 'W enabled');

			damageSource.internalData.value.defensiveCurl = 0;
			(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 286,
				armor: 118,
				magicResist: 107,
				abilityHaste: 41,
			}, 'jak\'sho');

			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 325,
				armor: 248,
				magicResist: 217,
				abilityHaste: 46,
			}, 'W enabled & jak\'sho');
		});

		await t.test('dragons, partial hp, jak\'sho+', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				dragonStacks,
				currentHealth: 755,
				internalItemData: { vbResistance: 1 } satisfies IInternalItemDataOf<'jakSho'>,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 318,
				armor: 118,
				magicResist: 107,
				abilityHaste: 45,
			});

			damageSource.internalData.value.defensiveCurl = 1;
			damageSource.currentHealth.value = 360;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 361,
				armor: 248,
				magicResist: 217,
				abilityHaste: 50,
			}, 'W enabled');
		});

		await t.test('dragons, partial hp, jak\'sho+, mid quest', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...sourceCommon,
				dragonStacks,
				roleQuest: 'mid',
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 312,
				armor: 103,
				magicResist: 92,
				abilityHaste: 44,
			});

			damageSource.internalData.value.defensiveCurl = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 345,
				armor: 209,
				magicResist: 181,
				abilityHaste: 48,
			}, 'W enabled');

			damageSource.internalData.value.defensiveCurl = 0;
			damageSource.currentHealth.value = 276;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 347,
				armor: 103,
				magicResist: 92,
				abilityHaste: 49,
			}, 'partial hp');

			damageSource.currentHealth.value = 443;
			(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 353,
				armor: 118,
				magicResist: 107,
				abilityHaste: 49,
			}, 'jak\'sho');

			damageSource.currentHealth.value = 285;
			damageSource.internalData.value.defensiveCurl = 1;
			(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 0;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 384,
				armor: 209,
				magicResist: 181,
				abilityHaste: 53,
			}, 'W enabled & partial hp');

			damageSource.currentHealth.value = 538;
			(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 399,
				armor: 248,
				magicResist: 217,
				abilityHaste: 55,
			}, 'W enabled & partial hp & jak\'sho');
		});
	});
});

test('Briar, overlord\'s bloodmail & infernal', async (t) => {
	const mixedItemsCommon: IOverrides<'Briar'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.endlessHunger],
	};
	const dragonStacks: IDragonName[] = ['Infernal', 'Infernal', 'Infernal', 'Mountain'];

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...mixedItemsCommon,
			currentHealth: 1943,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 248,
			abilityPower: 194,
			abilityHaste: 59,
		});
	});

	await t.test('3 infernals 1 mountain', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...mixedItemsCommon,
			dragonStacks,
			currentHealth: 1738,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 271,
			abilityPower: 212,
			abilityHaste: 62,
		});
	});

	await t.test('" | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...mixedItemsCommon,
			roleQuest: 'mid',
			dragonStacks,
			currentHealth: 1738,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 283,
			abilityPower: 251,
			abilityHaste: 64,
		});
	});
});
