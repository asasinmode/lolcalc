import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalDragonDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import test from 'node:test';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { AbilityType, EFFECT_OBJECT_NAME } from '@lolcalc/shared';
import fixture from '../fixtures/16.13.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Cassiopeia ms items & dragons', async (t) => {
	const sourceCommon: IOverrides<'Cassiopeia'> = {
		level: 2,
		runes: {
			shards: {
				offensive: 'cdrscaling',
				flex: 'movementspeed',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.experimentalHexplate, ITEMS_BY_NAME.blackCleaver, ITEMS_BY_NAME.trinity, ITEMS_BY_NAME.phage, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.shurelya],
		dragonStacks: ['Mountain', 'Infernal'],
	};

	await t.test('lvl 5 | youmuu+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Cassiopeia', {
			level: 5,
			items: [ITEMS_BY_NAME.youmuu],
			internalItemData: { haunt: 1, wStep: 0 } satisfies IInternalItemDataOf<'youmuu'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 362,
		});

		(damageSource.internalItemData.value as IInternalItemDataOf<'youmuu'>).wStep = 1;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 420,
		});
	});

	await t.test('lvl 2 | phage+, black cleaver+, trinity force+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Cassiopeia', {
			...sourceCommon,
			internalItemData: { rage: 1, fervor: 1, carve: 0, quicken: 1 } satisfies IInternalItemDataOf<'phage' | 'blackCleaver' | 'trinity'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 192,
			abilityPower: 52,
			armor: 22,
			magicResist: 35,
			attackSpeed: 0.977,
			abilityHaste: 58,
			moveSpeed: 467,
		});
	});

	await t.test('lvl 6 | cloud stack+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Cassiopeia', {
			...sourceCommon,
			level: 6,
			dragonStacks: sourceCommon.dragonStacks!.concat('Cloud'),
			internalDragonData: { isOOC: 1 } satisfies IInternalDragonDataOf<'Cloud', 'stack'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			moveSpeed: 445,
		});
	});

	await t.test('lvl 6 | experimental hexplate+, shurelya+ | cloud stack+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Cassiopeia', {
			...sourceCommon,
			level: 6,
			dragonStacks: sourceCommon.dragonStacks!.concat('Cloud'),
			internalDragonData: { isOOC: 1 } satisfies IInternalDragonDataOf<'Cloud', 'stack'>,
			internalItemData: { iSpeech: 1, overdrive: 1 } satisfies IInternalItemDataOf<'experimentalHexplate' | 'shurelya'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 1.235,
			moveSpeed: 558,
		});
	});

	await t.test('lvl 11 | black cleaver+, trinity+, phage+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Cassiopeia', {
			...sourceCommon,
			level: 11,
			roleQuest: 'mid',
			dragonStacks: sourceCommon.dragonStacks!.concat('Cloud'),
			internalItemData: { quicken: 1, fervor: 1, carve: 0, rage: 1 } satisfies IInternalItemDataOf<'blackCleaver' | 'trinity' | 'phage'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 244,
			abilityPower: 56,
			moveSpeed: 490,
		});
	});

	await t.test('lvl 18 | shurelya+, experimental hexplate+ | cloud soul & stack+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Cassiopeia', {
			...sourceCommon,
			level: 18,
			roleQuest: 'mid',
			dragonStacks: sourceCommon.dragonStacks!.concat('Cloud', 'Cloud'),
			dragonSoul: 'Cloud',
			internalDragonData: { isOOC: 1, hasUlted: 1 } satisfies IInternalDragonDataOf<'Cloud', 'stack' | 'soul'>,
			internalItemData: { iSpeech: 1, overdrive: 1 } satisfies IInternalItemDataOf<'shurelya' | 'experimentalHexplate'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 280,
			attackSpeed: 1.362,
			moveSpeed: 817,
		});
	});

	await t.test('lvl 18 | black cleaver+, trinity+, phage+ | cloud soul+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Cassiopeia', {
			...sourceCommon,
			level: 18,
			roleQuest: 'mid',
			dragonStacks: sourceCommon.dragonStacks!.concat('Cloud', 'Cloud'),
			dragonSoul: 'Cloud',
			internalItemData: { quicken: 1, fervor: 1, carve: 0, rage: 1, iSpeech: 1, overdrive: 1 } satisfies IInternalItemDataOf<'blackCleaver' | 'trinity' | 'phage' | 'shurelya' | 'experimentalHexplate'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 276,
			moveSpeed: 705,
		});
	});
});

test('Heal, ghost, swiftmarch', async (t) => {
	const sourceCommon: IOverrides<'Cassiopeia' | 'Amumu'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'movementspeed',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.cosmicDrive],
		roleQuest: 'mid',
		dragonStacks: ['Cloud'],
		internalDragonData: { isOOC: 1 } satisfies IInternalDragonDataOf<'Cloud', 'stack'>,
	};

	await t.test('Amumu', async (t) => {
		await t.test('base', async () => {
			const damageSource = await setupDamageSource(fixture, 'Amumu', sourceCommon);

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				abilityPower: 109,
				moveSpeed: 440,
			}, damageSource);
		});

		await t.test('ghost', async () => {
			const damageSource = await setupDamageSource(fixture, 'Amumu', {
				...sourceCommon,
				internalData: { applyPassive: 0 },
				appliedEffects: [{ abilityId: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ghost), data: [1] }],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				abilityPower: 112,
				moveSpeed: 501,
			}, damageSource);
		});

		await t.test('ghost & heal', async () => {
			const damageSource = await setupDamageSource(fixture, 'Amumu', {
				...sourceCommon,
				internalData: { applyPassive: 0 },
				appliedEffects: [
					{ abilityId: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ghost), data: [1] },
					{ abilityId: GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.heal), data: [1] },
				],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				abilityPower: 117,
				moveSpeed: 582,
			}, damageSource);
		});
	});

	// await t.test('lvl 1 | summoner spells base', async () => {
	// 	const damageSource = await setupDamageSource(fixture, 'Cassiopeia', sourceCommon);

	// 	typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
	// 		attackDamage: 53,
	// 		abilityPower: 108,
	// 		moveSpeed: 427,
	// 	}, damageSource);
	// });
});
