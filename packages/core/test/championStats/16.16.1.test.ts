import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IItem } from '@lolcalc/data/types.js';
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

test.only('16.16 Vladimir passive interactions', async (t) => {
	t.runOnly(true);
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

	await t.test('rabadon, riftmaker', { only: true }, async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: flatItems.concat(ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.riftmaker),
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 616,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 2685);
	});
});
