import type { IOverrides } from '@lolcalc/core/DamageSource';
import type { IInternalDataOf, IInternalItemDataOf } from '@lolcalc/core/specifics';
import test from 'node:test';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { ABILITY_TYPE, EFFECT_OBJECT_NAME } from '@lolcalc/shared';
import fixture from './16.9.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupItems, typedPartialDeepStrictEqual } from './utils.ts';

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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 134,
			abilityPower: 602,
			armor: 92,
			magicResist: 52,
			attackSpeed: 1.327,
			abilityHaste: 35,
			moveSpeed: 413,
			/* in game it shows 2874 but it's ceiled 2873, see help page known discrepancies */
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
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

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackDamage: 133,
			abilityPower: 109,
			abilityHaste: 40,
			mana: 1875,
		});
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
			hp: 2597,
			mana: 3501,
			omnivamp: 4,
		});
	});
});

// TODO make sure to check uncaressed attack speed @ 18
test('16.9.1 Ryze, shards 211', async (t) => {
	const sourceCommon: IOverrides<'Ryze'> = {
		runes: {
			shards: {
				offensive: 'cdrscaling',
				flex: 'movementspeed',
				defensive: 'tenacity',
			},
		},
	};

	const frozenHeartEffectAbilityId = GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.frozenHeartWintersCaress);

	await t.test('lvl 1 | wCaressed', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart],
		});
		damageSource.addEffect(frozenHeartEffectAbilityId, [1]);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 0.526,
		});
	});

	await t.test('lvl 1 | dagger, dagger', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.dagger, ITEMS_BY_NAME.dagger],
		});

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 0.783,
		});
	});

	await t.test('lvl 1 | dagger, dagger | wCaressed', async () => {
		const damageSource = await setupDamageSource(fixture, 'Ryze', {
			...sourceCommon,
			items: [ITEMS_BY_NAME.frozenHeart, ITEMS_BY_NAME.dagger, ITEMS_BY_NAME.dagger],
		});
		damageSource.addEffect(frozenHeartEffectAbilityId, [1]);

		typedPartialDeepStrictEqual(damageSource.computed.formattedStatTotals.value, {
			attackSpeed: 0.626,
		});
	});
});
