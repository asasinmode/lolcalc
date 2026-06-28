import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IMiscData } from '@lolcalc/data';
import type { IChampion, IChampionId, IItem } from '@lolcalc/data/types';
import assert from 'node:assert';
import { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { CHAMPIONS, ITEMS, MISC } from '@lolcalc/data';

interface IPatchOverridesFixture {
	version: string;
	champions: Partial<Record<IChampionId, Partial<Omit<IChampion, 'abilities'>> & { abilities?: Partial<IChampion['abilities']> }>>;
	items: Record<string, Partial<IItem>>;
	misc?: Partial<IMiscData>;
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
	if (fixture.misc) {
		Object.assign(MISC, fixture.misc);
	}
}

export function typedPartialDeepStrictEqual<T>(actual: T, expected: Partial<T>) {
	return assert.partialDeepStrictEqual(actual, expected);
}
