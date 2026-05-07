import type { IChampion, IChampionId, IItem } from '@lolcalc/data/types';
import { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { CHAMPIONS, ITEMS } from '@lolcalc/data';

interface IPatchOverridesFixture {
	champions: Partial<Record<IChampionId, Partial<IChampion>>>;
	items: Record<string, Partial<IItem>>;
}

export async function setupDamageSource(fixture: IPatchOverridesFixture, championId: IChampionId, overrides: ConstructorParameters<typeof DamageSource>[0]): Promise<DamageSource> {
	const rv = await new DamageSource({ champion: CHAMPIONS[championId], ...overrides }).await();
	Object.assign(rv.champion.value!, fixture.champions[championId]);
	return rv;
}

export function setupItems(fixture: IPatchOverridesFixture) {
	for (const item in fixture.items) {
		ITEMS[item] && Object.assign(ITEMS[item], fixture.items[item]);
	}
}
