import type { IChampionId, IDragonName } from '@lolcalc/data/types';
import type { EffectObjectName, IChampionAbilityKey, TAbilityType } from '@lolcalc/shared';
import { ALL_DRAGON_NAMES, CHAMPION_ID_TO_KEY, CHAMPION_KEY_TO_ID, CHAMPIONS, ITEMS } from '@lolcalc/data';
import { AbilityType, ALL_ABILITY_TYPES, ALL_CHAMPION_ABILITY_KEYS, EFFECT_OBJECT_NAME_ENTRIES } from '@lolcalc/shared';
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

export interface IEffectAbilityId<Id extends EffectObjectName = EffectObjectName> {
	type: typeof AbilityType['effect'];
	id: Id;
}

export interface IDragonAbilityId<
	Id extends IDragonName = IDragonName,
	Subtype extends 'stack' | 'soul' = 'stack' | 'soul',
> {
	type: typeof AbilityType['dragon'];
	id: Id;
	subtype: Subtype;
}

export type IGameAbilityId = IChampionAbilityId | IItemAbilityId | IEffectAbilityId | IDragonAbilityId;

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
	static build<Id extends EffectObjectName>(
		type: 'effect',
		id: Id): IEffectAbilityId<Id>;
	static build<Id extends IDragonName, Subtype extends 'stack' | 'soul'>(
		type: 'dragon',
		id: Id,
		subtype: Subtype,
	): IDragonAbilityId<Id, Subtype>;
	static build(
		type: TAbilityType,
		id: string,
		abilityKey?: IChampionAbilityKey | 'stack' | 'soul',
		abilityVariantIndex?: number,
	): IGameAbilityId {
		if (type === AbilityType.champion) {
			return markRaw({
				type,
				id: id as IChampionId,
				abilityKey: abilityKey! as IChampionAbilityKey,
				abilityVariantIndex: abilityVariantIndex!,
			});
		}

		if (type === AbilityType.effect) {
			return markRaw({ type, id: id as EffectObjectName });
		}

		if (type === AbilityType.dragon) {
			return markRaw({ type, id: id as IDragonName, subtype: abilityKey as 'stack' | 'soul' });
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
	static stringify(id: IGameAbilityId): string {
		const typeIndex = ALL_ABILITY_TYPES.indexOf(id.type);
		if (id.type === AbilityType.champion) {
			return [
				typeIndex,
				CHAMPION_ID_TO_KEY[id.id],
				ALL_CHAMPION_ABILITY_KEYS.indexOf(id.abilityKey),
				id.abilityVariantIndex,
			].join('-');
		}

		if (id.type === AbilityType.effect) {
			return [
				typeIndex,
				EFFECT_OBJECT_NAME_ENTRIES.findIndex(entry => entry[1] === id.id),
			].join('-');
		}

		if (id.type === AbilityType.dragon) {
			return [
				typeIndex,
				ALL_DRAGON_NAMES.indexOf(id.id),
				id.subtype === 'stack' ? 0 : 1,
			].join('-');
		}

		return `${typeIndex}-${id.id}`;
	}

	static parse(value: string): IGameAbilityId | undefined {
		const [rawType, id, rawAbilityKeyIndex, rawAbilityVariantIndex] = value.split('-');
		if (!id) {
			return;
		}

		const type = rawType ? ALL_ABILITY_TYPES[Number.parseInt(rawType)] : undefined;

		if (type === AbilityType.champion) {
			const championId = CHAMPION_KEY_TO_ID[id];
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
			const specificEntry = EFFECT_OBJECT_NAME_ENTRIES[Number.parseInt(id)];
			if (!specificEntry) {
				return;
			}

			return GameAbilityId.build(type, specificEntry[1]);
		}

		if (type === AbilityType.dragon) {
			const dragon = ALL_DRAGON_NAMES[Number.parseInt(id)];
			if (!dragon) {
				return;
			}
			const subtype = rawAbilityKeyIndex ? Number.parseInt(rawAbilityKeyIndex) ? 'soul' : 'stack' : undefined;
			if (!subtype) {
				return;
			}

			return GameAbilityId.build(type, dragon, subtype);
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
