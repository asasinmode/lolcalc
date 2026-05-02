import type { IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IEffectObjectName, TAbilityType } from '@lolcalc/shared';
import championData from '@lolcalc/data/files/champion.json' with { type: 'json' };
import itemData from '@lolcalc/data/files/item.json' with { type: 'json' };
import { ABILITY_TYPE, ALL_ABILITY_TYPES, ALL_CHAMPION_ABILITY_KEYS } from '@lolcalc/shared';
import { markRaw } from 'vue';

export interface IChampionAbilityId<
	Id extends IChampionId = IChampionId,
	AbilityKey extends IChampionAbilityKey = IChampionAbilityKey,
	AbilityVariantIndex extends number = number,
> {
	type: typeof ABILITY_TYPE['champion'];
	id: Id;
	abilityKey: AbilityKey;
	abilityVariantIndex: AbilityVariantIndex;
}

export interface IItemAbilityId<Id extends string = string> {
	type: typeof ABILITY_TYPE['item'];
	/** item id */
	id: Id;
}

export interface IEffectAbilityId<Id extends IEffectObjectName = IEffectObjectName> {
	type: typeof ABILITY_TYPE['effect'];
	id: Id;
}

export type IGameAbilityId = IChampionAbilityId | IItemAbilityId | IEffectAbilityId;

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
		id: Id): IEffectAbilityId<Id>;
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
	 * for effect: `${effect}-${effectObjectIndex}`
	 *
	 * `typeIndex` is `ALL_ABILITY_TYPES.indexOf(type)`
	 * `abilityKeyIndex` is `ALL_CHAMPION_ABILITY_KEYS.indexOf(abilityKey)`
	 * `effectObjectIndex` is `Object.keys(EFFECT_OBJECT_NAMES).indexOf(id)`
	 */
	static stringify(
		id: IGameAbilityId,
		championIdToKey: Record<IChampionId, string>,
		effectSpecificsObjectEntries: [effectObjectName: IEffectObjectName, any][],
	): string {
		const typeIndex = ALL_ABILITY_TYPES.indexOf(id.type);
		if (id.type === ABILITY_TYPE.champion) {
			return [
				typeIndex,
				championIdToKey[id.id],
				ALL_CHAMPION_ABILITY_KEYS.indexOf(id.abilityKey),
				id.abilityVariantIndex,
			].join('-');
		}

		if (id.type === ABILITY_TYPE.effect) {
			return [
				typeIndex,
				effectSpecificsObjectEntries.findIndex(entry => entry[0] === id.id),
			].join('-');
		}

		return [typeIndex, id.id].join('-');
	}

	static parse(
		value: string,
		championKeyToId: Record<string, IChampionId>,
		effectSpecificsObjectEntries: [effectObjectName: IEffectObjectName, any][],
	): IGameAbilityId | undefined {
		const [rawType, id, rawAbilityKeyIndex, rawAbilityVariantIndex] = value.split('-');
		if (!id) {
			return;
		}

		const type = rawType ? ALL_ABILITY_TYPES[Number.parseInt(rawType)] : undefined;

		if (type === ABILITY_TYPE.champion) {
			const championId = championKeyToId[id];
			if (!championId || !(championId in championData.data)) {
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
			if (!(id in itemData.data)) {
				return;
			}

			return GameAbilityId.build(type, id);
		}

		if (type === ABILITY_TYPE.effect) {
			const specificEntry = effectSpecificsObjectEntries.find(entry => entry[0] === id);
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

		return true;
	}
}
