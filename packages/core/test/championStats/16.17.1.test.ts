import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import type { IDragonName, IItem } from '@lolcalc/data/types.js';
import test from 'node:test';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { AbilityType, EFFECT_OBJECT_NAME } from '@lolcalc/shared';
import fixture from '../fixtures/16.17.1.fixture.json' with { type: 'json' };
import { overridesAppliedEffect, setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('16.17 adaptive force', async (t) => {
	const sourceCommon: IOverrides<'Amumu'> = {
		level: 1,
		internalData: { applyPassive: 0 },
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
	};

	await t.test('manamune', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.manamune, ITEMS_BY_NAME.ampTome, ITEMS_BY_NAME.ampTome],
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
	});

	await t.test('seraph', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.pickaxe, ITEMS_BY_NAME.longSword],
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'attackDamage',
		}, damageSource);
	});

	await t.test('rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.longSword, ITEMS_BY_NAME.longSword],
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
	});

	await t.test('dark seal', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.darkSeal, ITEMS_BY_NAME.hearthboundAxe],
			internalItemData: { glory: 10 } satisfies IInternalItemDataOf<'darkSeal'>,
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
	});

	await t.test('mejai', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.mejai, ITEMS_BY_NAME.bfSword],
			internalItemData: { glory: 25 } satisfies IInternalItemDataOf<'mejai'>,
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
	});

	await t.test('bloodmail tyranny', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.darkSeal, ITEMS_BY_NAME.ampTome],
		});

		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).tyranny = damageSource.stats.value.variables.bloodmailTyranny;
		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).retribution = damageSource.stats.value.variables.bloodmailRetribution;

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'attackDamage',
		}, damageSource);
	});

	await t.test('bloodmail retribution', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.aetherWisp, ITEMS_BY_NAME.ampTome],
			currentHealth: 470,
		});

		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).tyranny = damageSource.stats.value.variables.bloodmailTyranny;
		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).retribution = damageSource.stats.value.variables.bloodmailRetribution;

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'attackDamage',
		}, damageSource);
	});

	await t.test('sterak', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.steraksGage, ITEMS_BY_NAME.ampTome],
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'attackDamage',
		}, damageSource);
	});

	await t.test('staff of flowing water', async () => {
		const damageSource = await setupDamageSource(fixture, 'Lulu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.staffOfFlowingWater, ITEMS_BY_NAME.hearthboundAxe, ITEMS_BY_NAME.hearthboundAxe],
			internalItemData: { rapids: 1 } satisfies IInternalItemDataOf<'staffOfFlowingWater'>,
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'attackDamage',
		}, damageSource);
	});

	/* passive doesn't count but rabadon passive from it does */
	await t.test('staff of flowing water, rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Lulu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.staffOfFlowingWater, ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.trinity, ITEMS_BY_NAME.deathsDance, ITEMS_BY_NAME.experimentalHexplate],
			internalItemData: { rapids: 1 } satisfies IInternalItemDataOf<'staffOfFlowingWater'>,
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
	});

	await t.test('roa', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.roa, ITEMS_BY_NAME.pickaxe, ITEMS_BY_NAME.pickaxe],
			internalItemData: { eternity: 10 } satisfies IInternalItemDataOf<'roa'>,
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
	});

	await t.test('dawncore', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.dawncore, ITEMS_BY_NAME.faerieCharm, ITEMS_BY_NAME.faerieCharm, ITEMS_BY_NAME.pickaxe, ITEMS_BY_NAME.pickaxe],
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
	});

	/* passive doesn't count but rabadon passive from it does */
	await t.test('veigar', async () => {
		const damageSource = await setupDamageSource(fixture, 'Veigar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.executionersCalling],
			internalData: { passiveStacks: 50 },
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 227,
			abilityPower: 257,
		}, damageSource);
	});

	await t.test('darius', async () => {
		const damageSource = await setupDamageSource(fixture, 'Darius', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.ampTome],
			internalData: { isChampionAtMaxBleed: 1 },
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 94,
			abilityPower: 38,
		}, damageSource);
	});

	await t.test('hecarim', async () => {
		const damageSource = await setupDamageSource(fixture, 'Hecarim', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.darkSeal, ITEMS_BY_NAME.bootsOfSwiftness],
			appliedEffects: [
				overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ghost), [1]),
			],
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 82,
			abilityPower: 33,
		}, damageSource);
	});

	await t.test('rammus', async () => {
		const damageSource = await setupDamageSource(fixture, 'Rammus', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.ampTome],
			internalData: { defensiveCurl: 1 },
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 87,
			abilityPower: 38,
		}, damageSource);
	});

	await t.test('jhin', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jhin', {
			...sourceCommon,
			level: 18,
			items: [ITEMS_BY_NAME.ampTome],
			internalData: { isPassiveMSActive: 0 },
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 196,
			abilityPower: 38,
		}, damageSource);
	});

	await t.test('senna', async () => {
		const damageSource = await setupDamageSource(fixture, 'Senna', {
			...sourceCommon,
			level: 1,
			items: [ITEMS_BY_NAME.ampTome],
			internalData: { passiveStacks: 40, passiveStealTargetMS: 0 },
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 80,
			abilityPower: 38,
		}, damageSource);
	});
});

test('16.17 Jhin', async (t) => {
	const sourceCommon: IOverrides<'Jhin'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [],
	};
	const vanillaBuildItems: IItem[] = [ITEMS_BY_NAME.infinityEdge, ITEMS_BY_NAME.ldr, ITEMS_BY_NAME.phantomDancer, ITEMS_BY_NAME.hubris];
	const dragonStacks: IDragonName[] = ['Infernal', 'Infernal', 'Infernal', 'Infernal'];

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jhin', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 211,
			attackSpeed: 0.944,
		}, damageSource);
	});

	await t.test('withered', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jhin', {
			level: 18,
			runes: {
				shards: {
					offensive: 'attackspeed',
					flex: 'adaptive',
					defensive: 'health',
				},
			},
			items: vanillaBuildItems,
			appliedEffects: [
				overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.frozenHeartWintersCaress), [1]),
			],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 590,
			attackSpeed: 0.944,
		}, damageSource);
	});

	await t.test('bloodmail', async () => {
		const damageSource = await setupDamageSource(fixture, 'Jhin', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 276,
		}, damageSource, 'full hp');

		damageSource.currentHealth.value = 805;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 299,
		}, damageSource, 'partial hp');
	});

	await t.test('bloodmail+, endless hunger, sterak', async (t) => {
		const items: IItem[] = [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.steraksGage];
		const damageSource = await setupDamageSource(fixture, 'Jhin', {
			...sourceCommon,
			items,
			currentHealth: 1059,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 522,
		}, damageSource);

		await t.test('dragons', async () => {
			const damageSource = await setupDamageSource(fixture, 'Jhin', {
				...sourceCommon,
				items,
				dragonStacks,
				currentHealth: 1050,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 563,
			}, damageSource);
		});

		await t.test('dragons, mid quest', async () => {
			const damageSource = await setupDamageSource(fixture, 'Jhin', {
				...sourceCommon,
				items,
				dragonStacks,
				roleQuest: 'mid',
				currentHealth: 1060,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 589,
			}, damageSource);
		});
	});

	await t.test('vanilla', async (t) => {
		const damageSource = await setupDamageSource(fixture, 'Jhin', {
			...sourceCommon,
			items: vanillaBuildItems,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 591,
		}, damageSource);

		await t.test('dragons', async () => {
			const damageSource = await setupDamageSource(fixture, 'Jhin', {
				...sourceCommon,
				items: vanillaBuildItems,
				dragonStacks,
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 629,
			}, damageSource);
		});

		await t.test('dragons, mid quest', async () => {
			const damageSource = await setupDamageSource(fixture, 'Jhin', {
				...sourceCommon,
				items: vanillaBuildItems,
				dragonStacks,
				roleQuest: 'mid',
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 657,
			}, damageSource);
		});

		await t.test('dragons, mid quest, swiftmarch', async () => {
			const damageSource = await setupDamageSource(fixture, 'Jhin', {
				...sourceCommon,
				internalData: { isPassiveMSActive: 1 },
				items: vanillaBuildItems.concat([ITEMS_BY_NAME.swiftmarch]),
				dragonStacks,
				roleQuest: 'mid',
			});

			typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
				attackDamage: 692,
				moveSpeed: 531,
			}, damageSource);
		});
	});
});

test('16.17 Senna', async (t) => {
	const sourceCommon: IOverrides<'Senna'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [],
		internalData: { passiveStacks: 40, passiveStealTargetMS: 0 },
	};
	const items: IItem[] = [ITEMS_BY_NAME.infinityEdge, ITEMS_BY_NAME.ldr, ITEMS_BY_NAME.collector, ITEMS_BY_NAME.hexoptics];

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Senna', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 91,
			critChance: 20,
			attackRange: 640,
		}, damageSource);
	});

	await t.test('ie, ldr, collector, hexoptics', async () => {
		const damageSource = await setupDamageSource(fixture, 'Senna', {
			...sourceCommon,
			items,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 306,
			critChance: 100,
			attackRange: 640,
			lifeSteal: 7,
		}, damageSource);
	});

	await t.test('4 infernals', async () => {
		const damageSource = await setupDamageSource(fixture, 'Senna', {
			...sourceCommon,
			items,
			dragonStacks: ['Infernal', 'Infernal', 'Infernal', 'Infernal'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 342,
		}, damageSource);
	});

	await t.test('4 infernals, mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Senna', {
			...sourceCommon,
			items,
			dragonStacks: ['Infernal', 'Infernal', 'Infernal', 'Infernal'],
			roleQuest: 'mid',
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 365,
		}, damageSource);
	});

	await t.test('4 infernals, mid quest, bloodmail+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Senna', {
			...sourceCommon,
			items: items.concat([ITEMS_BY_NAME.overlordsBloodmail]),
			dragonStacks: ['Infernal', 'Infernal', 'Infernal', 'Infernal'],
			roleQuest: 'mid',
			currentHealth: 502,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 456,
		}, damageSource);

		damageSource.currentHealth.value = 318;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 465,
		}, damageSource);
	});
});

// aphelios
// pyke
// rengar
// varus
// yasuo, yone
// zaahen
// zeri
