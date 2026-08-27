import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import type { IDragonName, IItem } from '@lolcalc/data/types.js';
import assert from 'node:assert';
import test from 'node:test';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { AbilityType, EFFECT_OBJECT_NAME } from '@lolcalc/shared';
import fixture from '../fixtures/16.16.1.fixture.json' with { type: 'json' };
import { overridesAppliedEffect, setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('16.16 Rammus', async (t) => {
	await t.test('W when shredded', async () => {
		const sourceCommon: IOverrides<'Rammus'> = {
			level: 2,
			runes: {
				shards: {
					offensive: 'cdrscaling',
					flex: 'healthscaling',
					defensive: 'healthscaling',
				},
			},
			items: [],
			abilityLevels: { w: 1 },
		};
		const rell = await setupDamageSource(fixture, 'Rell', {
			level: 18,
		});

		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...sourceCommon,
			appliedEffects: [
				overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.blackCleaverCarve), [1]),
				overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.bloodletterVileDecay), [1]),
			],
		});

		const rellPEffect = damageSource.addEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.rellPBreakMold), undefined, undefined, rell, rell.champion.value!);
		await rellPEffect.newDataPromise;

		const blackCleaverEffect = damageSource.getEffect(EFFECT_OBJECT_NAME.blackCleaverCarve)?.[0]!;
		const bloodletterEffect = damageSource.getEffect(EFFECT_OBJECT_NAME.bloodletterVileDecay)?.[0]!;
		blackCleaverEffect.data.value[0] = 5;
		bloodletterEffect.data.value[0] = 4;
		rellPEffect.data.value[0] = 5;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 71,
			armor: 16,
			magicResist: 13,
		}, damageSource);

		damageSource.internalData.value.defensiveCurl = 1;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 79,
			armor: 46,
			magicResist: 35,
		}, damageSource);
	});
});

test('16.16 Vladimir passive interactions', async (t) => {
	const sourceCommon: IOverrides<'Vladimir'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [],
	};

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 20,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 665);
	});

	const flatItems: IItem[] = [ITEMS_BY_NAME.ludensEcho, ITEMS_BY_NAME.heartsteel, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.archangelsStaff];

	await t.test('flat item increases', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: flatItems,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 220,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 1837);
	});

	await t.test('rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: flatItems.concat(ITEMS_BY_NAME.rabadon),
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 455,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 2189);
	});

	await t.test('riftmaker', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: flatItems.concat(ITEMS_BY_NAME.riftmaker),
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 336,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 2299);
	});

	await t.test('rabadon, riftmaker', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: flatItems.concat(ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.riftmaker),
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 616,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 2685);
	});

	const bloodmailDragonFlatItems: IItem[] = [ITEMS_BY_NAME.ludensEcho, ITEMS_BY_NAME.heartsteel, ITEMS_BY_NAME.bootsOfSwiftness];

	await t.test('bloodmail', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: bloodmailDragonFlatItems.concat(ITEMS_BY_NAME.overlordsBloodmail),
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 127,
			abilityPower: 169,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 2275);
	});

	const dragonStacks: IDragonName[] = ['Infernal', 'Infernal', 'Infernal', 'Mountain'];

	await t.test('dragons | flat items', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: bloodmailDragonFlatItems,
			dragonStacks,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 60,
			abilityPower: 164,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 1740);
	});

	await t.test('dragons | rabadon, riftmaker', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: bloodmailDragonFlatItems.concat(ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.riftmaker),
			dragonStacks,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 558,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 2583);
	});

	await t.test('dragons | rabadon, riftmaker, bloodmail', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: bloodmailDragonFlatItems.concat(ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.overlordsBloodmail),
			dragonStacks,
			currentHealth: 1244,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 177,
			abilityPower: 599,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 3133);
	});

	await t.test('dragons | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: bloodmailDragonFlatItems,
			dragonStacks,
			roleQuest: 'mid',
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 60,
			abilityPower: 199,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 1753);
	});

	await t.test('dragons | mid quest | all items', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: bloodmailDragonFlatItems.concat(ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.overlordsBloodmail),
			dragonStacks,
			roleQuest: 'mid',
			currentHealth: 1247,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 187,
			abilityPower: 663,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 3171);
	});
});

test.only('16.16 Ryze passive interactions', async (t) => {
	t.runOnly(true);
	const sourceCommon: IOverrides<'Ryze'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
	};

	await t.test('base', async (t) => {
		await t.test('blackfire torch', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.blackfireTorch],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				abilityPower: 98,
			}, damageSource);
			assert.equal(damageSource.maxAbilityResource.value, 988);
		});

		await t.test('blackfire torch, rabadon', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.rabadon],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				abilityPower: 296,
			}, damageSource);
			assert.equal(damageSource.maxAbilityResource.value, 1166);
		});

		await t.test('blackfire torch, seraph', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.seraphsEmbrace],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				abilityPower: 208,
			}, damageSource);
			assert.equal(damageSource.maxAbilityResource.value, 2295);
		});

		await t.test('blackfire torch, seraph, rabadon', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.rabadon],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				abilityPower: 451,
			}, damageSource);
			assert.equal(damageSource.maxAbilityResource.value, 2757);
		});

		await t.test('blackfire torch+, seraph, rabadon', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.rabadon],
				internalItemData: { bBlaze: 1 } satisfies IInternalItemDataOf<'blackfireTorch'>,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				abilityPower: 466,
			}, damageSource);
			assert.equal(damageSource.maxAbilityResource.value, 2785);
		});

		await t.test('seraph, muramana, fimbulwinter, rabadon', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.rabadon],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 182,
				abilityPower: 395,
			}, damageSource);
			assert.equal(damageSource.maxHealth.value, 1881);
			assert.equal(damageSource.maxAbilityResource.value, 4604);
		});

		await t.test('seraph, muramana, fimbulwinter, bloodmail', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.overlordsBloodmail],
				currentHealth: 848,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 275,
				abilityPower: 139,
			}, damageSource);
			assert.equal(damageSource.maxHealth.value, 2304);
			assert.equal(damageSource.maxAbilityResource.value, 3759);
		});

		await t.test('seraph, muramana, fimbulwinter, rabadon, bloodmail', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.overlordsBloodmail],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 257,
				abilityPower: 395,
			}, damageSource);
			assert.equal(damageSource.maxHealth.value, 2431);
			assert.equal(damageSource.maxAbilityResource.value, 4604);
		});

		await t.test('seraph, muramana, fimbulwinter, riftmaker', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.riftmaker],
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 174,
				abilityPower: 267,
			}, damageSource);
			assert.equal(damageSource.maxHealth.value, 2167);
			assert.equal(damageSource.maxAbilityResource.value, 4179);
		});

		await t.test('seraph, muramana, fimbulwinter, rabadon, bloodmail, riftmaker', async () => {
			const damageSource = await setupDamageSource(fixture, 'Ryze', {
				...sourceCommon,
				items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.riftmaker],
				currentHealth: 1232,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 306,
				abilityPower: 559,
			}, damageSource);
			assert.equal(damageSource.maxHealth.value, 2862);
			assert.equal(damageSource.maxAbilityResource.value, 5143);
		});
	});
});
