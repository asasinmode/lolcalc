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

test('26.19 Jayce', async (t) => {
	const sourceCommon: IOverrides<'Jayce'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.thornmail, ITEMS_BY_NAME.kaenicRookern, ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.endlessHunger],
	};

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jayce', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 227,
			magicResist: 177,
		}, damageSource, 'cannon');

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 269,
			magicResist: 219,
		}, damageSource, 'hammer');

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 318,
			magicResist: 269,
		}, damageSource, 'hammer jaksho');

		forceShapeshift(damageSource, 0);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 263,
			magicResist: 215,
		}, damageSource, 'cannon jaksho');

		forceShapeshift(damageSource, 1);
		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 0;
		damageSource.currentHealth.value = 490;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 398,
			armor: 271,
			magicResist: 221,
		}, damageSource, 'hammer bloodmail');

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		damageSource.currentHealth.value = 544;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 398,
			armor: 320,
			magicResist: 272,
		}, damageSource, 'hammer jaksho bloodmail');
	});

	await t.test('2 infernals 2 mountains', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jayce', {
			...sourceCommon,
			dragonStacks: ['Infernal', 'Infernal', 'Mountain', 'Mountain'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 250,
			magicResist: 195,
		}, damageSource, 'cannon');

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 297,
			magicResist: 242,
		}, damageSource, 'hammer');

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 351,
			magicResist: 298,
		}, damageSource, 'hammer jaksho');

		forceShapeshift(damageSource, 0);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 289,
			magicResist: 236,
		}, damageSource, 'cannon jaksho');

		forceShapeshift(damageSource, 1);
		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 0;
		damageSource.currentHealth.value = 218;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 419,
			armor: 299,
			magicResist: 245,
		}, damageSource, 'hammer bloodmail');

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		damageSource.currentHealth.value = 544;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 398,
			armor: 354,
			magicResist: 301,
		}, damageSource, 'hammer jaksho bloodmail');
	});

	/* nothing other than AD changes, jayce's R doesn't factor in mid quest AD */
	await t.test('2 infernals 2 mountains | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jayce', {
			...sourceCommon,
			dragonStacks: ['Infernal', 'Infernal', 'Mountain', 'Mountain'],
			roleQuest: 'mid',
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 250,
			magicResist: 195,
		}, damageSource, 'cannon');

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 297,
			magicResist: 242,
		}, damageSource, 'hammer');

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 351,
			magicResist: 298,
		}, damageSource, 'hammer jaksho');

		forceShapeshift(damageSource, 0);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 289,
			magicResist: 236,
		}, damageSource, 'cannon jaksho');

		forceShapeshift(damageSource, 1);
		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 0;
		damageSource.currentHealth.value = 228;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 440,
			armor: 299,
			magicResist: 245,
		}, damageSource, 'hammer bloodmail');

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		damageSource.currentHealth.value = 481;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 440,
			armor: 354,
			magicResist: 301,
		}, damageSource, 'hammer jaksho bloodmail');
	});
});
