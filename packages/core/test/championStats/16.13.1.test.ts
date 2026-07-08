import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from '../fixtures/16.13.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture, typedPartialDeepStrictEqual } from '../utils.ts';

test.before(() => {
	setupPatchFixture(fixture);
});

test('Cassiopeia ms items & dragons', async (t) => {
	const sourceCommon: IOverrides<'Cassiopeia'> = {
		level: 2,
		runes: {
			shards: {
				offensive: 'cdrscaling',
				flex: 'movementspeed',
				defensive: 'health',
			},
		},
		items: [ITEMS_BY_NAME.experimentalHexplate, ITEMS_BY_NAME.blackCleaver, ITEMS_BY_NAME.trinity, ITEMS_BY_NAME.phage, ITEMS_BY_NAME.bootsOfSwiftness, ITEMS_BY_NAME.shurelya],
		dragonStacks: ['Mountain', 'Infernal'],
	};

	await t.test('lvl 2 | phage+, black cleaver+, trinity force+', async () => {
		const damageSource = await setupDamageSource(fixture, 'Cassiopeia', {
			...sourceCommon,
			internalItemData: { rage: 1, fervor: 1, carve: 0, quicken: 1 } satisfies IInternalItemDataOf<'phage' | 'blackCleaver' | 'trinity'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 192,
			abilityPower: 52,
			armor: 22,
			magicResist: 35,
			attackSpeed: 0.98,
			abilityHaste: 58,
			moveSpeed: 467,
		});
	});
});
