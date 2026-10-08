import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import test from 'node:test';
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 134,
			magicResist: 106,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 164,
			magicResist: 128,
		}, damageSource, 'jakSho');
	});

	await t.test('mountains', async () => {
		const damageSource = await setupDamageSource(fixture, 'Graves', {
			...sourceCommon,
			level: 2,
			dragonStacks: ['Mountain', 'Mountain', 'Mountain', 'Mountain'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 165,
			magicResist: 128,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 201,
			magicResist: 154,
		}, damageSource, 'jakSho');
	});
});
