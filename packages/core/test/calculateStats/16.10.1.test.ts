import type { IOverrides } from '@lolcalc/core/DamageSource';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from './16.10.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupItems, typedPartialDeepStrictEqual } from './utils.ts';

test.before(() => {
	setupItems(fixture);
});

test('16.10.1 Briar, shards 211', async (t) => {
	const sourceCommon: IOverrides<'Briar'> = {
		level: 1,
		runes: {
			shards: {
				offensive: 'cdrscaling',
				flex: 'movementspeed',
				defensive: 'tenacity',
			},
		},
	};

	await t.test('lvl 1 | overlord\'s bloodmail', async () => {
		const damageSource = await setupDamageSource(fixture, 'Briar', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.overlordsBloodmail],
			currentHealth: 423,
		});

		typedPartialDeepStrictEqual(damageSource.stats.value.variables, {
			bloodmailTyranny: 14,
			bloodmailRetribution: 13,
		});
		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 115,
			abilityHaste: 8,
			moveSpeed: 349,
			hp: 1175,
			// TODO briar passive
			hpRegen: 0,
			manaRegen: 0,
			tenacity: 15,
		});
	});
});
