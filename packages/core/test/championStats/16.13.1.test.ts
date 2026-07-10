import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalDragonDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
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
});
