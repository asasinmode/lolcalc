import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import type { IChampionStatName } from '@lolcalc/shared';
import assert from 'node:assert';
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

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
	});

	await t.test('seraph', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.pickaxe, ITEMS_BY_NAME.longSword],
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'attackDamage' satisfies IChampionStatName);
	});

	await t.test('rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.longSword, ITEMS_BY_NAME.longSword],
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
	});

	await t.test('dark seal', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.darkSeal, ITEMS_BY_NAME.hearthboundAxe],
			internalItemData: { glory: 10 } satisfies IInternalItemDataOf<'darkSeal'>,
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
	});

	await t.test('mejai', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.mejai, ITEMS_BY_NAME.bfSword],
			internalItemData: { glory: 25 } satisfies IInternalItemDataOf<'mejai'>,
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
	});

	await t.test('bloodmail tyranny', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.darkSeal, ITEMS_BY_NAME.ampTome],
		});

		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).tyranny = damageSource.stats.value.variables.bloodmailTyranny;
		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).retribution = damageSource.stats.value.variables.bloodmailRetribution;

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'attackDamage' satisfies IChampionStatName);
	});

	await t.test('bloodmail retribution', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.aetherWisp, ITEMS_BY_NAME.ampTome],
			currentHealth: 470,
		});

		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).tyranny = damageSource.stats.value.variables.bloodmailTyranny;
		(damageSource.internalItemData.value as IInternalItemDataOf<'overlordsBloodmail'>).retribution = damageSource.stats.value.variables.bloodmailRetribution;

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'attackDamage' satisfies IChampionStatName);
	});

	await t.test('sterak', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.steraksGage, ITEMS_BY_NAME.ampTome],
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'attackDamage' satisfies IChampionStatName);
	});

	await t.test('staff of flowing water', async () => {
		const damageSource = await setupDamageSource(fixture, 'Lulu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.staffOfFlowingWater, ITEMS_BY_NAME.hearthboundAxe, ITEMS_BY_NAME.hearthboundAxe],
			internalItemData: { rapids: 1 } satisfies IInternalItemDataOf<'staffOfFlowingWater'>,
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'attackDamage' satisfies IChampionStatName);
	});

	await t.test('staff of flowing water, rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Lulu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.staffOfFlowingWater, ITEMS_BY_NAME.bloodthirster, ITEMS_BY_NAME.trinity, ITEMS_BY_NAME.deathsDance, ITEMS_BY_NAME.experimentalHexplate],
			internalItemData: { rapids: 1 } satisfies IInternalItemDataOf<'staffOfFlowingWater'>,
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
	});

	await t.test('roa', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.roa, ITEMS_BY_NAME.pickaxe, ITEMS_BY_NAME.pickaxe],
			internalItemData: { eternity: 10 } satisfies IInternalItemDataOf<'roa'>,
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
	});

	await t.test('dawncore', async () => {
		const damageSource = await setupDamageSource(fixture, 'Amumu', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.dawncore, ITEMS_BY_NAME.faerieCharm, ITEMS_BY_NAME.faerieCharm, ITEMS_BY_NAME.pickaxe, ITEMS_BY_NAME.pickaxe],
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
	});

	/* passive doesn't count but rabadon passive from it does */
	await t.test('veigar', async () => {
		const damageSource = await setupDamageSource(fixture, 'Veigar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.bfSword, ITEMS_BY_NAME.executionersCalling],
			internalData: { passiveStacks: 50 },
		});

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
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

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
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

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'abilityPower' satisfies IChampionStatName);
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 82,
			abilityPower: 33,
		}, damageSource);
	});
});

// aphelios
// jhin
// pyke
// rammus
// rengar
// senna
// varus
// yasuo, yone
// zaahen
// zeri
