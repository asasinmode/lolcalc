import type { IOverrides } from '@lolcalc/core/DamageSource';
import assert from 'node:assert';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.10.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from './utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Briar, shards 211', async (t) => {
	const sourceCommon: IOverrides<'Briar'> = {
		runes: {
			shards: {
				offensive: 'cdrscaling',
				flex: 'movementspeed',
				defensive: 'tenacity',
			},
		},
	};

	await t.test('lvl 1 | bloodmail', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail],
		});
		damageSource.currentHealth.value = 423;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 115,
			abilityHaste: 8,
			moveSpeed: 349,
			hpRegen: 0,
			manaRegen: 0,
			tenacity: 15,
		});
		assert.equal(damageSource.maxHealth.value, 1175);
	});
});

test('Briar ad related passive items', async (t) => {
	const sourceCommon: IOverrides<'Briar'> = {
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
	};

	await t.test('bloodmail | partial hp', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail],
		});
		damageSource.currentHealth.value = 564;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 127,
		});
	});

	await t.test('bloodmail, endless hunger | full hp', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.endlessHunger],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 181,
			abilityHaste: 21,
		});
	});

	await t.test('bloodmail, endless hunger | partial hp', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.endlessHunger],
		});
		damageSource.currentHealth.value = 564;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 198,
			abilityHaste: 23,
		});
	});

	await t.test('bloodmail, endless hunger, sterak\'s gage | full hp', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.steraksGage],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 218,
			abilityHaste: 26,
			tenacity: 36,
		});
	});

	await t.test('bloodmail, endless hunger, sterak\'s gage | partial hp', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.steraksGage],
		});
		damageSource.currentHealth.value = 518;

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 244,
			abilityHaste: 29,
		});
	});
});
