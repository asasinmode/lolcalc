import type { IOverrides } from '@lolcalc/core/DamageSource';
import type { IInternalDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics';
import assert from 'node:assert';
import test from 'node:test';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import fixture from './16.9.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupItems } from './utils.ts';

test.before(() => {
	setupItems(fixture);
});

test('16.9.1 Ahri, shards 100', async (t) => {
	const sourceCommon: IOverrides<'Ahri'> = {
		level: 18,
		runes: {
			shards: {
				offensive: 'attackspeed',
				flex: 'adaptive',
				defensive: 'health',
			},
		},
	};

	await t.test('lvl 18 | mejai, blackfire, berserkers, guinsoo, riftmaker, rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ahri', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.mejai, ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.berserkerGreaves, ITEMS_BY_NAME.guinsoo, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.rabadon],
			internalItemData: {
				glory: 20,
				bBlaze: 1,
				seething: 1,
			} satisfies IInternalItemDataOf<'mejai' | 'blackfireTorch' | 'guinsoo'>,
		});

		assert.partialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 134,
			abilityPower: 602,
			armor: 92,
			magicResist: 52,
			attackSpeed: 1.33,
			abilityHaste: 35,
			moveSpeed: 413,
			/* thing in calculator seems to add up */
			hp: 2873,
		});
	});

	await t.test('lvl 18 | archangel, blackfire, berserkers, guinsoo, riftmaker, rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ahri', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.archangelsStaff, ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.berserkerGreaves, ITEMS_BY_NAME.guinsoo, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.rabadon],
			internalItemData: {
				manaflow: 10,
				bBlaze: 1,
			} satisfies IInternalItemDataOf<'archangelsStaff' | 'blackfireTorch'>,
		});

		assert.partialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 549,
			abilityHaste: 60,
			mana: 2053,
		});
	});

	await t.test('lvl 18 | seraph, blackfire, berserkers, guinsoo, riftmaker, rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ahri', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.berserkerGreaves, ITEMS_BY_NAME.guinsoo, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.rabadon],
			internalItemData: {
				bBlaze: 1,
			} satisfies IInternalItemDataOf<'blackfireTorch'>,
		});

		assert.partialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 575,
			abilityHaste: 60,
			mana: 2443,
		});
	});
});

test('16.9.1 Ezreal, shards 020, bot quest', async (t) => {
	const sourceCommon: IOverrides<'Ezreal'> = {
		roleQuest: 'bot',
		runes: {
			shards: {
				offensive: 'adaptive',
				flex: 'healthscaling',
				defensive: 'health',
			},
		},
	};

	await t.test('lvl 1 | archangel', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ezreal', {
			...sourceCommon,
			level: 1,
			items: [ITEMS_BY_NAME.archangelsStaff],
			internalData: {
				passiveStacks: 5,
			},
			internalItemData: {
				manaflow: 20,
			} satisfies IInternalItemDataOf<'archangelsStaff'>,
		});

		assert.partialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 85,
			attackSpeed: 0.938,
			abilityHaste: 25,
			hp: 675,
			mana: 995,
		});
	});

	await t.test('lvl 1 | seraph, manamune', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ezreal', {
			...sourceCommon,
			level: 1,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.manamune],
			internalItemData: {
				manaflow: 0,
			} satisfies IInternalItemDataOf<'manamune'>,
		});

		assert.partialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 133,
			abilityPower: 109,
			abilityHaste: 40,
			mana: 1875,
		});
	});

	await t.test('lvl 11 | seraph, manamune', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ezreal', {
			...sourceCommon,
			level: 11,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.manamune],
			internalItemData: {
				manaflow: 12,
			} satisfies IInternalItemDataOf<'manamune'>,
		});

		assert.strictEqual(damageSource.computed.formattedStatTotals.value.attackDamage, 178);
	});

	await t.test('lvl 18 | seraph, manamune, diadem of songs, fimbulwinter, endless hunger, overlord\'s bloodmail, gluttonous greaves', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ezreal', {
			...sourceCommon,
			level: 18,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.manamune, ITEMS_BY_NAME.diademOfSongs, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.gluttonousGreaves],
			internalData: {
				passiveStacks: 5,
			} satisfies IInternalDataOf<'Ezreal'>,
			internalItemData: {
				feast: 1,
				slay: 4,
			} satisfies IInternalItemDataOf<'endlessHunger' | 'gluttonousGreaves'>,
		});

		assert.partialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 424,
			abilityPower: 150,
			armor: 95,
			magicResist: 52,
			attackSpeed: 0.89,
			abilityHaste: 90,
			moveSpeed: 370,
			hp: 4479,
			mana: 5565,
			hpRegen: 15,
			manaRegen: 51,
			healShieldPower: 28,
			omnivamp: 28,
			tenacity: 13,
		});
	});
});
