import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.14.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Spirit Visage/Immortal Path heal stats', async (t) => {
	const lotsOfLifestealItems = [ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.spiritVisage, ITEMS_BY_NAME.mercurialScimitar, ITEMS_BY_NAME.botrk, ITEMS_BY_NAME.hextechGunblade, ITEMS_BY_NAME.immortalPath];
	const lotsOfLifestealItemsData = { slay: 10, applyHSMult: 0 } satisfies IInternalItemDataOf<'immortalPath'>;

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
			}, damageSource);
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
			}, damageSource);
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
			}, damageSource);
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
			}, damageSource);
		});

		await t.test('lots of lifesteal | spirit visage', async () => {
			const damageSource = await setupDamageSource(fixture, 'Briar', {
				...baseCommon,
				items: lotsOfLifestealItems,
				internalItemData: lotsOfLifestealItemsData,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				lifeSteal: 44,
				omnivamp: 25,
			}, damageSource);
		});

		await t.test('lots of lifesteal | spirit visage, immortal path', async () => {
			const damageSource = await setupDamageSource(fixture, 'Briar', {
				...baseCommon,
				items: lotsOfLifestealItems,
				internalItemData: lotsOfLifestealItemsData,
				currentHealth: 92,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				lifeSteal: 51,
				omnivamp: 29,
			}, damageSource);
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
			}, damageSource);
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
			}, damageSource);
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
			}, damageSource);
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
			}, damageSource);
		});

		await t.test('lots of lifesteal | spirit visage', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...baseCommon,
				level: 2,
				items: lotsOfLifestealItems,
				internalItemData: lotsOfLifestealItemsData,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 21,
				lifeSteal: 44,
				omnivamp: 25,
			}, damageSource);
		});

		await t.test('lots of lifesteal | immortal path', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...baseCommon,
				level: 2,
				currentHealth: 282,
				items: [ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.rejuvenationBead, ITEMS_BY_NAME.mercurialScimitar, ITEMS_BY_NAME.botrk, ITEMS_BY_NAME.hextechGunblade, ITEMS_BY_NAME.immortalPath],
				internalItemData: lotsOfLifestealItemsData,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 19,
				lifeSteal: 39,
				omnivamp: 22,
			}, damageSource);
		});

		await t.test('lots of lifesteal | spirit visage, immortal path', async () => {
			const damageSource = await setupDamageSource(fixture, 'Rammus', {
				...baseCommon,
				level: 2,
				currentHealth: 296,
				items: lotsOfLifestealItems,
				internalItemData: lotsOfLifestealItemsData,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				hpRegen: 23,
				lifeSteal: 51,
				omnivamp: 29,
			}, damageSource);
		});
	});
});
