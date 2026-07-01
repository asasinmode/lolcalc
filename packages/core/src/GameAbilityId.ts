import type { IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IEffectObjectName, IMiscSpecificKey, TAbilityType } from '@lolcalc/shared';
import { CHAMPIONS, ITEMS } from '@lolcalc/data';
import { AbilityType, ALL_ABILITY_TYPES, ALL_CHAMPION_ABILITY_KEYS } from '@lolcalc/shared';
import { markRaw } from 'vue';

export interface IChampionAbilityId<
	Id extends IChampionId = IChampionId,
	AbilityKey extends IChampionAbilityKey = IChampionAbilityKey,
	AbilityVariantIndex extends number = number,
> {
	type: typeof AbilityType['champion'];
	id: Id;
	abilityKey: AbilityKey;
	abilityVariantIndex: AbilityVariantIndex;
}

export interface IItemAbilityId<Id extends string = string> {
	type: typeof AbilityType['item'];
	/** item id */
	id: Id;
}

export interface IEffectAbilityId<Id extends IEffectObjectName = IEffectObjectName> {
	type: typeof AbilityType['effect'];
	id: Id;
}

export interface IMiscAbilityId<Id extends IMiscSpecificKey = IMiscSpecificKey> {
	type: typeof AbilityType['misc'];
	id: Id;
}

export type IGameAbilityId = IChampionAbilityId | IItemAbilityId | IEffectAbilityId | IMiscAbilityId;

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
	static build<Id extends IMiscSpecificKey>(
		type: 'misc',
		id: Id,
	): IMiscAbilityId<Id>;
	static build(
		type: TAbilityType,
		id: string,
		abilityKey?: IChampionAbilityKey,
		abilityVariantIndex?: number,
	): IGameAbilityId {
		if (type === AbilityType.champion) {
			return markRaw({
				type,
				id: id as IChampionId,
				abilityKey: abilityKey!,
				abilityVariantIndex: abilityVariantIndex!,
			});
		}

		if (type === AbilityType.effect) {
			return markRaw({ type, id: id as IEffectObjectName });
		}

		if (type === AbilityType.misc) {
			return markRaw({ type, id: id as IMiscSpecificKey });
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
		miscSpecificsObjectEntries: [miscSpecificKey: IMiscSpecificKey, any][],
	): string {
		const typeIndex = ALL_ABILITY_TYPES.indexOf(id.type);
		if (id.type === AbilityType.champion) {
			return [
				typeIndex,
				championIdToKey[id.id],
				ALL_CHAMPION_ABILITY_KEYS.indexOf(id.abilityKey),
				id.abilityVariantIndex,
			].join('-');
		}

		if (id.type === AbilityType.effect) {
			return [
				typeIndex,
				effectSpecificsObjectEntries.findIndex(entry => entry[0] === id.id),
			].join('-');
		}

		if (id.type === AbilityType.misc) {
			return [
				typeIndex,
				miscSpecificsObjectEntries.findIndex(entry => entry[0] === id.id),
			].join('-');
		}

		return `${typeIndex}-${id.id}`;
	}

	static parse(
		value: string,
		championKeyToId: Record<string, IChampionId>,
		effectSpecificsObjectEntries: [effectObjectName: IEffectObjectName, any][],
		miscSpecificsObjectEntries: [miscSpecificKey: IMiscSpecificKey, any][],
	): IGameAbilityId | undefined {
		const [rawType, id, rawAbilityKeyIndex, rawAbilityVariantIndex] = value.split('-');
		if (!id) {
			return;
		}

		const type = rawType ? ALL_ABILITY_TYPES[Number.parseInt(rawType)] : undefined;

		if (type === AbilityType.champion) {
			const championId = championKeyToId[id];
			if (!championId || !(championId in CHAMPIONS)) {
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

		if (type === AbilityType.item) {
			if (!(id in ITEMS)) {
				return;
			}

			return GameAbilityId.build(type, id);
		}

		if (type === AbilityType.effect) {
			const specificEntry = effectSpecificsObjectEntries[Number.parseInt(id)];
			if (!specificEntry) {
				return;
			}

			return GameAbilityId.build(type, specificEntry[0]);
		}

		if (type === AbilityType.misc) {
			const specificEntry = miscSpecificsObjectEntries[Number.parseInt(id)];
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

		if (id1.type === AbilityType.champion) {
			return id1.abilityKey === (id2 as IChampionAbilityId).abilityKey
				&& id1.abilityVariantIndex === (id2 as IChampionAbilityId).abilityVariantIndex;
		}

		return true;
	}
}
