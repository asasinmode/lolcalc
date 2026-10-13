import test from 'node:test';
import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/26.20.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('26.20 Graves E', async (t) => {
	const sourceCommon: IOverrides<'Graves'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		internalData: { eStacks: 8 },
		items: [ITEMS_BY_NAME.jakSho],
	};

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Graves', sourceCommon);

		typedPartialDeepStrictEqual(
			damageSource.computed.formattedStatTotals.value,
			{
				armor: 134,
				magicResist: 106,
			},
			damageSource,
		);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(
			damageSource.computed.formattedStatTotals.value,
			{
				armor: 164,
				magicResist: 128,
			},
			damageSource,
			'jakSho',
		);
	});

	await t.test('mountains', async () => {
		const damageSource = await setupDamageSource(fixture, 'Graves', {
			...sourceCommon,
			level: 2,
			dragonStacks: ['Mountain', 'Mountain', 'Mountain', 'Mountain'],
		});

		typedPartialDeepStrictEqual(
			damageSource.computed.formattedStatTotals.value,
			{
				armor: 165,
				magicResist: 128,
			},
			damageSource,
		);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(
			damageSource.computed.formattedStatTotals.value,
			{
				armor: 201,
				magicResist: 154,
			},
			damageSource,
			'jakSho',
		);
	});
});

test('26.20 Malphite W', async (t) => {
	const sourceCommon: IOverrides<'Malphite'> = {
		level: 9,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		internalData: { isPassiveActive: 0 },
		items: [ITEMS_BY_NAME.jakSho],
		abilityLevels: { w: 5 },
	};

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Malphite', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { armor: 154 }, damageSource);

		damageSource.internalData.value.isPassiveActive = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { armor: 225 }, damageSource, 'with passive');

		damageSource.internalData.value.isPassiveActive = 0;
		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { armor: 171 }, damageSource, 'jakSho');

		damageSource.internalData.value.isPassiveActive = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { armor: 251 }, damageSource, 'jakSho + passive');
	});

	await t.test('mountains', async () => {
		const damageSource = await setupDamageSource(fixture, 'Malphite', {
			...sourceCommon,
			dragonStacks: ['Mountain', 'Mountain', 'Mountain', 'Mountain'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { armor: 185 }, damageSource);

		damageSource.internalData.value.isPassiveActive = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { armor: 270 }, damageSource, 'with passive');

		damageSource.internalData.value.isPassiveActive = 0;
		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { armor: 206 }, damageSource, 'jakSho');

		damageSource.internalData.value.isPassiveActive = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { armor: 301 }, damageSource, 'jakSho + passive');
	});
});
