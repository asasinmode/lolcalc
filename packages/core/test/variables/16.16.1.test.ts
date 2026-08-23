import type { DamageSource, IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IChampionAbilityKey } from '@lolcalc/shared';
import assert from 'node:assert';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.16.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('16.16 Vladimir Q damage | magic resist, shadowflame, randuin', async (t) => {
	const sourceCommon: IOverrides<'Vladimir'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.shadowflame],
	};
	const targetCommon: IOverrides<'TargetDummy'> = {
		level: 1,
	};

	await t.test('shadowflame', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', sourceCommon);
		const damageTarget = await setupDamageSource(fixture, 'TargetDummy', targetCommon);
		damageSource.isResultsCopy = true;
		damageTarget.isResultsCopy = true;
		damageSource.calculationDamageTarget.value = damageTarget;

		assertVariableValue('BaseDamageTooltip', 158, 'q', damageSource);
	});

	await t.test('shadowflame | randuin', { skip: true }, async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 20,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 665);
	});

	await t.test('shadowflame ie', { skip: true }, async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 20,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 665);
	});

	await t.test('shadowflame ie | randuin', { skip: true }, async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', sourceCommon);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 20,
		}, damageSource);
		assert.equal(damageSource.maxHealth.value, 665);
	});
});

function assertVariableValue(variable: string, expected: number, abilityKey: IChampionAbilityKey, damageSource: DamageSource) {
	try {
		assert.strictEqual(Math.round(damageSource.computed.abilities.value[abilityKey][0]!.variables.get(variable)?.value as number), expected);
	} catch (e) {
		console.error(`failing setup: http://localhost:3000/?v=1&src=${damageSource.stringifiedData.value}&tgt=${damageSource.calculationDamageTarget.value?.stringifiedData.value ?? ''}`);
		throw e;
	}
}
