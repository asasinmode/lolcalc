import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import type { IDragonName } from '@lolcalc/data/types.js';
import assert from 'node:assert';
import test from 'node:test';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { AbilityType, EffectObjectName } from '@lolcalc/shared';
import { nextTick } from 'vue';
import fixture from '../fixtures/26.18.1.fixture.json' with { type: 'json' };
import { overridesAppliedEffect, setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

const infernalStacks: IDragonName[] = ['Infernal', 'Infernal', 'Infernal', 'Infernal'];
const mountainStacks: IDragonName[] = ['Mountain', 'Mountain', 'Mountain', 'Mountain'];

test('adaptive', async (t) => {
	const sourceCommon: IOverrides = {
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
	};

	await t.test('chogath', async () => {
		const damageSource = await setupDamageSource(fixture, 'Chogath', {
			...sourceCommon,
			level: 18,
			internalData: { ultStacks: 0 },
			abilityLevels: { r: 3 },
			runes: {
				shards: {
					offensive: 'adaptive',
					flex: 'adaptive',
					defensive: 'tenacity',
				},
			},
			items: [ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.ravenousHydra, ITEMS_BY_NAME.axiomArc],
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'attackDamage',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 416,
			abilityPower: 269,
		}, damageSource);

		/* test on 1 stack to make sure it's properly excluded from adaptive force check */
		damageSource.internalData.value.ultStacks = 1;

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'attackDamage',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 416,
			abilityPower: 273,
		}, damageSource);

		damageSource.internalData.value.ultStacks = 6;

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 405,
			abilityPower: 317,
		}, damageSource);
	});

	/**
	 * hp stat increase from passive is done before adaptive force check
	 * calculate hp -> amp it by ornn -> do riftmaker -> calculate blackfire torch -> blackfire torch ap counts towards adaptive force check -> ornn gains ap
	 */
	await t.test('ornn', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ornn', {
			...sourceCommon,
			level: 18,
			internalData: { masterworkItemSlot: 0, passiveUpgradedAllies: 4, _masterworkLevel: 13 },
			items: [ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.sunderedSky, ITEMS_BY_NAME.blackCleaver, ITEMS_BY_NAME.chempunkChainsword, ITEMS_BY_NAME.mercurialScimitar],
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'attackDamage',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 319,
			abilityPower: 193,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'blackfireTorch'>).bBlaze = 4;

		typedPartialDeepStrictEqual(damageSource.stats.value.meta, {
			adaptiveForceStat: 'abilityPower',
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 309,
			abilityPower: 245,
		}, damageSource);
	});
});

test('26.18 Belveth', async (t) => {
	const sourceCommon: IOverrides<'Belveth'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'tenacity',
			},
		},
		abilityLevels: { q: 5, w: 5, e: 5, r: 3 },
		items: [ITEMS_BY_NAME.giantsBelt, ITEMS_BY_NAME.giantsBelt, ITEMS_BY_NAME.giantsBelt, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.rabadon],
	};

	await t.test('winter caressed', async () => {
		const damageSource = await setupDamageSource(fixture, 'Belveth', {
			...sourceCommon,
			runes: {
				shards: {
					offensive: 'adaptive',
					flex: 'adaptive',
					defensive: 'health',
				},
			},
			items: [ITEMS_BY_NAME.infinityEdge, ITEMS_BY_NAME.ldr, ITEMS_BY_NAME.guinsoo, ITEMS_BY_NAME.krakenSlayer, ITEMS_BY_NAME.collector, ITEMS_BY_NAME.stormrazor],
			dragonStacks: ['Hextech'],
			appliedEffects: [
				overridesAppliedEffect(GameAbilityId.build(AbilityType.effect, EffectObjectName.frozenHeartWintersCaress), [1]),
			],
			internalData: { passiveStacks: 83, hasPassiveStack: 0 },
			currentAbilityResource: 0,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 376,
			attackSpeed: 1.935,
		}, damageSource);

		damageSource.currentAbilityResource.value = 1;
		damageSource.internalData.value.passiveStacks = 84;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 2.335,
		}, damageSource);
	});

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Belveth', {
			...sourceCommon,
			internalData: { passiveStacks: 0, hasPassiveStack: 0 },
			currentAbilityResource: 0,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 159,
			abilityPower: 334,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 4315);

		damageSource.currentHealth.value = 900;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 178,
			abilityPower: 334,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 4315);

		damageSource.currentHealth.value = damageSource.maxHealth.value;
		damageSource.currentAbilityResource.value = 1;

		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 183,
			abilityPower: 359,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 5259);

		// damageSource.currentHealth.value = 3392;
		// typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
		// 	attackDamage: 194,
		// 	abilityPower: 359,
		// }, damageSource);
		// assert.strictEqual(damageSource.maxHealth.value, 5271);

		// damageSource.currentHealth.value = 1115;
		// typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
		// 	attackDamage: 205,
		// 	abilityPower: 359,
		// }, damageSource);
		// assert.strictEqual(damageSource.maxHealth.value, 5283);
	});

	await t.test('4 infernals', async () => {
		const damageSource = await setupDamageSource(fixture, 'Belveth', {
			...sourceCommon,
			internalData: { passiveStacks: 0, hasPassiveStack: 0 },
			currentAbilityResource: 0,
			dragonStacks: infernalStacks,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 178,
			abilityPower: 365,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 4315);

		damageSource.currentHealth.value = 720;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 197,
			abilityPower: 365,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 4315);

		damageSource.currentHealth.value = damageSource.maxHealth.value;
		damageSource.currentAbilityResource.value = 1;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 205,
			abilityPower: 392,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 5259);

		// damageSource.currentHealth.value = 650;
		// typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
		// 	attackDamage: 227,
		// 	abilityPower: 392,
		// }, damageSource);
		// assert.strictEqual(damageSource.maxHealth.value, 5283);
	});

	await t.test('4 infernals | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Belveth', {
			...sourceCommon,
			internalData: { passiveStacks: 0, hasPassiveStack: 0 },
			currentAbilityResource: 0,
			dragonStacks: infernalStacks,
			roleQuest: 'mid',
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 185,
			abilityPower: 386,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 4315);

		damageSource.currentHealth.value = 650;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 205,
			abilityPower: 386,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 4315);

		damageSource.currentHealth.value = damageSource.maxHealth.value;
		damageSource.currentAbilityResource.value = 1;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 214,
			abilityPower: 414,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 5259);

		// damageSource.currentHealth.value = 591;
		// typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
		// 	attackDamage: 238,
		// 	abilityPower: 415,
		// }, damageSource);
		// assert.strictEqual(damageSource.maxHealth.value, 5283);
	});
});

test('26.18 Kled', async (t) => {
	const sourceCommon: IOverrides<'Kled'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.rabadon],
	};
	const internalData = {} as IInternalDataOf<'Kled'>;

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Kled', {
			...sourceCommon,
			internalData,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 179,
			abilityPower: 308,
		}, damageSource);
		typedPartialDeepStrictEqual(damageSource.internalData.value, {
			kledCurrentHP: 1838,
			skaarlCurrentHP: 2365,
		}, damageSource);

		damageSource.internalData.value.skaarlCurrentHP = 0;
		damageSource.internalData.value.runningTowardsEnemy = 1;
		damageSource.internalData.value.enemiesNearby = 4;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 196,
			abilityPower: 308,
			moveSpeed: 451,
			armor: 153,
			magicResist: 93,
		}, damageSource);
	});

	await t.test('4 infernals', async () => {
		const damageSource = await setupDamageSource(fixture, 'Kled', {
			...sourceCommon,
			internalData,
			dragonStacks: infernalStacks,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 200,
			abilityPower: 337,
		}, damageSource);

		damageSource.internalData.value.skaarlCurrentHP = 0;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 217,
			abilityPower: 337,
		}, damageSource);
	});

	await t.test('4 infernals | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Kled', {
			...sourceCommon,
			internalData,
			dragonStacks: infernalStacks,
			roleQuest: 'mid',
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 205,
			abilityPower: 356,
		}, damageSource);

		damageSource.internalData.value.skaarlCurrentHP = 0;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 223,
			abilityPower: 356,
		}, damageSource);
	});

	await t.test('jak\'sho+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Kled', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.jakSho],
			internalData,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 168,
			magicResist: 108,
		}, damageSource);

		damageSource.internalData.value.skaarlCurrentHP = 0;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 177,
			magicResist: 116,
		}, damageSource);

		damageSource.internalData.value.enemiesNearby = 1;
		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 196,
			magicResist: 135,
		}, damageSource);
	});

	await t.test('jak\'sho+ | 4 mountains', async () => {
		const damageSource = await setupDamageSource(fixture, 'Kled', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.jakSho],
			dragonStacks: mountainStacks,
			internalData,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 202,
			magicResist: 129,
		}, damageSource);

		damageSource.internalData.value.enemiesNearby = 1;
		damageSource.internalData.value.skaarlCurrentHP = 0;
		await nextTick();

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 215,
			magicResist: 142,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 235,
			magicResist: 162,
		}, damageSource);
	});
});

test('26.18 Ornn', async (t) => {
	const sourceCommon: IOverrides<'Ornn'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		internalData: { masterworkItemSlot: 1, passiveUpgradedAllies: 4, _masterworkLevel: 13 },
		items: [ITEMS_BY_NAME.jakSho, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.riftmaker],
	};

	await t.test('base', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ornn', sourceCommon);

		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).retribution = damageSource.stats.value.variables.bloodmailRetribution;
		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).tyranny = damageSource.stats.value.variables.bloodmailTyranny;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 216,
			abilityPower: 107,
			armor: 201,
			magicResist: 149,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 4385);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 219,
			magicResist: 168,
		}, damageSource);
	});

	await t.test('4 mountains | mid quest', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ornn', {
			...sourceCommon,
			dragonStacks: mountainStacks,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 241,
			magicResist: 179,
		}, damageSource);

		(damageSource.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 263,
			magicResist: 201,
		}, damageSource);
	});

	await t.test('4 mountains | mid quest | protoplasm+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ornn', {
			...sourceCommon,
			items: sourceCommon.items!.concat([ITEMS_BY_NAME.protoplasmHarness]),
			dragonStacks: mountainStacks,
			roleQuest: 'mid',
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 244,
			abilityPower: 133,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 5165);

		damageSource.currentHealth.value = 1069;
		(damageSource.internalItemData.value as IInternalItemDataOf<'protoplasmHarness'>).pHLifeline = 1;
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 285,
			abilityPower: 141,
		}, damageSource);
		assert.strictEqual(damageSource.maxHealth.value, 5555);
	});
});
