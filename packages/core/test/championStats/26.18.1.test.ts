import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
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
