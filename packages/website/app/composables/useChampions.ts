import { data } from '../assets/champion.json';

export function useChampions(): IChampionData {
	return data satisfies Record<IChampionId, IListedChampion<any>> as IChampionData;
}

type IChampionData = { [Id in IChampionId]: IListedChampion<Id> };

export const CHAMPION_KEY_TO_ID: Record<string, IChampionId> = Object.fromEntries(
	Object.entries(data).map(([id, { key }]) => [key, id as IChampionId]),
);

export const CHAMPION_ID_TO_KEY: Record<IChampionId, string> = Object.fromEntries(
	Object.entries(CHAMPION_KEY_TO_ID).map(([key, id]) => [id as IChampionId, key]),
) as Record<IChampionId, string>;

const championCache = new Map<IChampionId, Promise<IChampion>>();

export async function useChampion(id: string): Promise<IChampion> {
	const cacheHit = championCache.get(id as IChampionId);
	if (cacheHit) {
		return cacheHit;
	}
	/*
	 * if this runs on server, for example a DamageSource with champion id is present during `nuxt generate`, the build will fail with out of memory error because it rerequests itself over and over or something
	 */
	const promise = $fetch<IChampion>(`/data/champion/${id}.json`);
	// TODO try to turn into into async import with `?raw=`?
	championCache.set(id as IChampionId, promise);
	return promise;
}
