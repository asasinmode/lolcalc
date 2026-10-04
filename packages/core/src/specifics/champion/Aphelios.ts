import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IAphelios from '@lolcalc/data/files/champion/Aphelios.json';
import type { IChampion } from '@lolcalc/data/types.js';
import type { UnwrapRef } from 'vue';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { clamp } from '@lolcalc/shared/utils.ts';
import { watch } from 'vue';
import { defineChampionVariables } from './shared.ts';

export type IApheliosWeapon = 'calibrum' | 'severum' | 'gravitum' | 'infernum' | 'crescendum';

/* `effectsMeta` has hardcoded gravitum index as 2, update if it changes */
const WEAPON_NAME_TO_VARIANT_INDEX = { calibrum: 0, severum: 1, gravitum: 2, infernum: 3, crescendum: 4 } satisfies Record<IApheliosWeapon, number>;
const	WEAPON_VARIANT_INDEX_TO_NAME = ['calibrum', 'severum', 'gravitum', 'infernum', 'crescendum'] satisfies IApheliosWeapon[];
/** stringtable indexes are different from the actual weapon order - `apheliosgun_name_1` is for calibrum and so */
const	WEAPON_NAME_TO_STRINGTABLE_INDEX = { calibrum: 1, severum: 2, infernum: 3, crescendum: 4, gravitum: 5 } satisfies Record<IApheliosWeapon, number>;

function nextWeapon(afterIndex: number, usedIndexes: number[]): number {
	let rv = (afterIndex + 1) % WEAPON_VARIANT_INDEX_TO_NAME.length;

	while (usedIndexes.includes(rv)) {
		rv = (rv + 1) % WEAPON_VARIANT_INDEX_TO_NAME.length;
	}

	return rv;
}

function calculateQGravitumSlow(champion: IChampion, progress: number) {
	const qParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'q', abilityVariant: champion.abilities.q.variants[WEAPON_NAME_TO_VARIANT_INDEX.gravitum]! };
	const slow = championAbilityVariableValue('SlowAmountInitial', qParams);
	const minSlow = championAbilityVariableValue('{dec81e53}', qParams);
	if (typeof slow.value === 'number' && typeof minSlow.value === 'number') {
		return progress === 1
			? minSlow.value * 100
			: minSlow.value * 100 + (slow.value - minSlow.value) * progress;
	}

	console.warn('[CHAMPION_SPECIFICS aphelios] failed to calculate gravitum slow vars', slow, minSlow);
	return Number.NaN;
}

function qGravitumSlowApplicable(variantIndexes: UnwrapRef<DamageSource['abilityVariantsIndexes']>): boolean {
	return variantIndexes.q === WEAPON_NAME_TO_VARIANT_INDEX.gravitum || variantIndexes.w === WEAPON_NAME_TO_VARIANT_INDEX.gravitum;
}

export default {
	WEAPON_NAME_TO_VARIANT_INDEX,
	WEAPON_VARIANT_INDEX_TO_NAME,
	WEAPON_NAME_TO_STRINGTABLE_INDEX,
	setupData(self) {
		const abilityVariantsIndexes = self.abilityVariantsIndexes.value;

		abilityVariantsIndexes.q ??= WEAPON_NAME_TO_VARIANT_INDEX.calibrum;
		const usedIndexes: number[] = [abilityVariantsIndexes.q];

		abilityVariantsIndexes.w ??= WEAPON_NAME_TO_VARIANT_INDEX.severum;
		if (abilityVariantsIndexes.w === abilityVariantsIndexes.q) {
			abilityVariantsIndexes.w = nextWeapon(abilityVariantsIndexes.q, usedIndexes);
		}
		usedIndexes.push(abilityVariantsIndexes.w);

		abilityVariantsIndexes.e ??= WEAPON_NAME_TO_VARIANT_INDEX.gravitum;
		if (
			abilityVariantsIndexes.e === abilityVariantsIndexes.q
			|| abilityVariantsIndexes.e === abilityVariantsIndexes.w
		) {
			abilityVariantsIndexes.e = nextWeapon(abilityVariantsIndexes.e, usedIndexes);
		}
		usedIndexes.push(abilityVariantsIndexes.e);

		let lastRotatedVariantIndex: number = self.internalData.value.lastRotatedVariantIndex ?? WEAPON_NAME_TO_VARIANT_INDEX.crescendum;
		if (usedIndexes.includes(lastRotatedVariantIndex)) {
			lastRotatedVariantIndex = nextWeapon(abilityVariantsIndexes.e + 1, usedIndexes);
		}

		return {
			lastRotatedVariantIndex,
			gravitumSlowProgress: clamp(0, Math.round(self.internalData.value.gravitumSlowProgress ?? 0), 100),
			_watchHandles: [watch(self.level, () => {
				self.abilityLevels.value.r = Math.floor((self.level.value - 1) / 5);
			}, { immediate: true })],
		};
	},
	passive: {
		variables: defineChampionVariables<'Aphelios', typeof IAphelios, 'passive'>()({
			known: {
				AttackDamage: [],
				AttackSpeed: [],
				ArPenBonus: [],
				f1: [1, 2, 3, 4, 5],
				f2: [],
				f3: [],
				f4: [],
				f5: [],
			},
			calculate(self) {
				const { q: qVariant, w: wVariant, e: eVariant } = self.abilityVariantsIndexes.value;

				const f1: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[qVariant]!];
				const f2: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[wVariant]!];
				const f3: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[eVariant]!];
				const f5: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[self.internalData.value.lastRotatedVariantIndex]!];

				const fourthWeaponIndex = 4 ^ qVariant ^ wVariant ^ eVariant ^ self.internalData.value.lastRotatedVariantIndex;
				const f4: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[fourthWeaponIndex]!];

				return {
					AttackDamage: {
						value: self.stats.value.championPassive.attackDamage,
					},
					AttackSpeed: {
						value: self.stats.value.championPassive.bonusAttackSpeedPercent,
					},
					ArPenBonus: {
						value: self.stats.value.championPassive.lethality,
					},
					f1: { value: f1 },
					f2: { value: f2 },
					f3: { value: f3 },
					f4: { value: f4 },
					f5: { value: f5 },
				};
			},
			meta: {
				AttackSpeed: {
					isPercentage: true,
					multiplier: 100,
				},
			},
			uninteresting: ['AttackDamageMax', 'AttackSpeedMax', 'ArPenBonusMax', 'f1', 'f2', 'f3', 'f4', 'f5'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Aphelios', typeof IAphelios, 'q'>()({
			known: {
				/* each weapon's stringtable variant index */
				f1: [1, 2, 3, 4, 5],
				f3: [1, 2, 3, 4, 5],
				/* also 0, gravitum has "this weapon does not use offhand" */
				f5: [0, 1, 2, 3, 4, 5],
				/* array of 12, 13, ..., 21, 23, ..., 53, 54 - no 2 repeated numbers like 11, 22 */
				f7: Array.from({ length: 5 }, (_, i) => i + 1).flatMap(i => Array.from({ length: 5 }, (_, j) => i === (j + 1) ? undefined : `${i}${j + 1}`).filter(Boolean)) as string[],
			},
			calculate(self) {
				/* check e variables for more details on what's going on with indexes */
				const { q, w } = self.abilityVariantsIndexes.value;

				const mainWeaponIndex: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[q]!];
				const offhandWeaponIndex: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[w]!];
				/* offhand weapon reminder in rules, gravitum special case as it doesnt use offhand */
				const f5: number = q === WEAPON_NAME_TO_VARIANT_INDEX.gravitum ? 0 : offhandWeaponIndex;

				return {
					f1: { value: mainWeaponIndex },
					f3: { value: mainWeaponIndex },
					f5: { value: f5 },
					f7: {
						value: `${mainWeaponIndex}${offhandWeaponIndex}`,
					},
				};
			},
		}),
		derivedGravitumSlow: ((progress, self): number => {
			return self?.effectsOntoTargetVars.value.apheliosGravitumSlow ?? calculateQGravitumSlow(self.champion.value!, progress);
		}) satisfies IDeriveProgressFn,
		calculateGravitumSlow: calculateQGravitumSlow,
		gravitumSlowApplicable: qGravitumSlowApplicable,
	},
	e: {
		variables: defineChampionVariables<'Aphelios', typeof IAphelios, 'e'>()({
			known: {
				/* "[main|next|offhand] weapons" text */
				f1: [1, 2, 3],
				/* seem to be variants for the same thing f1 is */
				f2: [1, 2, 3],
				/* each weapon's stringtable indexes */
				f3: [1, 2, 3, 4, 5],
			},
			/** unused, overwritten by indexes' variables */
			calculate() {
				return {
					f1: { value: Number.NaN },
					f2: { value: Number.NaN },
					f3: { value: Number.NaN },
				};
			},
		}),
		...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [i, {
			variables: defineChampionVariables<'Aphelios', typeof IAphelios, 'e'>()({
				known: {
					f1: [],
					f2: [],
					f3: [],
				},
				calculate(self) {
					const { q, w, e } = self.abilityVariantsIndexes.value;

					const stringtableIndex: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[i]!];

					return {
						/* 1 - main, 2 - offhand, 3 - next. The numbers are for stringtable. The ability indexes of q/w/e are used in Aphelios' abilities component */
						f1: { value: i === e ? 3 : i === w ? 2 : 1 },
						/* when it's main hand weapon, a more detailed description is displayed and the stringtable key is under `1`. If offhand/next, less details - 2 */
						f2: { value: q === i ? 1 : 2 },
						f3: { value: stringtableIndex },
					};
				},
			}),
		}])),
	},
	r: {
		variables: defineChampionVariables<'Aphelios', typeof IAphelios, 'r'>()({
			known: {
				f1: [1, 2, 3, 4, 5],
			},
			calculate(self) {
				const { q: qVariant } = self.abilityVariantsIndexes.value;
				const qVariantIndex: number = WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[qVariant]!];

				return {
					f1: { value: qVariantIndex },
				};
			},
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const { q, w, e } = self.abilityLevels.value;
				const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, abilityKey: 'passive', damageSource: self };

				const adPerRank = championAbilityVariableValue('ADPerRank', passiveParams);
				if (typeof adPerRank.value === 'number') {
					championPassiveStats.attackDamage = adPerRank.value * q;
				} else {
					console.warn('[CHAMPION_SPECIFICS aphelios] failed to calculate passive ad per rank', adPerRank);
				}

				const asPerRank = championAbilityVariableValue('ASPerRank', passiveParams);
				if (typeof asPerRank.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent = asPerRank.value * w;
				} else {
					console.warn('[CHAMPION_SPECIFICS aphelios] failed to calculate passive as per rank', asPerRank);
				}

				const lethalityPerRank = championAbilityVariableValue('APPerRank', passiveParams);
				if (typeof lethalityPerRank.value === 'number') {
					championPassiveStats.lethality = lethalityPerRank.value * e;
				} else {
					console.warn('[CHAMPION_SPECIFICS aphelios] failed to calculate passive lethality per rank', lethalityPerRank);
				}

				if (self.abilityVariantsIndexes.value.q === WEAPON_VARIANT_INDEX_TO_NAME.indexOf('calibrum')) {
					const bonusRange = championAbilityVariableValue('BonusRange', { abilityKey: 'q', abilityVariant: self.champion.value!.abilities.q.variants[WEAPON_VARIANT_INDEX_TO_NAME.indexOf('calibrum')]!, damageSource: self });
					if (typeof bonusRange.value === 'number') {
						championPassiveStats.attackRange = bonusRange.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS aphelios] failed to calculate passive calibrum bonus range', bonusRange);
					}
				}
			},
		},
	},
	effectOntoTargetVars(self, vars) {
		if (qGravitumSlowApplicable(self.abilityVariantsIndexes.value)) {
			vars.apheliosGravitumSlow = calculateQGravitumSlow(self.champion.value!, self.internalData.value.gravitumSlowProgress);
		}
	},
} satisfies IChampionSpecific<'Aphelios'>;
