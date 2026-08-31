import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IInternalItemDataOf } from '@lolcalc/core/specifics/index.ts';
import type { IDragonName, IItem } from '@lolcalc/data/types.js';
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

		assert.equal(damageSource.stats.value.meta.adaptiveForceStat, 'attackDamage' satisfies IChampionStatName);
	});

	// archangel
	// rabadon
	// mejai
	// bloodmail
	// sterak
	// staff of flowing water
	// dawncore
});

// veigar
// darius
// jhin
// hecarim
// pyke
// rammus
// rengar
// senna
// varus
// yasuo, yone
// zaahen
// zeri
