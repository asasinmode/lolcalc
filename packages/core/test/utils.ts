import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IEffectData, IMiscData } from '@lolcalc/data';
import type { IChampion, IChampionId, IDragonName, IItem } from '@lolcalc/data/types';
import assert from 'node:assert';
import { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { CHAMPIONS, EFFECTS, ITEMS, MISC } from '@lolcalc/data';

interface IPatchOverridesFixture {
	version: string;
	champions: Partial<Record<IChampionId, Partial<Omit<IChampion, 'abilities'>> & { abilities?: Partial<IChampion['abilities']> }>>;
	items: Record<string, Partial<IItem>>;
	effects: IEffectData;
	/** dragon fixture's type allows partial but the test will crash if it's trying to use a dragon that's not fixtured. It's intended */
	misc?: { roleQuests: Partial<IMiscData['roleQuests']> } & Partial<Record<IDragonName, Partial<IMiscData['dragons'][IDragonName]>>>;
}

const overriden: {
	items: string[];
} = { items: [] };

export async function setupDamageSource<T extends IChampionId>(fixture: IPatchOverridesFixture, championId: T, overrides: IOverrides<T> = {}): Promise<DamageSource<T>> {
	const rv = await new DamageSource({ champion: CHAMPIONS[championId], ...overrides }).await();
	Object.assign(rv.champion.value!, fixture.champions[championId]);

	if (!(championId in fixture.champions)) {
		console.warn('[setupDamageSource] using champion not present in the fixture', fixture.version, championId);
	}

	for (const item of rv.items.value) {
		if (item && !overriden.items.includes(item.id)) {
			console.warn('[setupDamageSource] using item not present in the fixture', fixture.version, item.id, item.name);
		}
	}

	return rv;
}

export function setupPatchFixture(fixture: IPatchOverridesFixture) {
	for (const item in fixture.items) {
		if (ITEMS[item]) {
			Object.assign(ITEMS[item], fixture.items[item]);
			overriden.items.push(item);
		} else {
			console.warn('[setupItems] unknown item specified in fixture', item, fixture.version);
		}
	}
	fixture.misc && Object.assign(MISC, fixture.misc);
	fixture.effects && Object.assign(EFFECTS, fixture.effects);
}

export function typedPartialDeepStrictEqual<T>(actual: T, expected: Partial<T>, damageSource?: DamageSource, message: string = '') {
	try {
		assert.partialDeepStrictEqual(actual, expected, message);
	} catch (e) {
		damageSource && console.error(`failing${message ? ` ${message}` : ''} source: http://localhost:3000/?v=1&src=${damageSource.stringifiedData.value}`);
		throw e;
	}
}
