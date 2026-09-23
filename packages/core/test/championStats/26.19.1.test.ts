import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { nextTick } from 'vue';
import fixture from '../fixtures/26.19.1.fixture.json' with { type: 'json' };
import { forceShapeshift, setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test.only('26.19 Jayce', async (t) => {
	t.runOnly(true);
	const sourceCommon: IOverrides<'Jayce'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.thornmail, ITEMS_BY_NAME.forceOfNature, ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.endlessHunger],
	};

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jayce', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 152,
			magicResist: 97,
		}, damageSource);

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 182,
			magicResist: 127,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 205,
			magicResist: 150,
		}, damageSource);

		forceShapeshift(damageSource, 0);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 166,
			magicResist: 111,
		}, damageSource);

		forceShapeshift(damageSource, 1);
		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 0;
		damageSource.currentHealth.value = 550;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 183,
			magicResist: 128,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		damageSource.currentHealth.value = 562;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 206,
			magicResist: 151,
		}, damageSource);
	});

	await t.test('2 infernals 2 mountains', { only: true }, async () => {
		const damageSource = await setupDamageSource(fixture, 'Jayce', {
			...sourceCommon,
			dragonStacks: ['Infernal', 'Infernal', 'Mountain', 'Mountain'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 167,
			magicResist: 107,
		}, damageSource);

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 201,
			magicResist: 140,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		forceShapeshift(damageSource, 0);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 182,
			magicResist: 122,
		}, damageSource);

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 226,
			magicResist: 165,
		}, damageSource);

		forceShapeshift(damageSource, 1);
		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 0;
		damageSource.currentHealth.value = 575;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 201,
			magicResist: 141,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		damageSource.currentHealth.value = 595;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 227,
			magicResist: 166,
		}, damageSource);
	});
});
