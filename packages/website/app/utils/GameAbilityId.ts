import type { IChampionAbilityId, IGameAbilityId, IItemAbilityId } from './types';
import { markRaw } from 'vue';

export class GameAbilityId {
	static build<
		Id extends IChampionId,
		Source extends TAbilityDataSource,
		AbilityKey extends IChampionAbilityKey,
		AbilityVariantIndex extends number,
	>(
		type: 'champion',
		dataSource: Source,
		id: Id,
		abilityKey: AbilityKey,
		abilityVariantIndex: AbilityVariantIndex
	): IChampionAbilityId<Id, Source, AbilityKey, AbilityVariantIndex>;
	static build<Id extends string, Source extends TAbilityDataSource>(
		type: 'item',
		dataSource: Source,
		id: Id): IItemAbilityId<Id, Source>;
	static build(
		type: TAbilityType,
		dataSource: TAbilityDataSource,
		id: string,
		abilityKey?: IChampionAbilityKey,
		abilityVariantIndex?: number,
	): IGameAbilityId {
		if (type === 'champion') {
			return markRaw({
				type,
				dataSource,
				id: id as IChampionId,
				abilityKey: abilityKey!,
				abilityVariantIndex: abilityVariantIndex!,
			});
		}

		return markRaw({ type, dataSource, id });
	}

	/**
	 * for champion: `${typeIndex}-${championId}-${abilityKeyIndex}-${abilityVariantIndex}`
	 * for item: `${typeIndex}-${itemId}`
	 *
	 * `typeIndex` is `ALL_ABILITY_TYPES.indexOf(type)`
	 * `abilityKeyIndex` is `ALL_CHAMPION_ABILITY_KEYS.indexOf(type)`
	 */
	static stringify(id: IGameAbilityId): string {
		if (id.type === 'champion') {
			return [
				ALL_ABILITY_TYPES.indexOf(id.type),
				CHAMPION_ID_TO_KEY[id.id],
				ALL_CHAMPION_ABILITY_KEYS.indexOf(id.abilityKey),
				id.abilityVariantIndex,
			].join('-');
		}

		return [ALL_ABILITY_TYPES.indexOf(id.type), id.id].join('-');
	}

	static parse(value: string, dataSource: TAbilityDataSource): IGameAbilityId | undefined {
		const [rawType, id, rawAbilityKeyIndex, rawAbilityVariantIndex] = value.split('-');
		if (!id) {
			return;
		}

		const type = rawType ? ALL_ABILITY_TYPES[Number.parseInt(rawType)] : undefined;

		if (type === ABILITY_TYPE.champion) {
			const champions = useChampions();
			const championId = CHAMPION_KEY_TO_ID[id];
			if (!championId || !(championId in champions)) {
				return;
			}

			const abilityKeyIndex = rawAbilityKeyIndex ? Number.parseInt(rawAbilityKeyIndex) : undefined;
			if (abilityKeyIndex === undefined || !ALL_CHAMPION_ABILITY_KEYS[abilityKeyIndex]) {
				return;
			};

			const abilityVariantIndex = rawAbilityVariantIndex ? Number.parseInt(rawAbilityVariantIndex) : undefined;
			if (abilityVariantIndex === undefined || Number.isNaN(abilityVariantIndex)) {
				return;
			};

			const abilityKey = ALL_CHAMPION_ABILITY_KEYS[abilityKeyIndex];

			return GameAbilityId.build(type, dataSource, championId, abilityKey, abilityVariantIndex);
		}

		if (type === ABILITY_TYPE.item) {
			const items = useItems();
			if (!items[id]) {
				return;
			}

			return GameAbilityId.build(type, dataSource, id);
		}

		return undefined;
	}

	static isSame(id1: IGameAbilityId, id2: IGameAbilityId) {
		return id1.type === id2.type && id1.id === id2.id
			&& (id1 as IChampionAbilityId).abilityKey === (id2 as IChampionAbilityId).abilityKey
			&& (id1 as IChampionAbilityId).abilityVariantIndex === (id2 as IChampionAbilityId).abilityVariantIndex;
	}
}
