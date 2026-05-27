import type { IOverrides } from '@lolcalc/core/DamageSource';
import type { IInternalDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics';
import assert from 'node:assert';
import test from 'node:test';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { ABILITY_TYPE, EFFECT_OBJECT_NAME } from '@lolcalc/shared';
import fixture from './16.9.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupItems, typedPartialDeepStrictEqual } from './utils.ts';

test.before(() => {
	setupItems(fixture);
});

test('Ahri misc ap passives items', async (t) => {
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 134,
			abilityPower: 602,
			armor: 92,
			magicResist: 52,
			attackSpeed: 1.327,
			abilityHaste: 35,
			moveSpeed: 413,
		});
		assert.equal(damageSource.maxHealth.value, 2873);
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 549,
			abilityHaste: 60,
		});
		assert.equal(damageSource.maxAbilityResource.value, 2053);
	});

	await t.test('lvl 18 | seraph, blackfire, berserkers, guinsoo, riftmaker, rabadon', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ahri', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.blackfireTorch, ITEMS_BY_NAME.berserkerGreaves, ITEMS_BY_NAME.guinsoo, ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.rabadon],
			internalItemData: {
				bBlaze: 1,
			} satisfies IInternalItemDataOf<'blackfireTorch'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 575,
			abilityHaste: 60,
		});
		assert.equal(damageSource.maxAbilityResource.value, 2443);
	});
});

test('Ezreal tear items', async (t) => {
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 85,
			attackSpeed: 0.938,
			abilityHaste: 25,
		});
		assert.equal(damageSource.maxHealth.value, 675);
		assert.equal(damageSource.maxAbilityResource.value, 995);
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 133,
			abilityPower: 109,
			abilityHaste: 40,
		});
		assert.equal(damageSource.maxAbilityResource.value, 1875);
	});

	await t.test('lvl 11 | seraph, muramana, winter\'s approach, gluttonous greaves', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ezreal', {
			...sourceCommon,
			level: 11,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.wintersApproach, ITEMS_BY_NAME.gluttonousGreaves],
			internalData: {
				passiveStacks: 2,
			} satisfies IInternalDataOf<'Ezreal'>,
			internalItemData: {
				manaflow: 12,
			} satisfies IInternalItemDataOf<'wintersApproach'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 198,
			abilityPower: 129,
			attackSpeed: 0.887,
			abilityHaste: 55,
			moveSpeed: 370,
			omnivamp: 4,
		});
		assert.equal(damageSource.maxHealth.value, 2597);
		assert.equal(damageSource.maxAbilityResource.value, 3501);
	});

	await t.test('lvl 11 | seraph, muramana, fimbulwinter, whispering circlet, gluttonous greaves', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ezreal', {
			...sourceCommon,
			level: 11,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.whisperingCirclet, ITEMS_BY_NAME.gluttonousGreaves],
			internalItemData: {
				manaflow: 4,
				slay: 1,
			} satisfies IInternalItemDataOf<'whisperingCirclet' | 'gluttonousGreaves'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 214,
			abilityPower: 145,
			healShieldPower: 25,
			manaRegen: 30,
			omnivamp: 5,
		});
		assert.equal(damageSource.maxHealth.value, 2916);
		assert.equal(damageSource.maxAbilityResource.value, 4293);
	});

	await t.test('lvl 11 | seraph, muramana, fimbulwinter, diadem of songs, overlord\'s bloodmail, gluttonous greaves', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ezreal', {
			...sourceCommon,
			level: 11,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.diademOfSongs, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.gluttonousGreaves],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 315,
			abilityPower: 150,
			healShieldPower: 28,
			manaRegen: 35,
		});
		assert.equal(damageSource.maxHealth.value, 3571);
		assert.equal(damageSource.maxAbilityResource.value, 4989);
	});

	await t.test('lvl 18 | seraph, manamune, diadem of songs, fimbulwinter, overlord\'s bloodmail, endless hunger, gluttonous greaves', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ezreal', {
			...sourceCommon,
			level: 18,
			items: [ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.muramana, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.diademOfSongs, ITEMS_BY_NAME.overlordsBloodmail, ITEMS_BY_NAME.endlessHunger, ITEMS_BY_NAME.gluttonousGreaves],
			internalData: {
				passiveStacks: 5,
			} satisfies IInternalDataOf<'Ezreal'>,
			internalItemData: {
				feast: 1,
				slay: 4,
			} satisfies IInternalItemDataOf<'endlessHunger' | 'gluttonousGreaves'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 424,
			abilityPower: 150,
			armor: 95,
			magicResist: 52,
			attackSpeed: 1.203,
			abilityHaste: 90,
			moveSpeed: 370,
			hpRegen: 15,
			manaRegen: 51,
			healShieldPower: 28,
			omnivamp: 28,
			tenacity: 20,
		});
		assert.equal(damageSource.maxHealth.value, 4479);
		assert.equal(damageSource.maxAbilityResource.value, 5565);
	});
});

test('Ryze tear/ad items', async (t) => {
	const sourceCommon: IOverrides<'Ryze'> = {
		runes: {
			shards: {
				offensive: 'cdrscaling',
				flex: 'movementspeed',
				defensive: 'tenacity',
			},
		},
		roleQuest: 'mid',
	};

	const frozenHeartEffectAbilityId = GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.frozenHeartWintersCaress);

	await t.test('wCaressed', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart],
		});
		damageSource.addEffect(frozenHeartEffectAbilityId, [1]);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 0.526,
		});
	});

	await t.test('dagger, dagger', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.dagger, ITEMS_BY_NAME.dagger],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 0.783,
		});
	});

	await t.test('dagger, dagger | wCaressed', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.dagger, ITEMS_BY_NAME.dagger],
		});
		damageSource.addEffect(frozenHeartEffectAbilityId, [1]);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 0.626,
		});
	});

	await t.test('lvl 1 | frozen heart, swiftmarch', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.swiftmarch],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 58,
			abilityPower: 22,
			armor: 97,
			abilityHaste: 28,
			moveSpeed: 415,
			tenacity: 15,
		});
		assert.equal(damageSource.maxAbilityResource.value, 715);
	});

	await t.test('lvl 1 | frozen heart, swiftmarch, archangel', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.archangelsStaff],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 108,
			abilityHaste: 53,
		});
		assert.equal(damageSource.maxAbilityResource.value, 1440);
	});

	await t.test('lvl 1 | frozen heart, swiftmarch, seraph, cosmic drive', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.cosmicDrive],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 208,
			abilityHaste: 78,
			moveSpeed: 428,
		});
		assert.equal(damageSource.maxAbilityResource.value, 2054);
	});

	await t.test('lvl 1 | frozen heart, swiftmarch, seraph, cosmic drive, winter\'s approach', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.cosmicDrive, ITEMS_BY_NAME.wintersApproach],
			internalItemData: {
				manaflow: 11,
			} satisfies IInternalItemDataOf<'wintersApproach'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 222,
			abilityHaste: 93,
		});
		assert.equal(damageSource.maxHealth.value, 1906);
		assert.equal(damageSource.maxAbilityResource.value, 2701);
	});

	await t.test('lvl 1 | frozen heart, swiftmarch, seraph, cosmic drive, fimbulwinter, dusk and dawn', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.cosmicDrive, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.duskAndDawn],
		});
		damageSource.addEffect(frozenHeartEffectAbilityId, [1]);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 303,
			abilityHaste: 113,
			attackSpeed: 0.626,
		});
		assert.equal(damageSource.maxHealth.value, 2328);
		assert.equal(damageSource.maxAbilityResource.value, 3517);
	});

	await t.test('lvl 18 | riftmaker, swiftmarch, seraph, cosmic drive, fimbulwinter, dusk and dawn', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			level: 18,
			items: [ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.cosmicDrive, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.duskAndDawn],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 427,
			abilityHaste: 108,
			attackSpeed: 1.01,
		});
		assert.equal(damageSource.maxHealth.value, 4479);
		assert.equal(damageSource.maxAbilityResource.value, 4827);
	});

	await t.test('lvl 18 | riftmaker, swiftmarch, seraph, rabadon, fimbulwinter', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			level: 18,
			items: [ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.fimbulwinter],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 542,
			abilityHaste: 63,
		});
		assert.equal(damageSource.maxHealth.value, 4237);
		assert.equal(damageSource.maxAbilityResource.value, 5380);
	});

	await t.test('lvl 18 | riftmaker, swiftmarch, seraph, rabadon, fimbulwinter, force of nature', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			level: 18,
			items: [ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.forceOfNature],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 555,
			magicResist: 109,
			abilityHaste: 63,
			moveSpeed: 428,
		});
		assert.equal(damageSource.maxHealth.value, 4644);
		assert.equal(damageSource.maxAbilityResource.value, 5426);
	});

	await t.test('lvl 18 | riftmaker, swiftmarch, seraph, rabadon, fimbulwinter, cosmic drive', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			level: 18,
			items: [ITEMS_BY_NAME.riftmaker, ITEMS_BY_NAME.swiftmarch, ITEMS_BY_NAME.seraphsEmbrace, ITEMS_BY_NAME.rabadon, ITEMS_BY_NAME.fimbulwinter, ITEMS_BY_NAME.cosmicDrive],
			internalItemData: {
				spelldance: 1,
			} satisfies IInternalItemDataOf<'cosmicDrive'>,
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			abilityPower: 661,
			abilityHaste: 88,
			moveSpeed: 445,
		});
		assert.equal(damageSource.maxHealth.value, 4649);
		assert.equal(damageSource.maxAbilityResource.value, 5797);
	});
});
