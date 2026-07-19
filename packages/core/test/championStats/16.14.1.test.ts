import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.14.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Spirit Visage/Immortal Path heal stats', async (t) => {
	await t.test('Briar', async (t) => {
		const baseCommon: IOverrides<'Briar'> = {
			level: 1,
			runes: {
				shards: {
					offensive: 'adaptive',
					flex: 'adaptive',
					defensive: 'health',
				},
			},
			roleQuest: 'mid',
			items: [ITEMS_BY_NAME.doransShield, ITEMS_BY_NAME.botrk, ITEMS_BY_NAME.hextechGunblade],
		};

		await t.test('base', async () => {
			const damageSource = await setupDamageSource(fixture, 'Briar', baseCommon);

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 4,
				lifeSteal: 10,
				omnivamp: 10,
			});
		});

		await t.test('immortal path', async () => {
			const damageSource = await setupDamageSource(fixture, 'Briar', {
				...baseCommon,
				items: baseCommon.items!.concat(ITEMS_BY_NAME.immortalPath),
				currentHealth: 124,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 6,
				lifeSteal: 11,
				omnivamp: 16,
			});
		});

		await t.test('spirit visage', async () => {
			const damageSource = await setupDamageSource(fixture, 'Briar', {
				...baseCommon,
				items: baseCommon.items!.concat(ITEMS_BY_NAME.spiritVisage),
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 5,
				lifeSteal: 13,
				omnivamp: 13,
			});
		});

		await t.test('spirit visage, immortal path', async () => {
			const damageSource = await setupDamageSource(fixture, 'Briar', {
				...baseCommon,
				items: baseCommon.items!.concat(ITEMS_BY_NAME.spiritVisage, ITEMS_BY_NAME.immortalPath),
				currentHealth: 270,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 8,
				lifeSteal: 14,
				omnivamp: 20,
			});
		});
	});

	await t.test('Rammus', async (t) => {
		const baseCommon: IOverrides<'Rammus'> = {
			level: 1,
			runes: {
				shards: {
					offensive: 'adaptive',
					flex: 'adaptive',
					defensive: 'health',
				},
			},
			roleQuest: 'mid',
			items: [ITEMS_BY_NAME.doransShield, ITEMS_BY_NAME.botrk, ITEMS_BY_NAME.hextechGunblade],
		};

		await t.test('base', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', baseCommon);

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 12,
				lifeSteal: 10,
				omnivamp: 10,
			});
		});

		await t.test('immortal path', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...baseCommon,
				items: baseCommon.items!.concat(ITEMS_BY_NAME.immortalPath),
				currentHealth: 175,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 13,
				lifeSteal: 11,
				omnivamp: 16,
			});
		});

		await t.test('spirit visage', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...baseCommon,
				items: baseCommon.items!.concat(ITEMS_BY_NAME.spiritVisage),
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 25,
				lifeSteal: 13,
				omnivamp: 13,
			});
		});

		await t.test('spirit visage, immortal path', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...baseCommon,
				items: baseCommon.items!.concat(ITEMS_BY_NAME.spiritVisage, ITEMS_BY_NAME.immortalPath),
				currentHealth: 560,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 27,
				lifeSteal: 14,
				omnivamp: 20,
			});
		});
	});
});
