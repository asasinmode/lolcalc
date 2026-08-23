import type { DamageSource, IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IChampionAbilityKey } from '@lolcalc/shared';
import assert from 'node:assert';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.16.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture } from '../utils.ts';

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

		assertVariableValue('BaseDamageTooltip', 158, 'q', damageSource, 'base');
		assertVariableValue('EmpoweredDamageTooltip', 292, 'q', damageSource, 'empowered');
		damageTarget.currentHealth.value = 1;
		assertVariableValue('BaseDamageTooltip', 190, 'q', damageSource, 'crit base');
		assertVariableValue('EmpoweredDamageTooltip', 351, 'q', damageSource, 'crit empowered');
	});

	await t.test('shadowflame | randuin', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', sourceCommon);
		const damageTarget = await setupDamageSource(fixture, 'TargetDummy', {
			...targetCommon,
			items: [ITEMS_BY_NAME.randuinsOmen],
		});
		damageSource.isResultsCopy = true;
		damageTarget.isResultsCopy = true;
		damageSource.calculationDamageTarget.value = damageTarget;

		assertVariableValue('BaseDamageTooltip', 158, 'q', damageSource, 'base');
		assertVariableValue('EmpoweredDamageTooltip', 292, 'q', damageSource, 'empowered');
		damageTarget.currentHealth.value = 1;
		assertVariableValue('BaseDamageTooltip', 180, 'q', damageSource, 'crit base');
		assertVariableValue('EmpoweredDamageTooltip', 333, 'q', damageSource, 'crit empowered');
	});

	await t.test('shadowflame ie', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: sourceCommon.items!.concat(ITEMS_BY_NAME.infinityEdge),
		});
		const damageTarget = await setupDamageSource(fixture, 'TargetDummy', targetCommon);
		damageSource.isResultsCopy = true;
		damageTarget.isResultsCopy = true;
		damageSource.calculationDamageTarget.value = damageTarget;

		assertVariableValue('BaseDamageTooltip', 158, 'q', damageSource, 'base');
		assertVariableValue('EmpoweredDamageTooltip', 292, 'q', damageSource, 'empowered');
		damageTarget.currentHealth.value = 1;
		assertVariableValue('BaseDamageTooltip', 199, 'q', damageSource, 'crit base');
		assertVariableValue('EmpoweredDamageTooltip', 369, 'q', damageSource, 'crit empowered');
	});

	await t.test('shadowflame ie | randuin', async () => {
		const damageSource = await setupDamageSource(fixture, 'Vladimir', {
			...sourceCommon,
			items: sourceCommon.items!.concat(ITEMS_BY_NAME.infinityEdge),
		});
		const damageTarget = await setupDamageSource(fixture, 'TargetDummy', {
			...targetCommon,
			items: [ITEMS_BY_NAME.randuinsOmen],
		});
		damageSource.isResultsCopy = true;
		damageTarget.isResultsCopy = true;
		damageSource.calculationDamageTarget.value = damageTarget;

		assertVariableValue('BaseDamageTooltip', 158, 'q', damageSource, 'base');
		assertVariableValue('EmpoweredDamageTooltip', 292, 'q', damageSource, 'empowered');
		damageTarget.currentHealth.value = 1;
		assertVariableValue('BaseDamageTooltip', 187, 'q', damageSource, 'crit base');
		assertVariableValue('EmpoweredDamageTooltip', 346, 'q', damageSource, 'crit empowered');
	});
});

function assertVariableValue(variable: string, expected: number, abilityKey: IChampionAbilityKey, damageSource: DamageSource, message = '') {
	try {
		assert.strictEqual(Math.round(damageSource.computed.abilities.value[abilityKey][0]!.variables.get(variable)?.value as number), expected, message);
	} catch (e) {
		console.error(`failing${message ? ` ${message}` : ''} setup: http://localhost:3000/?v=1&src=${damageSource.stringifiedData.value}&tgt=${damageSource.calculationDamageTarget.value?.stringifiedData.value ?? ''}`);
		throw e;
	}
}
