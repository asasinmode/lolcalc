import type { IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IChampion, IChampionId, IItem } from '@lolcalc/data/types';
import { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { CHAMPIONS, ITEMS } from '@lolcalc/data';

interface IPatchOverridesFixture {
	version: string;
	champions: Partial<Record<IChampionId, Partial<IChampion>>>;
	items: Record<string, Partial<IItem>>;
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

export function setupItems(fixture: IPatchOverridesFixture) {
	for (const item in fixture.items) {
		if (ITEMS[item]) {
			Object.assign(ITEMS[item], fixture.items[item]);
			overriden.items.push(item);
		} else {
			console.warn('[setupItems] unknown item specified in fixture', item, fixture.version);
		}
	}
}
