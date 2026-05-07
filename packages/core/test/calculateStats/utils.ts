import type { IChampion, IChampionId, IItem } from '@lolcalc/data/types';
import { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { CHAMPIONS } from '@lolcalc/data';

interface IPatchOverridesFixture {
	champions: Partial<Record<IChampionId, Partial<IChampion>>>;
	items: Record<string, Partial<IItem>>;
}

export async function setupDamageSource(championId: IChampionId, fixture: IPatchOverridesFixture): Promise<DamageSource> {
	const rv = await new DamageSource({ champion: CHAMPIONS[championId] }).await();
	Object.assign(rv.champion.value!, fixture.champions[championId]);
	return rv;
}

export function setupItems(fixture: IPatchOverridesFixture) {
	console.log('setting up items');
}
