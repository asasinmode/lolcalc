import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId, IItemAbilityId } from './types';
import { markRaw } from 'vue';

export class GameAbilityId {
	static build<
		Id extends IChampionId,
		AbilityKey extends IChampionAbilityKey,
		AbilityVariantIndex extends number,
	>(
		type: 'champion',
		id: Id,
		abilityKey: AbilityKey,
		abilityVariantIndex: AbilityVariantIndex
	): IChampionAbilityId<Id, AbilityKey, AbilityVariantIndex>;
	static build<Id extends string>(
		type: 'item',
		id: Id): IItemAbilityId<Id>;
	static build<Id extends IEffectObjectName>(
		type: 'effect',
		id: IEffectObjectName): IEffectAbilityId<Id>;
	static build(
		type: TAbilityType,
		id: string,
		abilityKey?: IChampionAbilityKey,
		abilityVariantIndex?: number,
	): IGameAbilityId {
		if (type === ABILITY_TYPE.champion) {
			return markRaw({
				type,
				id: id as IChampionId,
				abilityKey: abilityKey!,
				abilityVariantIndex: abilityVariantIndex!,
			});
		}

		if (type === ABILITY_TYPE.effect) {
			return markRaw({ type, id: id as IEffectObjectName });
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
		const typeIndex = ALL_ABILITY_TYPES.indexOf(id.type);
		if (id.type === ABILITY_TYPE.champion) {
			return [
				typeIndex,
				CHAMPION_ID_TO_KEY[id.id],
				ALL_CHAMPION_ABILITY_KEYS.indexOf(id.abilityKey),
				id.abilityVariantIndex,
			].join('-');
		}

		if (id.type === ABILITY_TYPE.effect) {
			return [
				typeIndex,
				EFFECT_SPECIFICS_OBJECT_ENTRIES.findIndex(entry => entry[0] === id.id),
			].join('-');
		}

		return [typeIndex, id.id].join('-');
	}

	static parse(value: string): IGameAbilityId | undefined {
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

			return GameAbilityId.build(type, championId, abilityKey, abilityVariantIndex);
		}

		if (type === ABILITY_TYPE.item) {
			const items = useItems();
			if (!items[id]) {
				return;
			}

			return GameAbilityId.build(type, id);
		}

		if (type === ABILITY_TYPE.effect) {
			const specificEntry = EFFECT_SPECIFICS_OBJECT_ENTRIES.find(entry => entry[0] === id);
			if (!specificEntry) {
				return;
			}

			return GameAbilityId.build(type, specificEntry[0]);
		}

		return undefined;
	}

	static isSame(id1: IGameAbilityId, id2: IGameAbilityId): boolean {
		if (id1.type !== id2.type || id1.id !== id2.id) {
			return false;
		}

		if (id1.type === ABILITY_TYPE.champion) {
			return id1.abilityKey === (id2 as IChampionAbilityId).abilityKey
				&& id1.abilityVariantIndex === (id2 as IChampionAbilityId).abilityVariantIndex;
		}

		return false;
	}
}
