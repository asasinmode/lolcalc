import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import type { IItem } from '@lolcalc/data/types.js';
import test from 'node:test';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { AbilityType, EFFECT_OBJECT_NAME } from '@lolcalc/shared';
import fixture from '../fixtures/16.14.1.fixture.json' with { type: 'json' };
import { overridesAppliedEffect, setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Spirit Visage/Immortal Path heal stats', async (t) => {
	const lotsOfLifestealItems = [ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.spiritVisage, ITEMS_BY_NAME.mercurialScimitar, ITEMS_BY_NAME.botrk, ITEMS_BY_NAME.hextechGunblade, ITEMS_BY_NAME.immortalPath];
	const lotsOfLifestealItemsData = { slay: 10 } satisfies IInternalItemDataOf<'immortalPath'>;

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

test('Hecarim', async (t) => {
	const sourceCommon: IOverrides<'Hecarim'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'movementspeed',
				defensive: 'health',
			},
		},
	};

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 72,
			moveSpeed: 354,
		}, damageSource);
	});

	await t.test('ghost', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', {
			...sourceCommon,
			appliedEffects: [overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ghost), [1])],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 82,
			moveSpeed: 432,
		}, damageSource);
	});

	const msItems: IItem[] = [ITEMS_BY_NAME.youmuu, ITEMS_BY_NAME.protoplasmHarness, ITEMS_BY_NAME.deadMansPlate, ITEMS_BY_NAME.bandlepipes, ITEMS_BY_NAME.blackCleaver, ITEMS_BY_NAME.experimentalHexplate];

	await t.test('ms items ooc', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', {
			...sourceCommon,
			items: msItems,
			internalItemData: { shipwrecker: 59, haunt: 1, wStep: 0 } satisfies IInternalItemDataOf<'youmuu' | 'deadMansPlate'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 215,
			moveSpeed: 416,
		}, damageSource);
	});

	await t.test('lvl 6 | ms items | ghost', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', {
			...sourceCommon,
			level: 6,
			items: msItems,
			internalItemData: { shipwrecker: 100, haunt: 0, wStep: 1, fanfare: 1, overdrive: 1, carve: 0, fervor: 1 } satisfies IInternalItemDataOf<'youmuu' | 'deadMansPlate' | 'experimentalHexplate' | 'bandlepipes' | 'blackCleaver'>,
			appliedEffects: [overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ghost), [1])],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 261,
			moveSpeed: 598,
		}, damageSource);
	});

	const bloodmailCommon: IOverrides<'Hecarim'> = {
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		level: 18,
		roleQuest: 'mid',
		items: [ITEMS_BY_NAME.crimsonLucidity, ITEMS_BY_NAME.youmuu, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.steraksGage, ITEMS_BY_NAME.lichBane],
	};

	await t.test('lvl 18 | bloodmail items | base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', {
			...bloodmailCommon,
			internalItemData: { haunt: 1, wStep: 0 } satisfies IInternalItemDataOf<'youmuu'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 418,
			abilityPower: 108,
			abilityHaste: 73,
			moveSpeed: 444,
		}, damageSource);
	});

	await t.test('lvl 18 | bloodmail items | crimson lucidity+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', {
			...bloodmailCommon,
			internalItemData: { noxianHaste: 1 } satisfies IInternalItemDataOf<'crimsonLucidity'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 422,
			abilityHaste: 73,
			moveSpeed: 457,
		}, damageSource);
	});

	await t.test('lvl 18 | bloodmail items | actives', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', {
			...bloodmailCommon,
			internalItemData: { noxianHaste: 1, haunt: 0, wStep: 1 } satisfies IInternalItemDataOf<'crimsonLucidity' | 'youmuu'>,
			appliedEffects: [overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ghost), [1])],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 458,
			abilityHaste: 78,
			moveSpeed: 597,
		}, damageSource);
	});

	await t.test('lvl 18 | bloodmail items | partial hp', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', {
			...bloodmailCommon,
			currentHealth: 375,
			internalItemData: { noxianHaste: 1, haunt: 0, wStep: 1 } satisfies IInternalItemDataOf<'crimsonLucidity' | 'youmuu'>,
			appliedEffects: [overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ghost), [1])],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 513,
			abilityHaste: 85,
			moveSpeed: 597,
		}, damageSource);
	});
});
