import type { IDamageSourceEffect, IOverrides } from '@lolcalc/core/DamageSource.ts';
import type { IEffectAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IEffectDataOf } from '@lolcalc/core/specifics';
import type { IEffectData, IMiscData } from '@lolcalc/data';
import type { IChampion, IChampionId, IDragonName, IItem, IRunePath, IRunePathName, IRuneShard, IRuneShardSlotName, IRuneShardSlotValue } from '@lolcalc/data/types';
import assert from 'node:assert';
import { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { EFFECT_SPECIFICS } from '@lolcalc/core/specifics/effect.ts';
import { CHAMPIONS, EFFECTS, ITEMS, MISC, RUNES } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';
import { ref, shallowRef } from 'vue';

interface IPatchOverridesFixture {
	version: string;
	champions: Partial<Record<IChampionId, Partial<Omit<IChampion, 'abilities'>> & { abilities?: Partial<IChampion['abilities']> }>>;
	items: Record<string, Partial<IItem>>;
	effects?: Partial<IEffectData>;
	/** dragon fixture's type allows partial but the test will crash if it's trying to use a dragon that's not fixtured. It's intended */
	misc?: { roleQuests: Partial<IMiscData['roleQuests']>; dragons?: Partial<Record<IDragonName, Partial<IMiscData['dragons'][IDragonName]>>> };
	runes?: {
		paths?: Partial<Record<IRunePathName, Pick<IRunePath, 'slots'>>>;
		/* no point in typing it atm */
		shards?: Partial<Record<IRuneShardSlotName, Partial<Record<IRuneShardSlotValue, Pick<IRuneShard, 'effectAmount'>>>>>;
	};
}

export async function setupDamageSource<T extends IChampionId>(fixture: IPatchOverridesFixture, championId: T, overrides: IOverrides<T> = {}): Promise<DamageSource<T>> {
	const rv = await new DamageSource({ champion: CHAMPIONS[championId], ...overrides }).await();
	Object.assign(rv.champion.value!, fixture.champions[championId]);

	if (!(championId in fixture.champions)) {
		console.warn('[setupDamageSource] using champion not present in the fixture', fixture.version, championId);
	}

	for (const item of rv.items.value) {
		if (item && !(item.id in fixture.items)) {
			console.warn('[setupDamageSource] using item not present in the fixture', fixture.version, item.id, item.name);
		}
	}

	for (const effect of rv.appliedEffects.value) {
		const { sourceAbility } = EFFECT_SPECIFICS[effect.abilityId.id];
		switch (sourceAbility.type) {
			case AbilityType.item: {
				if (!(sourceAbility.id in fixture.items)) {
					console.warn('[setupDamageSource] using item effect not present in the fixture', fixture.version, sourceAbility.id, ITEMS[sourceAbility.id]?.name);
				}
				break;
			}
			case AbilityType.champion: {
				if (!fixture.champions[sourceAbility.id]?.abilities?.[sourceAbility.abilityKey]?.variants?.[sourceAbility.abilityVariantIndex]) {
					console.warn('[setupDamageSource] using champion effect not present in the fixture', fixture.version, sourceAbility.id, sourceAbility.abilityKey, sourceAbility.abilityVariantIndex);
				}
				break;
			}
			case AbilityType.dragon: {
				if (!fixture.misc?.dragons?.[sourceAbility.id]?.[sourceAbility.subtype]) {
					console.warn('[setupDamageSource] using dragon effect not present in the fixture', fixture.version, sourceAbility.id, sourceAbility.id, sourceAbility.subtype);
				}
				break;
			}
			case AbilityType.effect: {
				if (!fixture.effects?.[sourceAbility.id]) {
					console.warn('[setupDamageSource] using effect not present in the fixture', fixture.version, sourceAbility.id, sourceAbility.id);
				}
				break;
			}
			default: {
				return sourceAbility satisfies never;
			}
		}
	}

	return rv;
}

export function setupPatchFixture(fixture: IPatchOverridesFixture) {
	for (const item in fixture.items) {
		if (ITEMS[item]) {
			Object.assign(ITEMS[item], fixture.items[item]);
		} else {
			console.warn('[setupItems] unknown item specified in fixture', item, fixture.version);
		}
	}
	fixture.misc && Object.assign(MISC, fixture.misc);
	fixture.effects && Object.assign(EFFECTS, fixture.effects);

	if (fixture.runes?.paths) {
		for (const [path, pathValue] of Object.entries(fixture.runes.paths)) {
			Object.assign(RUNES.paths[path as IRunePathName], { slots: pathValue.slots });
		}
	}
	if (fixture.runes?.shards) {
		for (const [slotName, slotValue] of Object.entries(fixture.runes.shards)) {
			Object.assign(RUNES.shards[slotName as IRuneShardSlotName], slotValue);
		}
	}
}

export function typedPartialDeepStrictEqual<T>(actual: T, expected: Partial<T>, damageSource?: DamageSource, message: string = '') {
	try {
		assert.partialDeepStrictEqual(actual, expected, message);
	} catch (e) {
		damageSource && console.error(`failing${message ? ` ${message}` : ''} source: http://localhost:3000/?v=1&src=${damageSource.stringifiedData.value}`);
		throw e;
	}
}

export function overridesAppliedEffect<T extends IEffectAbilityId>(
	abilityId: T,
	data: IEffectDataOf<T['id']>,
): IDamageSourceEffect<IEffectAbilityId<T['id']>> {
	return {
		abilityId,
		data: ref(data as any),
		source: shallowRef(),
		champion: shallowRef(),
	};
}
