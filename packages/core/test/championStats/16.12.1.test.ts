import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.12.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Evelynn, dragons', async (t) => {
	const sourceCommon: IOverrides<'Evelynn'> = {
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.zhonya, ITEMS_BY_NAME.shadowflame, ITEMS_BY_NAME.stormsurge, ITEMS_BY_NAME.sorcerersShoes, ITEMS_BY_NAME.lichBane],
	};

	await t.test('lvl 1', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', { ...sourceCommon, level: 1 });

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 719,
			armor: 87,
			abilityHaste: 10,
			moveSpeed: 423,
			flatMagicPen: 42,
		});
	});

	await t.test('lvl 18, mountain', async () => {
		const damageSource = await setupDamageSource(fixture, 'Evelynn', {
			...sourceCommon,
			level: 18,
			dragonStacks: ['Mountain'],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			armor: 175,
			magicResist: 70,
		});
	});
});
