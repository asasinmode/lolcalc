import assert from 'node:assert';
import test from 'node:test';
import { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { CHAMPIONS, ITEMS_BY_NAME, useChampion } from '@lolcalc/data';
import { nextTick } from 'vue';

test('maxHealth watch', async (t) => {
	const champion = await useChampion('Ahri');
	const championHp = champion.stats.hp;
	const championMp = champion.stats.mp;
	const hpItem = ITEMS_BY_NAME.rubyCrystal;
	const mpItem = ITEMS_BY_NAME.sapphireCrystal;
	const itemHp = hpItem.stats.FlatHPPoolMod;
	const itemMp = mpItem.stats.FlatMPPoolMod;
	const partialHp = 100;
	const partialMp = 100;

	if (partialHp >= itemHp || partialMp >= itemMp) {
		throw new Error('invalid partial values');
	}

	await t.test('no champion | no items', async () => {
		const damageSource = new DamageSource();
		await nextTick();

		assert.equal(damageSource.maxHealth.value, 0);
		assert.equal(damageSource.maxAbilityResource.value, 0);
		assert.equal(damageSource.currentHealth.value, 0);
		assert.equal(damageSource.currentAbilityResource.value, 0);
	});

	await t.test('no champion | items', async () => {
		const damageSource = new DamageSource({ items: [hpItem, mpItem] });
		await nextTick();

		assert.equal(damageSource.maxHealth.value, itemHp);
		assert.equal(damageSource.maxAbilityResource.value, itemMp);
		assert.equal(damageSource.currentHealth.value, damageSource.maxHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.maxAbilityResource.value);
	});

	await t.test('no champion | items | current 0', async () => {
		const damageSource = new DamageSource({ items: [hpItem, mpItem], currentHealth: 0, currentAbilityResource: 0 });
		await nextTick();

		assert.equal(damageSource.maxHealth.value, itemHp);
		assert.equal(damageSource.maxAbilityResource.value, itemMp);
		assert.equal(damageSource.currentHealth.value, 0);
		assert.equal(damageSource.currentAbilityResource.value, 0);
	});

	await t.test('no champion | item added | current full', async () => {
		const damageSource = new DamageSource({ items: [hpItem, mpItem] });
		await nextTick();

		damageSource.currentHealth.value = damageSource.maxHealth.value;
		damageSource.currentAbilityResource.value = damageSource.maxAbilityResource.value;
		damageSource.addItem(hpItem);
		damageSource.addItem(mpItem);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, 2 * itemHp);
		assert.equal(damageSource.maxAbilityResource.value, 2 * itemMp);
		assert.equal(damageSource.currentHealth.value, damageSource.maxHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.maxAbilityResource.value);
	});

	await t.test('no champion | item added | current partial', async () => {
		const damageSource = new DamageSource({ items: [hpItem, mpItem] });
		await nextTick();

		damageSource.currentHealth.value = partialHp;
		damageSource.currentAbilityResource.value = partialMp;
		damageSource.addItem(hpItem);
		damageSource.addItem(mpItem);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, 2 * itemHp);
		assert.equal(damageSource.maxAbilityResource.value, 2 * itemMp);
		assert.equal(damageSource.currentHealth.value, partialHp);
		assert.equal(damageSource.currentAbilityResource.value, partialMp);
	});

	await t.test('no champion | item removed | current full', async () => {
		const damageSource = new DamageSource({ items: [hpItem, hpItem, mpItem, mpItem] });
		await nextTick();

		damageSource.currentHealth.value = damageSource.maxHealth.value;
		damageSource.currentAbilityResource.value = damageSource.maxAbilityResource.value;
		damageSource.removeItem(3);
		damageSource.removeItem(1);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, itemHp);
		assert.equal(damageSource.maxAbilityResource.value, itemMp);
		assert.equal(damageSource.currentHealth.value, damageSource.maxHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.maxAbilityResource.value);
	});

	await t.test('no champion | item removed | current partial, less than diff', async () => {
		const damageSource = new DamageSource({ items: [hpItem, hpItem, mpItem, mpItem] });
		await nextTick();

		damageSource.currentHealth.value = partialHp;
		damageSource.currentAbilityResource.value = partialMp;
		damageSource.removeItem(3);
		damageSource.removeItem(1);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, itemHp);
		assert.equal(damageSource.maxAbilityResource.value, itemMp);
		assert.equal(damageSource.currentHealth.value, partialHp);
		assert.equal(damageSource.currentAbilityResource.value, partialMp);
	});

	await t.test('no champion | item removed | current partial, more than diff', async () => {
		const damageSource = new DamageSource({ items: [hpItem, hpItem, mpItem, mpItem] });
		await nextTick();

		damageSource.currentHealth.value = partialHp + itemHp;
		damageSource.currentAbilityResource.value = partialMp + itemMp;
		damageSource.removeItem(3);
		damageSource.removeItem(1);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, itemHp);
		assert.equal(damageSource.maxAbilityResource.value, itemMp);
		assert.equal(damageSource.currentHealth.value, damageSource.maxHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.maxAbilityResource.value);
	});

	await t.test('champion | no items', async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id] }).await();
		await nextTick();

		assert.equal(damageSource.maxHealth.value, champion.stats.hp);
		assert.equal(damageSource.maxAbilityResource.value, champion.stats.mp);
		assert.equal(damageSource.currentHealth.value, damageSource.currentHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.currentAbilityResource.value);
	});

	await t.test('champion | items', async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id], items: [hpItem, mpItem] }).await();
		await nextTick();

		assert.equal(damageSource.maxHealth.value, champion.stats.hp + itemHp);
		assert.equal(damageSource.maxAbilityResource.value, champion.stats.mp + itemMp);
		assert.equal(damageSource.currentHealth.value, damageSource.currentHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.currentAbilityResource.value);
	});

	await t.test('champion | items | current 0', async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id], items: [hpItem, mpItem], currentHealth: 0, currentAbilityResource: 0 }).await();
		await nextTick();

		assert.equal(damageSource.maxHealth.value, champion.stats.hp + itemHp);
		assert.equal(damageSource.maxAbilityResource.value, champion.stats.mp + itemMp);
		assert.equal(damageSource.currentHealth.value, 0);
		assert.equal(damageSource.currentAbilityResource.value, 0);
	});

	await t.test('champion | item added | current full', async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id], items: [hpItem, mpItem] }).await();
		await nextTick();

		damageSource.addItem(hpItem);
		damageSource.addItem(mpItem);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, championHp + 2 * itemHp);
		assert.equal(damageSource.maxAbilityResource.value, championMp + 2 * itemMp);
		assert.equal(damageSource.currentHealth.value, damageSource.maxHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.maxAbilityResource.value);
	});

	await t.test('champion | item added | current partial', async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id], items: [hpItem, mpItem] }).await();
		await nextTick();

		damageSource.currentHealth.value = partialHp;
		damageSource.currentAbilityResource.value = partialMp;
		damageSource.addItem(hpItem);
		damageSource.addItem(mpItem);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, championHp + 2 * itemHp);
		assert.equal(damageSource.maxAbilityResource.value, championMp + 2 * itemMp);
		assert.equal(damageSource.currentHealth.value, partialHp);
		assert.equal(damageSource.currentAbilityResource.value, partialMp);
	});

	await t.test('champion | item removed | current full', async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id], items: [hpItem, hpItem, mpItem, mpItem] }).await();
		await nextTick();

		damageSource.currentHealth.value = damageSource.maxHealth.value;
		damageSource.currentAbilityResource.value = damageSource.maxAbilityResource.value;
		damageSource.removeItem(3);
		damageSource.removeItem(1);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, championHp + itemHp);
		assert.equal(damageSource.maxAbilityResource.value, championMp + itemMp);
		assert.equal(damageSource.currentHealth.value, damageSource.maxHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.maxAbilityResource.value);
	});

	await t.test('champion | item removed | current partial, less than diff', async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id], items: [hpItem, hpItem, mpItem, mpItem] }).await();
		await nextTick();

		damageSource.currentHealth.value = partialHp;
		damageSource.currentAbilityResource.value = partialMp;
		damageSource.removeItem(3);
		damageSource.removeItem(1);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, championHp + itemHp);
		assert.equal(damageSource.maxAbilityResource.value, championMp + itemMp);
		assert.equal(damageSource.currentHealth.value, partialHp);
		assert.equal(damageSource.currentAbilityResource.value, partialMp);
	});

	await t.test('champion | item removed | current partial, more than diff', async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id], items: [hpItem, hpItem, mpItem, mpItem] }).await();
		await nextTick();

		damageSource.currentHealth.value = partialHp + itemHp + championHp;
		damageSource.currentAbilityResource.value = partialMp + itemMp + championMp;
		damageSource.removeItem(3);
		damageSource.removeItem(1);

		await nextTick();
		assert.equal(damageSource.maxHealth.value, championHp + itemHp);
		assert.equal(damageSource.maxAbilityResource.value, championMp + itemMp);
		assert.equal(damageSource.currentHealth.value, damageSource.maxHealth.value);
		assert.equal(damageSource.currentAbilityResource.value, damageSource.maxAbilityResource.value);
	});

	await t.test('override, update then change max', { only: true }, async () => {
		const damageSource = await new DamageSource({ champion: CHAMPIONS[champion.id], currentHealth: partialHp, currentAbilityResource: partialMp }).await();
		await nextTick();

		damageSource.currentHealth.value += partialHp / 2;
		damageSource.currentAbilityResource.value += partialMp / 2;
		damageSource.addItem(hpItem);
		damageSource.addItem(mpItem);
		await nextTick();

		assert.equal(damageSource.currentHealth.value, partialHp * 1.5);
		assert.equal(damageSource.currentAbilityResource.value, partialMp * 1.5);
	});
});
