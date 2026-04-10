import type { IChampionAbilityId, IGameAbilityId, IItemAbilityId } from './types';

export class GameAbilityId {
	static build(type: 'champion', id: IChampionId, abilityKey: IChampionAbilityKey, abilityVariantIndex: number): IChampionAbilityId;
	static build(type: 'item', id: string): IItemAbilityId;
	static build(
		type: TAbilityType,
		id: string,
		abilityKey?: IChampionAbilityKey,
		abilityVariantIndex?: number,
	): IGameAbilityId {
		if (type === 'champion') {
			return markRaw({
				type,
				id: id as IChampionId,
				abilityKey: abilityKey!,
				abilityVariantIndex: abilityVariantIndex!,
			});
		}

		return markRaw({ type, id });
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
				id.id,
				ALL_CHAMPION_ABILITY_KEYS.indexOf(id.abilityKey),
				id.abilityVariantIndex,
			].join('-');
		}

		return [ALL_ABILITY_TYPES.indexOf(id.type), id.id].join('-');
	}

	static parse(value: string): IGameAbilityId | undefined {
		const [rawType, id, rawAbilityKeyIndex, rawAbilityVariantIndex] = value.split('-');
		if (!id) {
			return;
		}

		const type = rawType ? ALL_ABILITY_TYPES[Number.parseInt(rawType)] : undefined;

		if (type === ABILITY_TYPE.champion) {
			const champions = useChampions();
			if (!(id in champions)) {
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

			return GameAbilityId.build(type, id as IChampionId, abilityKey, abilityVariantIndex);
		}

		if (type === ABILITY_TYPE.item) {
			const items = useItems();
			if (!items[id]) {
				return;
			}

			return GameAbilityId.build(type, id);
		}

		return undefined;
	}

	static isSame(id1: IGameAbilityId, id2: IGameAbilityId) {
		return id1.type === id2.type && id1.id === id2.id
			&& (id1 as IChampionAbilityId).abilityKey === (id2 as IChampionAbilityId).abilityKey
			&& (id1 as IChampionAbilityId).abilityVariantIndex === (id2 as IChampionAbilityId).abilityVariantIndex;
	}
}
