import test from 'node:test';
import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/26.21.1.fixture.json' with { type: 'json' };
import { forceShapeshift, setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('26.21 Sion passive hp regen', async (t) => {
	const sourceCommon: IOverrides<'Sion'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		roleQuest: 'mid',
		items: [ITEMS_BY_NAME.doransShield, ITEMS_BY_NAME.rejuvenationBead],
	};

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Sion', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 22 }, damageSource);

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 0 }, damageSource);
	});

	await t.test('spirit visage', async () => {
		const damageSource = await setupDamageSource(fixture, 'Sion', {
			...sourceCommon,
			items: sourceCommon.items!.concat(ITEMS_BY_NAME.spiritVisage),
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 39 }, damageSource);

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 8, lifeSteal: 125 }, damageSource);
	});

	await t.test('immortal path', async () => {
		const damageSource = await setupDamageSource(fixture, 'Sion', {
			...sourceCommon,
			items: sourceCommon.items!.concat(ITEMS_BY_NAME.immortalPath),
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 22 }, damageSource);

		damageSource.currentHealth.value = 380;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 25 }, damageSource);

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 3, lifeSteal: 112 }, damageSource);
	});

	await t.test('spirit visage, immortal path', async () => {
		const damageSource = await setupDamageSource(fixture, 'Sion', {
			...sourceCommon,
			items: sourceCommon.items!.concat(ITEMS_BY_NAME.immortalPath, ITEMS_BY_NAME.spiritVisage),
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 39 }, damageSource);

		damageSource.currentHealth.value = 77;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 42, omnivamp: 6 }, damageSource);

		forceShapeshift(damageSource, 1);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, { hpRegen: 11, lifeSteal: 144 }, damageSource);
	});
});
