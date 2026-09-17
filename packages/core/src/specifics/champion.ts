import type IAkali from '@lolcalc/data/files/champion/Akali.json';
import type IAphelios from '@lolcalc/data/files/champion/Aphelios.json';
import type IAshe from '@lolcalc/data/files/champion/Ashe.json';
import type IBard from '@lolcalc/data/files/champion/Bard.json';
import type IBelveth from '@lolcalc/data/files/champion/Belveth.json';
import type IBriar from '@lolcalc/data/files/champion/Briar.json';
import type ICassiopeia from '@lolcalc/data/files/champion/Cassiopeia.json';
import type IChogath from '@lolcalc/data/files/champion/Chogath.json';
import type IDarius from '@lolcalc/data/files/champion/Darius.json';
import type IDraven from '@lolcalc/data/files/champion/Draven.json';
import type IDrMundo from '@lolcalc/data/files/champion/DrMundo.json';
import type IEvelynn from '@lolcalc/data/files/champion/Evelynn.json';
import type IEzreal from '@lolcalc/data/files/champion/Ezreal.json';
import type IFiora from '@lolcalc/data/files/champion/Fiora.json';
import type IIrelia from '@lolcalc/data/files/champion/Irelia.json';
import type IJax from '@lolcalc/data/files/champion/Jax.json';
import type IJhin from '@lolcalc/data/files/champion/Jhin.json';
import type IKaisa from '@lolcalc/data/files/champion/Kaisa.json';
import type IKalista from '@lolcalc/data/files/champion/Kalista.json';
import type IKayle from '@lolcalc/data/files/champion/Kayle.json';
import type IKayn from '@lolcalc/data/files/champion/Kayn.json';
import type IKled from '@lolcalc/data/files/champion/Kled.json';
import type IKSante from '@lolcalc/data/files/champion/KSante.json';
import type ILocke from '@lolcalc/data/files/champion/Locke.json';
import type IMonkeyKing from '@lolcalc/data/files/champion/MonkeyKing.json';
import type INaafiri from '@lolcalc/data/files/champion/Naafiri.json';
import type INami from '@lolcalc/data/files/champion/Nami.json';
import type INasus from '@lolcalc/data/files/champion/Nasus.json';
import type INunu from '@lolcalc/data/files/champion/Nunu.json';
import type IOrianna from '@lolcalc/data/files/champion/Orianna.json';
import type IOrnn from '@lolcalc/data/files/champion/Ornn.json';
import type IPyke from '@lolcalc/data/files/champion/Pyke.json';
import type IRammus from '@lolcalc/data/files/champion/Rammus.json';
import type IRell from '@lolcalc/data/files/champion/Rell.json';
import type IRengar from '@lolcalc/data/files/champion/Rengar.json';
import type IRyze from '@lolcalc/data/files/champion/Ryze.json';
import type ISenna from '@lolcalc/data/files/champion/Senna.json';
import type ISeraphine from '@lolcalc/data/files/champion/Seraphine.json';
import type IShyvana from '@lolcalc/data/files/champion/Shyvana.json';
import type ISivir from '@lolcalc/data/files/champion/Sivir.json';
import type ISona from '@lolcalc/data/files/champion/Sona.json';
import type ISyndra from '@lolcalc/data/files/champion/Syndra.json';
import type ITwistedFate from '@lolcalc/data/files/champion/TwistedFate.json';
import type IVarus from '@lolcalc/data/files/champion/Varus.json';
import type IVeigar from '@lolcalc/data/files/champion/Veigar.json';
import type IVladimir from '@lolcalc/data/files/champion/Vladimir.json';
import type IVolibear from '@lolcalc/data/files/champion/Volibear.json';
import type IYasuo from '@lolcalc/data/files/champion/Yasuo.json';
import type IYone from '@lolcalc/data/files/champion/Yone.json';
import type IZaahen from '@lolcalc/data/files/champion/Zaahen.json';
import type IZeri from '@lolcalc/data/files/champion/Zeri.json';
import type IZilean from '@lolcalc/data/files/champion/Zilean.json';
import type { IChampion, IChampionAbilityVariant, IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IChampionStats } from '@lolcalc/shared';
import type { IChampionRole } from '@lolcalc/shared/types.js';
import type { ComputedRef } from 'vue';
import type { DamageSource, ICalculateChampionStatsHookSource, IEffectOntoTargetVarsHook, IProviderGroupDataSetup, IProviderGroupImageText } from '../DamageSource';
import type { DetectChampionVariables } from '../types';
import type { IGameVariableValueParameters } from '../variables/game.ts';
import type { IDefineVariablesConfig, IDeriveProgressFn, IEffectControlsProps, IExtractExtraVariables, IExtraInactiveFn, ISpecificVariables, IVariableValueResult } from './index';
import { PATCH_VERSION, STAT_ICON } from '@lolcalc/data';
import { AbilityType, ALL_CHAMPION_STATS_ENTRIES, EffectObjectName, ITEM_NAME_TO_ID, VariableType } from '@lolcalc/shared';
import { clamp, roundNumber } from '@lolcalc/shared/utils.ts';
import { computed, watch } from 'vue';
import { combineCompounding } from '../calculate/util.ts';
import { GameAbilityId } from '../GameAbilityId.ts';
import { simpleFormattingGameAbilityImage } from '../misc.ts';
import { championAbilityVariableValue, VARIABLE_CALCULATION_FNS } from '../variables/game.ts';
import { defineVariables, HOOK_PRIORITIES } from './index.ts';

const { vMinor } = PATCH_VERSION;

export function cooldownReductionPercentageFromHaste(haste: number): number {
	return haste / (haste + 100) * 100;
}

export type IApheliosWeapon = 'calibrum' | 'severum' | 'gravitum' | 'infernum' | 'crescendum';

/** specific champions' helpers, utils and calculations */
export const CHAMPION_SPECIFICS = {
	TargetDummy: {
		setupData(self) {
			return Object.fromEntries(ALL_CHAMPION_STATS_ENTRIES.map(([statName, statMeta]) => {
				return [
					statName,
					Math.max(0, (self.internalData.value)[statName]
					?? (self.stats.value.initial[statName]) * (statMeta.isPercentage ? 100 : 1)),
				];
			},
			)) as IChampionStats;
		},
		calculateHooks: {
			postInit: {
				handler(self, { baseStats, championPassiveStats }) {
					for (const [statName, statMeta] of ALL_CHAMPION_STATS_ENTRIES) {
						if (statName === 'bonusAttackSpeedPercent') {
							championPassiveStats.bonusAttackSpeedPercent = self.internalData.value[statName] * (statMeta.isPercentage ? 0.01 : 1);
						} else if (self.internalData.value[statName] !== undefined) {
							baseStats[statName] = self.internalData.value[statName] * (statMeta.isPercentage ? 0.01 : 1);
						}
					}
				},
			},
		},
	},
	Akali: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
			};
		},
		passive: {
			variables: defineChampionVariables<'Akali', typeof IAkali, 'passive'>()({
				meta: {
					Damage: {
						type: VariableType.magic,
					},
				},
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, _stats, { calculatedVariables }) {
					if (self.internalData.value.isPassiveMSActive) {
						const bonusMSPercent = championAbilityVariableValue('PassiveSpeedBonus', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });
						if (typeof bonusMSPercent.value === 'number') {
							calculatedVariables.totalBonusPercentMoveSpeed += bonusMSPercent.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS akali] failed to calculate passive bonus ms', bonusMSPercent);
						}
					}
				},
			},
		},
	},
	Ambessa: {
		setupData(self) {
			return {
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
	},
	Amumu: {
		setupData(self) {
			return {
				applyPassive: clamp(0, Math.round(self.internalData.value.applyPassive ?? 0), 1),
			};
		},
	},
	Anivia: {
		setupData(self) {
			return {
				isEgg: clamp(0, Math.round(self.internalData.value.isEgg ?? 0), 1),
			};
		},
		w: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
	},
	Aphelios: {
		WEAPON_NAME_TO_VARIANT_INDEX: { calibrum: 0, severum: 1, gravitum: 2, infernum: 3, crescendum: 4 } satisfies Record<IApheliosWeapon, number>,
		WEAPON_VARIANT_INDEX_TO_NAME: ['calibrum', 'severum', 'gravitum', 'infernum', 'crescendum'] satisfies IApheliosWeapon[],
		/** stringtable indexes are different from the actual weapon order - `apheliosgun_name_1` is for calibrum and so */
		WEAPON_NAME_TO_STRINGTABLE_INDEX: { calibrum: 1, severum: 2, infernum: 3, crescendum: 4, gravitum: 5 } satisfies Record<IApheliosWeapon, number>,
		nextWeapon(
			afterIndex: number,
			usedIndexes: number[],
		): number {
			let rv = (afterIndex + 1) % CHAMPION_SPECIFICS.Aphelios.WEAPON_VARIANT_INDEX_TO_NAME.length;

			while (usedIndexes.includes(rv)) {
				rv = (rv + 1) % CHAMPION_SPECIFICS.Aphelios.WEAPON_VARIANT_INDEX_TO_NAME.length;
			}

			return rv;
		},
		setupData(self) {
			const abilityVariantsIndexes = self.abilityVariantsIndexes.value;
			const { WEAPON_NAME_TO_VARIANT_INDEX, nextWeapon: availableWeapon } = CHAMPION_SPECIFICS.Aphelios;

			abilityVariantsIndexes.q ??= WEAPON_NAME_TO_VARIANT_INDEX.calibrum;
			const usedIndexes: number[] = [abilityVariantsIndexes.q];

			abilityVariantsIndexes.w ??= WEAPON_NAME_TO_VARIANT_INDEX.severum;
			if (abilityVariantsIndexes.w === abilityVariantsIndexes.q) {
				abilityVariantsIndexes.w = availableWeapon(abilityVariantsIndexes.q, usedIndexes);
			}
			usedIndexes.push(abilityVariantsIndexes.w);

			abilityVariantsIndexes.e ??= WEAPON_NAME_TO_VARIANT_INDEX.gravitum;
			if (
				abilityVariantsIndexes.e === abilityVariantsIndexes.q
				|| abilityVariantsIndexes.e === abilityVariantsIndexes.w
			) {
				abilityVariantsIndexes.e = availableWeapon(abilityVariantsIndexes.e, usedIndexes);
			}
			usedIndexes.push(abilityVariantsIndexes.e);

			let lastRotatedVariantIndex: number = self.internalData.value.lastRotatedVariantIndex ?? WEAPON_NAME_TO_VARIANT_INDEX.crescendum;
			if (usedIndexes.includes(lastRotatedVariantIndex)) {
				lastRotatedVariantIndex = availableWeapon(abilityVariantsIndexes.e + 1, usedIndexes);
			}

			return {
				lastRotatedVariantIndex,
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
					const { WEAPON_NAME_TO_STRINGTABLE_INDEX, WEAPON_VARIANT_INDEX_TO_NAME } = CHAMPION_SPECIFICS.Aphelios;

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
					const { WEAPON_NAME_TO_STRINGTABLE_INDEX, WEAPON_VARIANT_INDEX_TO_NAME, WEAPON_NAME_TO_VARIANT_INDEX } = CHAMPION_SPECIFICS.Aphelios;

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
						const { WEAPON_NAME_TO_STRINGTABLE_INDEX, WEAPON_VARIANT_INDEX_TO_NAME } = CHAMPION_SPECIFICS.Aphelios;
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
					const { WEAPON_NAME_TO_STRINGTABLE_INDEX, WEAPON_VARIANT_INDEX_TO_NAME } = CHAMPION_SPECIFICS.Aphelios;

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
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

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

					if (self.abilityVariantsIndexes.value.q === CHAMPION_SPECIFICS.Aphelios.WEAPON_VARIANT_INDEX_TO_NAME.indexOf('calibrum')) {
						const bonusRange = championAbilityVariableValue('BonusRange', { abilityVariant: self.champion.value!.abilities.q.variants[CHAMPION_SPECIFICS.Aphelios.WEAPON_VARIANT_INDEX_TO_NAME.indexOf('calibrum')]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });
						if (typeof bonusRange.value === 'number') {
							championPassiveStats.attackRange = bonusRange.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS aphelios] failed to calculate passive calibrum bonus range', bonusRange);
						}
					}
				},
			},
		},
	},
	Ashe: {
		PASSIVE_OPTIONS: {
			none: 0,
			normal: 1,
			crit: 2,
		},
		setupData(self) {
			const maxPassive: number = CHAMPION_SPECIFICS.Ashe.PASSIVE_OPTIONS.crit;
			return {
				frostShot: clamp(0, Math.round(self.internalData.value.frostShot ?? 0), maxPassive),
			};
		},
		passive: {
			variables: defineChampionVariables<'Ashe', typeof IAshe, 'passive'>()({
				meta: {
					SlowDuration: {
						type: VariableType.affectedByTenacity,
					},
					SlowAmount: {
						type: VariableType.affectedBySlowResist,
					},
					EmpoweredSlowAmount: {
						type: VariableType.affectedBySlowResist,
					},
					DamageBonus: {
						type: VariableType.physical,
					},
				},
			}),
		},
	},
	AurelionSol: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Bard: {
		MAX_CHIME_MS: (self: DamageSource<'Bard'>): number => (self.champion.value! as typeof IBard).abilities.passive.variants[0]!.dataValues.MaxSpeedStacks[1]!,
		setupData(self) {
			const maxChimes: number = CHAMPION_SPECIFICS.Bard.MAX_CHIME_MS(self);
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
				chimeMoveSpeed: clamp(0, Math.round(self.internalData.value.chimeMoveSpeed ?? 0), maxChimes),
			};
		},
	},
	Belveth: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
		passive: {
			variables: defineChampionVariables<'Belveth', typeof IBelveth, 'passive'>()({
				known: {
					'{7f3c01cf}': [],
				},
				calculate(self) {
					return {
						'{7f3c01cf}': {
							value: self.internalData.value.passiveStacks,
						},
					};
				},
				meta: {
					'{7f3c01cf}': {
						isCustom: true,
						displayedName: 'Stacks',
					},
					'TotalAttackSpeedFromStacks': {
						/* game doesn't show any of these */
						extendedEquals: undefined,
						calculatesFrom: [],
					},
				},
				uninteresting: ['SheenSpeedPerStack', 'SheenDuration', 'MonsterStacks', 'ChampionStacks'],
			}),
		},
		q: {
			variables: defineChampionVariables<'Belveth', typeof IBelveth, 'q'>()({
				known: {
					f1: [],
					TotalMonsterDamage: [],
				},
				calculate(self) {
					let f1 = Number.NaN;
					const qParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.q.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self, abilityLevel: self.abilityLevels.value.q };
					const perSideCD = championAbilityVariableValue('PerSideCooldown', qParams);

					if (typeof perSideCD.value === 'number') {
						f1 = perSideCD.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate q per side cd', perSideCD);
					}

					const perSideASToAHRatio = championAbilityVariableValue('PerSideCDAttackSpeedMultiplier', qParams);
					if (typeof perSideASToAHRatio.value === 'number') {
						const haste = (self.stats.value.total.bonusAttackSpeedPercent - (self.stats.value.variables.belvethPostAbilityBonusAS ?? 0)) * perSideASToAHRatio.value * 100;
						const cdr = cooldownReductionPercentageFromHaste(haste);
						f1 *= 1 - (cdr / 100);
					} else {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate q as to ah ratio', perSideASToAHRatio);
					}

					return {
						f1: {
							value: f1,
							roundReplaced: 1,
						},
						TotalMonsterDamage: {
							value: (championAbilityVariableValue('BaseDamage', qParams).value as number) + (championAbilityVariableValue('MonsterMod', qParams).value as number),
						},
					};
				},
				meta: {
					f1: {
						displayedName: 'PerSideCD',
					},
					BaseDamage: {
						type: VariableType.physical,
					},
					TotalMonsterDamage: {
						isCustom: true,
						type: VariableType.physical,
					},
				},
				uninteresting: ['PerSideCDAttackSpeedMultiplier', 'MonsterMod'],
			}),
		},
		w: {
			variables: defineChampionVariables<'Belveth', typeof IBelveth, 'w'>()({
				meta: {
					Damage: {
						type: VariableType.magic,
					},
					SlowPercent: {
						type: VariableType.affectedBySlowResist,
					},
					SlowDuration: {
						type: VariableType.affectedByTenacity,
					},
				},
				uninteresting: ['Duration'],
			}),
		},
		e: {
			variables: defineChampionVariables<'Belveth', typeof IBelveth, 'e'>()({
				known: {
					'f2.0': [],
				},
				calculate(self) {
					return {
						'f2.0': {
							value: championAbilityVariableValue('TotalStrikes', { abilityVariant: self.champion.value!.abilities.e.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.e, damageSource: self }).value,
						},
					};
				},
				meta: {
					'f2.0': {
						displayedName: 'TotalStrikes',
					},
					'DamagePerStrike': {
						type: VariableType.physical,
					},
					'MaxDamagePerStrikeTooltip': {
						type: VariableType.physical,
					},
				},
				uninteresting: ['TotalDuration', 'OnHitRatio', 'MonsterMod'],
			}),
		},
		r: {
			variables: defineChampionVariables<'Belveth', typeof IBelveth, 'r'>()({
				known: {
					TotalComputedExplosionDamage: [],
					ComputedMaxHealthDevour: [],
				},
				calculate(self, target) {
					let TotalComputedExplosionDamage = Number.NaN;

					const ultParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.r, damageSource: self };
					const baseDamage = championAbilityVariableValue('TotalExplosionDamage', ultParams);
					const missingHealthPercent = championAbilityVariableValue('MissingHealthDamage', ultParams);
					if (typeof baseDamage.value === 'number' && typeof missingHealthPercent.value === 'number') {
						TotalComputedExplosionDamage = baseDamage.value + Math.max(0, (target?.stats.value.total.hp ?? 0) - (target?.currentHealth.value ?? 0)) * missingHealthPercent.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate ult total computed damage', baseDamage, missingHealthPercent);
					}

					return {
						TotalComputedExplosionDamage: {
							value: TotalComputedExplosionDamage,
						},
						ComputedMaxHealthDevour: {
							value: self.stats.value.variables.belvethDevourBonusHP ?? 0,
						},
					};
				},
				meta: {
					FinalOnHitDamage: {
						type: VariableType.true,
					},
					TotalExplosionDamage: {
						type: VariableType.true,
						displayedName: 'ExplosionDamage',
					},
					TotalComputedExplosionDamage: {
						isCustom: true,
						type: VariableType.true,
						displayedName: 'TotalDamage',
					},
					MaxMonsterOnHitTooltip: {
						type: VariableType.true,
					},
					BaseMaxHealth: {
						type: VariableType.heal,
					},
					MaxHealthOnDevour: {
						displayedName: 'TooltipMaxHealthOnDevour',
					},
					ComputedMaxHealthDevour: {
						isCustom: true,
						displayedName: 'MaxHealthOnDevour',
						additionalInfo: `The in game tooltip <var>TooltipMaxHealthOnDevour</var> shows an incorrect value. <scalehealth>HP</scalehealth> from Belveth's true form doesn't actually scale with <scalead>attack damage</scalead> and <scaleap>ability power</scaleap> from [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.riftmaker))} Riftmaker's](https://wiki.leagueoflegends.com/en-us/Overlord's_Bloodmail) [Void Infusion](https://wiki.leagueoflegends.com/en-us/Named_item_effect#Void_Infusion), [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.dragon, 'Infernal', 'stack'))} Infernal Might](https://wiki.leagueoflegends.com/en-us/Dragon_Slayer) and [<img src="https://raw.communitydragon.org/${vMinor}/game/assets/ux/lol/rolequest_icon${'mid' satisfies IChampionRole}_complete.png" width="64" height="64" alt="mid quest completed icon"> mid quest's](https://wiki.leagueoflegends.com/en-us/Role_Quests#Quests) multipliers<br> <unknown>TODO bloodmail retribution scaling, currently unimplemented</unknown>`,
					},
				},
				uninteresting: ['PassiveStacksOnDevour', 'MissingHealthDamage', 'SteroidDuration', 'SteroidDurationUpgrade', 'StackThresholdForUpgrade', 'StackThresholdForPermanent', 'TotalASMod', 'VoidlingHPScale', 'VoidlingADScale'],
			}),
		},
		calculateHooks: {
			postInit: {
				handler(self, { baseStats, championPassiveStats }, { calculatedVariables }) {
					calculatedVariables.attackSpeedCap = Number.POSITIVE_INFINITY;

					const rParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.r, damageSource: self };
					const firstDurationIncreaseThreshold = championAbilityVariableValue('StackThresholdForUpgrade', rParams);
					const firstDurationIncrease = championAbilityVariableValue('SteroidDurationUpgrade', rParams);
					const secondDurationIncreaseThreshold = championAbilityVariableValue('StackThresholdForPermanent', rParams);
					if (typeof firstDurationIncreaseThreshold.value === 'number' && typeof secondDurationIncreaseThreshold.value === 'number' && typeof firstDurationIncrease.value === 'number') {
						if (self.internalData.value.passiveStacks >= secondDurationIncreaseThreshold.value) {
							baseStats.mana = 1;
						} else if (self.internalData.value.passiveStacks >= firstDurationIncreaseThreshold.value) {
							baseStats.mana = firstDurationIncrease.value;
						}
					} else {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate true form duration modifiers', firstDurationIncrease, firstDurationIncrease, secondDurationIncreaseThreshold);
					}

					if (!self.currentAbilityResource.value) {
						return;
					}

					const trueFormRange = championAbilityVariableValue('BonusAARange', rParams);
					if (typeof trueFormRange.value === 'number') {
						championPassiveStats.attackRange = trueFormRange.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate true form range', trueFormRange);
					}
				},
			},
			onChampionPassive: {
				handler(self, { championPassiveStats }, { calculatedVariables }) {
					const { passiveStacks, hasPassiveStack } = self.internalData.value;
					const passiveParams = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					championPassiveStats.bonusAttackSpeedPercent = 0;

					if (hasPassiveStack) {
						const sheenBonusAS = championAbilityVariableValue('SheenSpeedPerStack', passiveParams);
						if (typeof sheenBonusAS.value === 'number') {
							championPassiveStats.bonusAttackSpeedPercent += sheenBonusAS.value;
							calculatedVariables.belvethPostAbilityBonusAS = sheenBonusAS.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate passive post ability as', sheenBonusAS);
						}
					}

					const asPerStack = championAbilityVariableValue('AttackSpeedPerStack', passiveParams);
					if (typeof asPerStack.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent += passiveStacks * asPerStack.value / 100;
					} else {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate passive stack as', asPerStack);
					}

					if (self.currentAbilityResource.value) {
						const totalASMult = championAbilityVariableValue('TotalASMod', { abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.r, damageSource: self });
						if (typeof totalASMult.value === 'number') {
							calculatedVariables.totalAttackSpeedMult = totalASMult.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate true form total as', totalASMult);
						}
					}
				},
			},
			postTotal: {
				handler(self, { itemPassivesStats, itemTotalStats, dragonStats, totalStats, totalPreMultipliersStats, totalMultipliersStats, dragonStatMultipliers, bonusStats, championPassiveStats }, { calculatedVariables }) {
					/* the actual values used in belveth's true form hp scaling - stats from some sources are ignored */
					const ultUsedBonusAD = bonusStats.attackDamage
						- totalMultipliersStats.attackDamage; /* infernal & mid quest */
					const ultUsedTotalAP = totalStats.abilityPower
						- totalMultipliersStats.abilityPower /* infernal & mid quest */
						- (calculatedVariables.riftmakerVoidInfusion ?? 0) * calculatedVariables.totalItemApMultipliers; /* all of riftmaker */

					const maxHP = championAbilityVariableValue('MaxHealthOnDevour', {
						abilityVariant: self.champion.value!.abilities.r.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						abilityLevel: self.abilityLevels.value.r,
						damageSource: {
							stats: {
								value: {
									total: { abilityPower: ultUsedTotalAP },
									bonus: { attackDamage: ultUsedBonusAD },
								},
							},
						} as DamageSource,
					});

					if (typeof maxHP.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS belveth] failed to calculate true form max hp', maxHP);
						return;
					}

					calculatedVariables.belvethDevourBonusHP = maxHP.value;

					if (!self.currentAbilityResource.value) {
						return;
					}

					// TODO maybe will be useful for bloodmail retribution calc
					// const baseHPValue = maxHP.calculatesFrom?.[0]?.value as number ?? 0;
					// const hpADScaling = maxHP.calculatesFrom?.[1]?.value as number ?? 0;
					// const hpAPScaling = maxHP.calculatesFrom?.[2]?.value as number ?? 0;

					championPassiveStats.hp = maxHP.value;
					totalStats.hp += maxHP.value;
					bonusStats.hp += maxHP.value;

					if (calculatedVariables.riftmakerBonusHPToAP) {
						let infusion = championPassiveStats.hp * calculatedVariables.riftmakerBonusHPToAP;

						totalPreMultipliersStats.abilityPower += infusion;
						calculatedVariables.riftmakerVoidInfusion! += infusion;
						if (calculatedVariables.apMultipliersBase) {
							calculatedVariables.apMultipliersBase += infusion;
						}

						let multValue = 0;
						if (calculatedVariables.rabadonApMultiplier) {
							const value = infusion * calculatedVariables.rabadonApMultiplier;
							calculatedVariables.rabadonMagicalOpus! += value;
							multValue += value;
						}
						if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
							const value = infusion * calculatedVariables.blackfireTorchBBlazeMultiplier;
							calculatedVariables.blackfireTorchBBlazeAP! += value;
							multValue += value;
						}
						if (dragonStatMultipliers.abilityPower) {
							const value = infusion * dragonStatMultipliers.abilityPower;
							dragonStats.abilityPower! += value;
							multValue += value;
						}
						if (calculatedVariables.midQuestMultiplier) {
							const value = infusion * calculatedVariables.midQuestMultiplier;
							calculatedVariables.midQuestAp! += value;
							multValue += value;
						}
						infusion += multValue;

						itemPassivesStats.abilityPower += infusion;
						itemTotalStats.abilityPower += infusion;
						totalStats.abilityPower += infusion;
						bonusStats.abilityPower += infusion;
					}
				},
				priority: HOOK_PRIORITIES.postTotal.Belveth,
			},
		},
	},
	Briar: {
		passive: {
			variables: defineChampionVariables<'Briar', typeof IBriar, 'passive'>()({
				known: {
					HealIncrease: [],
				},
				calculate(self) {
					return {
						HealIncrease: {
							value: self.stats.value.variables.briarHealingMult ?? 0,
						},
					};
				},
				meta: {
					HealIncrease: {
						isCustom: true,
						resultsMultiplier: 100,
						resultsIsPercentage: true,
					},
				},
				uninteresting: ['BleedDuration', 'MaxBleedStacks', 'HealPercent', 'CurrentHealthPercentCost', 'PercentOfBleedHealedOnKill'],
			}),
		},
		calculateHooks: {
			postTotal: {
				handler(self, { bonusStats, totalStats }, { calculatedVariables }) {
					const currentHpPercent = Math.min(self.currentHealth.value, totalStats.hp) / totalStats.hp;
					const missingHealthPercent = (1 - currentHpPercent) * 100;

					const healingMultVar = championAbilityVariableValue('TotalHealPerMissingHPPercentTooltip', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { stats: { value: { bonus: bonusStats } } } as DamageSource });
					const { calculatesFrom } = healingMultVar;

					if (typeof calculatesFrom?.[0]?.value !== 'number' || typeof calculatesFrom?.[1]?.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS briar] failed to calculate passive healing multiplier', healingMultVar);

						return;
					}

					calculatedVariables.briarHealingMult = calculatesFrom[0].value * missingHealthPercent / 10_000 + (bonusStats.hp / 100) * missingHealthPercent * calculatesFrom[1].value / 100;

					calculatedVariables.hpRegenMult = combineCompounding(calculatedVariables.hpRegenMult, calculatedVariables.briarHealingMult);
					calculatedVariables.healMultAdditive += calculatedVariables.briarHealingMult;
				},
				priority: HOOK_PRIORITIES.postTotal.Briar,
			},
		},
	},
	Cassiopeia: {
		calculateHooks: {
			postInit: {
				handler(self, _stats, { calculatedVariables }) {
					const msMultiplier = championAbilityVariableValue('PercentHasteMod', { abilityVariant: (self.champion.value as typeof ICassiopeia).abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });

					if (typeof msMultiplier.value === 'number') {
						calculatedVariables.cassiopeiaPassiveMSMultiplier = msMultiplier.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS cassiopeia] failed to calculate passive ms multiplier');
					}
				},
			},
		},
		passive: {
			variables: defineChampionVariables<'Cassiopeia', typeof ICassiopeia, 'passive'>()({
				meta: {
					PercentHasteMod: {
						displayedName: 'MoveSpeedPercent',
					},
				},
			}),
		},
	},
	Chogath: {
		setupData(self) {
			return { ultStacks: Math.max(0, self.internalData.value.ultStacks ?? 0) };
		},
		passive: {
			variables: defineChampionVariables<'Chogath', typeof IChogath, 'passive'>()({
				meta: {
					ChogathCarnivoreHeal: {
						type: VariableType.heal,
					},
				},
			}),
		},
		q: {
			variables: defineChampionVariables<'Chogath', typeof IChogath, 'q'>()({
				meta: {
					TotalDamageTooltip: {
						type: VariableType.magic,
					},
					Effect2Amount: {
						type: VariableType.affectedBySlowResist,
						displayedName: 'SlowAmount',
					},
					Effect3Amount: {
						type: VariableType.affectedByTenacity,
						displayedName: 'SlowDuration',
					},
				},
				uninteresting: ['Effect5Amount'],
			}),
		},
		w: {
			variables: defineChampionVariables<'Chogath', typeof IChogath, 'w'>()({
				meta: {
					Effect2Amount: {
						type: VariableType.affectedByTenacity,
						displayedName: 'SilenceDuration',
					},
					TotalDamageTooltip: {
						type: VariableType.magic,
					},
				},
			}),
		},
		e: {
			variables: defineChampionVariables<'Chogath', typeof IChogath, 'e'>()({
				known: {
					'{8682fc00}': [],
					'TotalDamage': [],
				},
				calculate(self, target) {
					const variableParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.e.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.e, damageSource: self, dynamicVariables: { values: { '{8682fc00}': { value: self.internalData.value.ultStacks } } } };
					const flat = championAbilityVariableValue('FlatDamageCalc', variableParams);
					const percent = championAbilityVariableValue('MaxHealthPercentCalc', variableParams);

					let TotalDamage = Number.NaN;

					if (typeof flat.value === 'number' && typeof percent.value === 'number') {
						TotalDamage = flat.value + (target ? Math.min(target.currentHealth.value, target.stats.value.total.hp) : 0) * percent.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS chogath] failed to calculate E damage variables', flat, percent);
					}

					return {
						'{8682fc00}': {
							value: self.internalData.value.ultStacks,
						},
						'TotalDamage': {
							value: TotalDamage,
						},
					};
				},
				meta: {
					FlatDamageCalc: {
						type: VariableType.magic,
					},
					SlowAmountPercentage: {
						type: VariableType.affectedBySlowResist,
					},
					SlowDuration: {
						type: VariableType.affectedByTenacity,
					},
					MaxHealthPercentCalc: {
						type: VariableType.magic,
					},
					ModifiedMonsterCap: {
						type: VariableType.magic,
					},
					TotalDamage: {
						type: VariableType.magic,
						isCustom: true,
					},
				},
				uninteresting: ['FeastStackMultiplier'],
			}),
		},
		r: {
			variables: defineChampionVariables<'Chogath', typeof IChogath, 'r'>()({
				known: {
					f3: [],
					HealthFromStacks: [],
					Stacks: [],
				},
				calculate(self) {
					return {
						f3: { value: 0 },
						HealthFromStacks: {
							value: self.stats.value.championPassive.hp ?? 0,
						},
						Stacks: {
							value: self.internalData.value.ultStacks,
						},
					};
				},
				meta: {
					RDamage: {
						type: VariableType.true,
					},
					RMonsterDamage: {
						type: VariableType.true,
					},
					HealthFromStacks: {
						isCustom: true,
					},
					Stacks: {
						isCustom: true,
					},
				},
				uninteresting: ['f3', 'AttackRangePerStack', 'CastRangePerStack', 'MaxBonusAttackRange', 'MaxBonusCastRange', 'RMinionMaxStacks'],
			}),
		},
		calculateHooks: {
			postItemTotal: {
				handler(self, { championPassiveStats, itemTotalStats, itemPassivesStats }, { calculatedVariables }) {
					const params: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.r, damageSource: self };
					const hpPerStack = championAbilityVariableValue('RHealthPerStack', params);

					if (typeof hpPerStack.value === 'number') {
						const hp = hpPerStack.value * self.internalData.value.ultStacks;
						championPassiveStats.hp = hp;

						if (calculatedVariables.riftmakerBonusHPToAP) {
							const ap = hp * calculatedVariables.riftmakerBonusHPToAP;
							itemTotalStats.abilityPower += ap;
							itemPassivesStats.abilityPower += ap;
							calculatedVariables.riftmakerVoidInfusion! += ap;
							calculatedVariables.apMultipliersBase += ap;
							calculatedVariables.additionalAdaptiveForceCheckAp -= ap;
						}
					} else {
						console.warn('[CHAMPION_SPECIFICS chogath] failed to calculate hp per ult stack', hpPerStack);
					}

					const rangePerStack = championAbilityVariableValue('AttackRangePerStack', params);
					if (typeof rangePerStack.value === 'number') {
						championPassiveStats.attackRange = rangePerStack.value * self.internalData.value.ultStacks;
					} else {
						console.warn('[CHAMPION_SPECIFICS chogath] failed to calculate range per ult stack', rangePerStack);
					}
				},
			},
		},
	},
	DrMundo: {
		passive: {
			variables: defineChampionVariables<'DrMundo', typeof IDrMundo, 'passive'>()({
				known: {
					HealthRegen: [],
					CannisterHpRestore: [],
				},
				calculate(self) {
					const cannisterPercentRestore = championAbilityVariableValue('MaxHealthGain', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value });
					let hpRestore = 0;
					if (typeof cannisterPercentRestore.value === 'number') {
						hpRestore = (cannisterPercentRestore.value as number) * self.stats.value.total.hp;
					} else {
						console.warn('[CHAMPION_SPECIFICS mundo] failed to calculate passive cannister hp restore percent', cannisterPercentRestore);
					}

					return {
						HealthRegen: {
							value: self.stats.value.championPassive.hpRegen ?? 0,
						},
						CannisterHpRestore: {
							value: hpRestore,
						},
					};
				},
				meta: {
					HealthRegen: {
						type: VariableType.hpRegen,
						isCustom: true,
					},
					CannisterHpRestore: {
						type: VariableType.heal,
						isCustom: true,
					},
				},
				uninteresting: ['CurrentHealthLoss', 'CannisterGroundDuration', 'PassiveCooldownRefund', 'MaxHealthGain'],
			}),
		},
		calculateHooks: {
			postTotal: {
				handler(self, { totalStats, bonusStats, championPassiveStats }) {
					const maxHealthRegenPercent = championAbilityVariableValue('MaxHealthRegen', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof maxHealthRegenPercent.value === 'number') {
						championPassiveStats.hpRegen = maxHealthRegenPercent.value * totalStats.hp;
						bonusStats.hpRegen += championPassiveStats.hpRegen;
						totalStats.hpRegen += championPassiveStats.hpRegen;
					} else {
						console.warn('[CHAMPION_SPECIFICS mundo] failed to calculate passive max health regen percent', maxHealthRegenPercent);
					}
				},
				priority: HOOK_PRIORITIES.postTotal.DrMundo,
			},
		},
	},
	Darius: {
		setupData(self) {
			return {
				isChampionAtMaxBleed: clamp(0, Math.round(self.internalData.value.isChampionAtMaxBleed ?? 0), 1),
			};
		},
		passive: {
			variables: defineChampionVariables<'Darius', typeof IDarius, 'passive'>()({
				meta: {
					BleedDamagePerStack: {
						type: VariableType.physical,
					},
				},
				uninteresting: ['BleedDuration', 'MaxStacks', 'MonsterMod'],
			}),
		},
		calculateHooks: {
			postInit: {
				handler(self, { championPassiveStats }, { calculatedVariables }) {
					if (!self.internalData.value.isChampionAtMaxBleed) {
						return;
					}

					const passiveAd = championAbilityVariableValue('NoxianMightBonusAD', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });
					if (typeof passiveAd.value === 'number') {
						championPassiveStats.attackDamage = passiveAd.value;
						if (calculatedVariables.midQuestMultiplier) {
							calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + championPassiveStats.attackDamage * calculatedVariables.midQuestMultiplier;
						}
					} else {
						console.warn('[CHAMPION_SPECIFICS darius] failed to calculate passive ad');
					}
				},
			},
		},
	},
	Diana: {
		setupData(self) {
			return {
				isPassiveEmpowered: clamp(0, Math.round(self.internalData.value.isPassiveEmpowered ?? 0), 1),
			};
		},
	},
	Draven: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
		passive: {
			variables: defineChampionVariables<'Draven', typeof IDraven, 'passive'>()({
				known: {
					DravenPassiveGoldEarned: [],
					DravenPassiveHighestBounty: [],
				},
				calculate() {
					return {
						DravenPassiveGoldEarned: { value: 0 },
						DravenPassiveHighestBounty: { value: 0 },
					};
				},
			}),
		},
	},
	Ekko: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Evelynn: {
		passive: {
			variables: defineChampionVariables<'Evelynn', typeof IEvelynn, 'passive'>()({
				uninteresting: ['DemonShadeTimer', 'StealthDropTimer'],
			}),
		},
	},
	Ezreal: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Ezreal'>): number => (self.champion.value! as typeof IEzreal).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Ezreal.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats, baseStats }) {
					const { passiveStacks } = self.internalData.value;
					const bonusAttackSpeedPercent = passiveStacks * (self.champion.value as typeof IEzreal).abilities.passive.variants[0]!.dataValues.AttackSpeedPerStack[1]!;
					championPassiveStats.bonusAttackSpeedPercent = bonusAttackSpeedPercent;
					championPassiveStats.attackSpeed = bonusAttackSpeedPercent * baseStats.attackSpeedRatio;
				},
			},
		},
	},
	Fiora: {
		PASSIVE_BONUS_MS: ((progress, self) => {
			const bonusMS = championAbilityVariableValue('PercentMS', {
				abilityVariant: self.champion.value!.abilities.r.variants[0]!,
				abilityLevel: self.abilityLevels.value.r,
				damageSource: self,
			});

			if (typeof bonusMS.value === 'number') {
				return bonusMS.value * progress;
			}

			console.warn('[CHAMPION_SPECIFICS fiora] failed to calculate passive bonus MS', bonusMS);
			return Number.NaN;
		}) satisfies IDeriveProgressFn,
		setupData(self) {
			return {
				passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 0), 100),
			};
		},
		passive: {
			variables: defineChampionVariables<'Fiora', typeof IFiora, 'passive'>()({
				known: {
					VitalDamage: [],
					BonusMS: [],
				},
				calculate(self, target) {
					const vitalDamagePercent = championAbilityVariableValue('PassiveDamageTotal', {
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						damageSource: self,
					});

					return {
						VitalDamage: {
							value: (vitalDamagePercent.value as number) * (target?.stats.value.total.hp ?? 0),
						},
						BonusMS: {
							value: self.stats.value.variables.fioraPassiveBonusMS,
						},
					};
				},
				meta: {
					VitalDamage: {
						isCustom: true,
						type: VariableType.true,
					},
					PercentMS: {
						displayedName: 'MaxBonusMS',
					},
					PassiveHealAmount: {
						type: VariableType.heal,
					},
					BonusMS: {
						isCustom: true,
						resultsIsPercentage: true,
					},
				},
				uninteresting: ['MovementSpeedDuration'],
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, _stats, { calculatedVariables }) {
					const bonusMS = CHAMPION_SPECIFICS.Fiora.PASSIVE_BONUS_MS(self.internalData.value.passiveMSProgress, { champion: self.champion, abilityLevels: self.abilityLevels } as DamageSource);
					if (!Number.isNaN(bonusMS)) {
						calculatedVariables.fioraPassiveBonusMS = bonusMS;
						calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.fioraPassiveBonusMS / 100;
					}
				},
			},
		},
	},
	Garen: {
		setupData(self) {
			return {
				isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
			};
		},
	},
	Gnar: {
		// TODO shapeshift
		calculateHooks: {
			postInit: {
				handler(self, { bonusStats, championPassiveStats }) {
					/* the passive states it grants 0%-99% attack speed but all of it except for the lvl 1 bonus is handled by attack speed per level, so add only the missing lvl 1 value */
					const attackSpeed = championAbilityVariableValue('TotalAS', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: 1 } } as DamageSource });
					if (typeof attackSpeed.value === 'number') {
						bonusStats.bonusAttackSpeedPercent += attackSpeed.value;
						championPassiveStats.bonusAttackSpeedPercent = attackSpeed.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS gnar] failed to calculate passive attack speed', attackSpeed);
					}

					const moveSpeed = championAbilityVariableValue('TotalMS', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof moveSpeed.value === 'number') {
						championPassiveStats.moveSpeed = moveSpeed.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS gnar] failed to calculate passive move speed', moveSpeed);
					}
				},
			},
		},
	},
	Hecarim: {
		calculateHooks: {
			postTotal: {
				handler(self, { bonusStats, championPassiveStats, totalStats, totalMultipliersStats }, { calculatedVariables }) {
					const bonusAd = championAbilityVariableValue('BonusAD', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value }, stats: { value: { bonus: bonusStats } } } as DamageSource });

					if (typeof bonusAd.value === 'number') {
						championPassiveStats.attackDamage = bonusAd.value;
						const multiplierValue = calculatedVariables.midQuestMultiplier * championPassiveStats.attackDamage;
						totalMultipliersStats.attackDamage += multiplierValue;
						calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + multiplierValue;
						const value = bonusAd.value + multiplierValue;
						bonusStats.attackDamage += value;
						totalStats.attackDamage += value;
					} else {
						console.warn('[CHAMPION_SPECIFICS hecarim] failed to calculate passive attack damage', bonusAd);
					}
				},
				priority: HOOK_PRIORITIES.postTotal.Hecarim,
			},
		},
	},
	Heimerdinger: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Hwei: {
		e: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
	},
	Irelia: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Irelia'>): number => (self.champion.value! as typeof IIrelia).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Irelia.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
		r: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
		passive: {
			variables: defineChampionVariables<'Irelia', typeof IIrelia, 'passive'>()({
				known: {
					AttackSpeedPercent: [],
				},
				calculate(self) {
					return {
						AttackSpeedPercent: {
							value: self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0,
						},
					};
				},
				meta: {
					OnHitBonus: {
						type: VariableType.magic,
					},
					AttackSpeedPercent: {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
				},
				uninteresting: ['BuffDuration', 'MaxStacks', 'OnHitStructureMod'],
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats }) {
					const attackSpeedPerStack = championAbilityVariableValue('SingleStackAS', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof attackSpeedPerStack.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value / 100;
					} else {
						console.warn('[CHAMPION_SPECIFICS irelia] failed to calculate passive attack speed', attackSpeedPerStack);
					}
				},
			},
		},
	},
	JarvanIV: {
		r: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
	},
	Jax: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Jax'>): number => (self.champion.value! as typeof IJax).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Jax.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
		passive: {
			variables: defineChampionVariables<'Jax', typeof IJax, 'passive'>()({
				known: {
					AttackSpeedPercent: [],
				},
				calculate(self) {
					return {
						AttackSpeedPercent: {
							value: self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0,
						},
					};
				},
				meta: {
					AttackSpeedPercent: {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
				},
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats }) {
					const attackSpeedPerStack = championAbilityVariableValue('AttackSpeedPerStack', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof attackSpeedPerStack.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS jax] failed to calculate passive attack speed', attackSpeedPerStack);
					}
				},
			},
		},
	},
	Jhin: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
		passive: {
			variables: defineChampionVariables<'Jhin', typeof IJhin, 'passive'>()({
				known: {
					BonusAD: [],
				},
				calculate(self) {
					return {
						BonusAD: {
							value: self.stats.value.championPassive.attackDamage,
						},
					};
				},
				meta: {
					BonusAD: {
						isCustom: true,
					},
				},
				uninteresting: ['MaxAmmo', 'CritReductionPercent', 'HasteDuration'],
			}),
		},
		calculateHooks: {
			postInit: {
				handler(self, { bonusStats, baseStats }, { calculatedVariables }) {
					const params: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };
					const asPerLevel = championAbilityVariableValue('PercentAttackSpeedPerLevel', params);

					if (typeof asPerLevel.value === 'number') {
						const bonusASPercent = asPerLevel.value * (self.level.value - 1);
						bonusStats.attackSpeed += bonusASPercent * baseStats.attackSpeed;
					} else {
						console.warn('[CHAMPION_SPECIFICS jhin] failed to calculate passive attack speed per level', asPerLevel);
					}

					const critDamageReduction = championAbilityVariableValue('CritReductionPercent', params);
					if (typeof critDamageReduction.value === 'number') {
						calculatedVariables.critMultiplierMod = 1 - critDamageReduction.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS jhin] failed to calculate passive attack speed per level', critDamageReduction);
					}
				},
			},
			preBonus: {
				handler(_self, _stats, { debuffs }) {
					debuffs.cripple = 1;
				},
			},
			postBonus: {
				handler(self, { bonusStats }, { calculatedVariables }) {
					if (self.internalData.value.isPassiveMSActive) {
						const msPercent = championAbilityVariableValue('CritMoveSpeedPercent', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value }, stats: { value: { bonus: { bonusAttackSpeedPercent: bonusStats.bonusAttackSpeedPercent } } } } as DamageSource });

						if (typeof msPercent.value === 'number') {
							calculatedVariables.totalBonusPercentMoveSpeed += msPercent.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS jhin] failed to calculate passive bonus ms', msPercent);
						}
					}
				},
			},
			postTotal: {
				handler(self, { adaptiveForceMeta, totalStats, championPassiveStats, dragonStats, bonusStats, totalMultipliersStats, totalPreMultipliersStats }, { calculatedVariables }) {
					const adPercent = championAbilityVariableValue('TotalADPercent', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value }, stats: { value: { total: { attackDamage: totalStats.attackDamage, critChance: totalStats.critChance }, bonus: { bonusAttackSpeedPercent: bonusStats.bonusAttackSpeedPercent } } } } as DamageSource });

					if (typeof adPercent.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS jhin] failed to calculate passive total ad percent', adPercent);
						return;
					}

					/* need to add swiftmarch adaptive since it's not in `totalPreMultipliersStats` - it's added to `totalMultipliersStats` */
					const passiveAd = (totalPreMultipliersStats.attackDamage + (calculatedVariables.swiftmarchAdaptive ?? 0) * adaptiveForceMeta[2]) * adPercent.value;

					if (calculatedVariables.midQuestMultiplier) {
						const preMultiplierBonusAd = bonusStats.attackDamage - (dragonStats.attackDamage ?? 0) - (calculatedVariables.midQuestAd ?? 0);
						const midQuestAd = preMultiplierBonusAd * calculatedVariables.midQuestMultiplier * adPercent.value;

						calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + midQuestAd;
						totalMultipliersStats.attackDamage += midQuestAd;
						totalStats.attackDamage += midQuestAd;
						bonusStats.attackDamage += midQuestAd;
						calculatedVariables.bloodmailRetributionExcludedAd += midQuestAd;
					}

					championPassiveStats.attackDamage = passiveAd;
					totalMultipliersStats.attackDamage += passiveAd;
					totalStats.attackDamage += passiveAd;
					bonusStats.attackDamage += passiveAd;

					calculatedVariables.bloodmailRetributionExcludedAd += passiveAd;
				},
				priority: HOOK_PRIORITIES.postTotal.Jhin,
			},
		},
	},
	Jinx: {
		MAX_PASSIVE_STACKS: 5, /* doesn't seem to be in passive's data */
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Jinx.MAX_PASSIVE_STACKS;
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
	},
	Kaisa: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Kaisa'>): number => (self.champion.value! as typeof IKaisa).abilities.passive.variants[0]!.dataValues.PMaxStacks[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Kaisa.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), maxStacks),
			};
		},
	},
	Kalista: {
		variables: defineChampionVariables<'Kalista', typeof IKalista>()({
			known: {
				GameModeInteger: [1],
			},
			calculate() {
				return {
					GameModeInteger: {
						value: 1,
					},
				};
			},
		}),
	},
	Kayle: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Kayle'>): number => (self.champion.value! as typeof IKayle).abilities.passive.variants[0]!.dataValues.EnrageMaxStacks[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Kayle.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
		passive: {
			variables: defineChampionVariables<'Kayle', typeof IKayle, 'passive'>()({
				known: {
					AttackSpeedPercent: [],
				},
				calculate(self) {
					return {
						AttackSpeedPercent: {
							value: self.stats.value.championPassive.bonusAttackSpeedPercent,
						},
					};
				},
				meta: {
					PassiveWaveDamage: {
						type: VariableType.magic,
					},
					AttackSpeedPercent: {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
				},
				uninteresting: ['LevelForPassiveRank0', 'LevelForPassiveRank1', 'LevelForPassiveRank2', 'LevelForPassiveRank3', 'MSTowardsEnemy', 'EnrageDuration', 'UpgradedAttackRange', 'FinalAttackRange', 'EnrageTotalASPerStack'],
			}),
		},
		calculateHooks: {
			postInit: {
				handler(self, { baseStats, championPassiveStats }) {
					const { LevelForPassiveRank1, LevelForPassiveRank3, UpgradedAttackRange, FinalAttackRange } = (self.champion.value! as typeof IKayle).abilities.passive.variants[0]!.dataValues;

					if (self.level.value >= LevelForPassiveRank3[1]!) {
						championPassiveStats.attackRange = FinalAttackRange[1]! - baseStats.attackRange;
					} else if (self.level.value >= LevelForPassiveRank1[1]!) {
						championPassiveStats.attackRange = UpgradedAttackRange[1]! - baseStats.attackRange;
					}
				},
			},
			onChampionPassive: {
				handler(self, { championPassiveStats }, { calculatedVariables }) {
					const attackSpeedPerStack = championAbilityVariableValue('EnrageTotalASPerStack', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof attackSpeedPerStack.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value / 100;
					} else {
						console.warn('[CHAMPION_SPECIFICS kayle] failed to calculate passive attack speed');
					}

					if (self.internalData.value.passiveStacks === CHAMPION_SPECIFICS.Kayle.MAX_PASSIVE_STACKS(self)) {
						const { MSTowardsEnemy } = (self.champion.value! as typeof IKayle).abilities.passive.variants[0]!.dataValues;
						calculatedVariables.totalBonusPercentMoveSpeed += MSTowardsEnemy[1]!;
					}
				},
			},
		},
	},
	Kayn: {
		FORM_OPTIONS: {
			base: 0,
			assassin: 1,
			rhaast: 2,
		},
		setupData(self) {
			const maxForm: number = CHAMPION_SPECIFICS.Kayn.FORM_OPTIONS.rhaast;
			return {
				form: clamp(0, Math.round(self.internalData.value.form ?? 0), maxForm),
			};
		},
		variables: defineChampionVariables<'Kayn', typeof IKayn>()({
			known: {
				f1: [0, 1, 2],
			},
			calculate() {
				// TODO
				return {} as any;
			},
		}),
	},
	Kindred: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Kled: {
		setupData(self) {
			const initSkaarlMaxHP = self.stats.value.bonus.hp + (self.stats.value.variables.kledSkaarlHP ?? 0);
			return {
				kledCurrentHP: clamp(0, Math.round(self.internalData.value.kledCurrentHP ?? self.stats.value.baseOnLevel.hp), self.stats.value.baseOnLevel.hp),
				skaarlCurrentHP: clamp(0, Math.round(self.internalData.value.skaarlCurrentHP ?? initSkaarlMaxHP), initSkaarlMaxHP),
				runningTowardsEnemy: clamp(0, Math.round(self.internalData.value.runningTowardsEnemy ?? 0), 1),
				enemiesNearby: Math.max(0, Math.round(self.internalData.value.enemiesNearby ?? 0)),
				_watchHandles: [
					watch(() => self.internalData.value.kledCurrentHP + self.internalData.value.skaarlCurrentHP, (value) => {
						self.currentHealth.value = Math.min(value, self.stats.value.total.hp);
					}),
					watch(() => `${Math.ceil(self.stats.value.baseOnLevel.hp)}:${Math.floor((self.stats.value.variables.kledSkaarlHP ?? 0) + self.stats.value.bonus.hp)}:${self.maxHealth.value}`, (_value, previousValue) => {
						const [rawPreviousMaxKledHP, rawPreviousMaxSkaarlHP] = previousValue?.split(':');
						const previousMaxKledHP = rawPreviousMaxKledHP ? Number.parseFloat(rawPreviousMaxKledHP) : undefined;
						const previousMaxSkaarlHP = rawPreviousMaxSkaarlHP ? Number.parseFloat(rawPreviousMaxSkaarlHP) : undefined;

						if (previousMaxKledHP !== undefined && self.internalData.value.kledCurrentHP === Math.ceil(previousMaxKledHP)) {
							self.internalData.value.kledCurrentHP = self.stats.value.baseOnLevel.hp;
						} else {
							self.internalData.value.kledCurrentHP = Math.min(self.stats.value.baseOnLevel.hp, self.internalData.value.kledCurrentHP ?? 0);
						}
						self.internalData.value.kledCurrentHP = Math.ceil(self.internalData.value.kledCurrentHP);

						if (self.internalData.value.skaarlCurrentHP === previousMaxSkaarlHP) {
							self.internalData.value.skaarlCurrentHP = self.stats.value.bonus.hp + (self.stats.value.variables.kledSkaarlHP ?? 0);
						} else {
							self.internalData.value.skaarlCurrentHP = Math.min(self.stats.value.bonus.hp + (self.stats.value.variables.kledSkaarlHP ?? 0), self.internalData.value.skaarlCurrentHP ?? 0);
						}
						self.internalData.value.skaarlCurrentHP = Math.floor(self.internalData.value.skaarlCurrentHP);
					}),
					watch(() => self.stats.value.variables.kledIsDismounted, (value) => {
						self.abilityVariantsIndexes.value.q = value ? 1 : 0;
					}, { immediate: true }),
				],
			};
		},
		dismountedComponentsInactive: (self => !self.stats.value.variables.kledIsDismounted) satisfies IExtraInactiveFn,
		passive: {
			variables: defineChampionVariables<'Kled', typeof IKled, 'passive'>()({
				uninteresting: ['ResistBonusPerEnemy', 'CourageVsChamps', 'CourageVsOther', 'CourageLastHit', 'MountCooldown'],
			}),
		},
		q: {
			additionalVariantsObjectNames: ['KledRiderQ'],
		},
		e: {
			isDisabled: self => self.stats.value.variables.kledIsDismounted,
		},
		r: {
			isDisabled: self => self.stats.value.variables.kledIsDismounted,
		},
		calculateHooks: {
			postInit: {
				handler(self, { baseStats, championPassiveStats }, { calculatedVariables }) {
					calculatedVariables.kledIsDismounted = self.internalData.value.skaarlCurrentHP === 0;

					if (!calculatedVariables.kledIsDismounted) {
						return;
					}
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					const msPenalty = championAbilityVariableValue('DismountedMSPenalty', passiveParams);

					if (typeof msPenalty.value === 'number') {
						baseStats.moveSpeed -= msPenalty.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS kled] failed to calculate dismounted ms penalty', msPenalty);
					}

					if (self.internalData.value.runningTowardsEnemy) {
						const msTowardsEnemy = championAbilityVariableValue('DismountedMS', passiveParams);
						if (typeof msTowardsEnemy.value === 'number') {
							championPassiveStats.moveSpeed = msTowardsEnemy.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS kled] failed to calculate dismounted ms towards enemies', msTowardsEnemy);
						}
					}
				},
			},
			postTotal: {
				handler(self, { totalStats, bonusStats, championPassiveStats, totalPreMultipliersStats, dragonStatMultipliers, dragonStats, totalMultipliersStats }, { calculatedVariables }) {
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value }, stats: { value: { bonus: { hp: bonusStats.hp } } } } as DamageSource };

					const skaarlBaseHP = championAbilityVariableValue('SkaarlHealth', passiveParams);
					if (typeof skaarlBaseHP.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS kled] failed to calculate passive skaarl base hp', skaarlBaseHP);
						return;
					}

					calculatedVariables.kledSkaarlHP = skaarlBaseHP.value;
					totalStats.hp += skaarlBaseHP.value;
					totalPreMultipliersStats.hp += skaarlBaseHP.value;

					if (!calculatedVariables.kledIsDismounted) {
						return;
					}

					let resists = 0;
					const bonusResist = championAbilityVariableValue('DismountedResistBonus', passiveParams);
					if (typeof bonusResist.value === 'number') {
						resists = bonusResist.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS kled] failed to calculate dismounted bonus resist', bonusResist);
					}

					if (self.internalData.value.enemiesNearby) {
						const bonusResistPerEnemy = championAbilityVariableValue('ResistBonusPerEnemy', passiveParams);
						const maxBonusResist = championAbilityVariableValue('DismountedResistBonusMax', passiveParams);
						if (typeof maxBonusResist.value === 'number' && typeof bonusResistPerEnemy.value === 'number') {
							resists = Math.min(maxBonusResist.value, resists * (1 + self.internalData.value.enemiesNearby * bonusResistPerEnemy.value));
						} else {
							console.warn('[CHAMPION_SPECIFICS kled] failed to calculate dismounted bonus resist per enemy', bonusResistPerEnemy, maxBonusResist);
						}
					}

					totalPreMultipliersStats.armor += resists;
					totalPreMultipliersStats.magicResist += resists;
					championPassiveStats.armor = resists;
					championPassiveStats.magicResist = resists;

					if (calculatedVariables.jakShoBonusResistMultiplier) {
						const value = resists * calculatedVariables.jakShoBonusResistMultiplier;
						resists += value;
						totalMultipliersStats.armor += value;
						totalMultipliersStats.magicResist += value;
						calculatedVariables.jakShoArmor! += value;
						calculatedVariables.jakShoMagicResist! += value;
					}

					if (dragonStatMultipliers.armor) {
						const value = resists * dragonStatMultipliers.armor;
						resists += value;
						totalMultipliersStats.armor += value;
						totalMultipliersStats.magicResist += value;
						dragonStats.armor! += value;
						dragonStats.magicResist! += value;
					}

					bonusStats.armor += resists;
					totalStats.armor += resists;
					bonusStats.magicResist += resists;
					totalStats.magicResist += resists;
				},
				priority: HOOK_PRIORITIES.postTotal.Kled,
			},
		},
	},
	KSante: {
		passive: {
			variables: defineChampionVariables<'KSante', typeof IKSante, 'passive'>()({
				known: {
					CalculatedMarkDamage: [],
					CalculatedAllOutDamage: [],
				},
				calculate(self, target) {
					const passiveParams: IGameVariableValueParameters['championAbility'] = {
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: self,
					};
					const markFlatVar = championAbilityVariableValue('FlatDamage', passiveParams);
					const markDamagePercentVar = championAbilityVariableValue('PercentHealthDamage', passiveParams);
					const allOutDamagePercentVar = championAbilityVariableValue('MaxHealthDamagePercent', passiveParams);

					const targetTotalHp = (target?.stats.value.total.hp ?? 0);

					return {
						CalculatedMarkDamage: {
							value: (markFlatVar.value as number) + targetTotalHp * (markDamagePercentVar.value as number),
						},
						CalculatedAllOutDamage: {
							value: targetTotalHp * (allOutDamagePercentVar.value as number),
						},
					};
				},
				meta: {
					CalculatedMarkDamage: {
						isCustom: true,
						type: VariableType.physical,
					},
					CalculatedAllOutDamage: {
						isCustom: true,
						type: VariableType.physical,
					},
				},
				uninteresting: ['FlatDamage'],
			}),
		},
		q: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
	},
	LeeSin: {
		setupData(self) {
			return {
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
	},
	Locke: {
		passive: {
			variables: defineChampionVariables<'Locke', typeof ILocke, 'passive'>()({
				known: {
					OnHitDamage: [],
				},
				calculate(self, target) {
					const minDamage = championAbilityVariableValue('MinOnHitDamage', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });
					const maxDamage = championAbilityVariableValue('MaxOnHitDamage', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });
					let OnHitDamage = 0;

					if (typeof minDamage.value === 'number' && typeof maxDamage.value === 'number') {
						/** not saved in an actual variable? */
						const maxThreshold = 0.3;
						const targetPercentHealth = target ? (Math.min(target.currentHealth.value, target.stats.value.total.hp) / target.stats.value.total.hp || 1) : 0;
						const damagePercent = Math.max(0, Math.min(1, (1 - targetPercentHealth) / (1 - maxThreshold)));
						OnHitDamage = minDamage.value + (maxDamage.value - minDamage.value) * damagePercent;
					}

					return {
						OnHitDamage: {
							value: OnHitDamage,
						},
					};
				},
				meta: {
					MinOnHitDamage: {
						type: VariableType.magic,
					},
					MaxOnHitDamage: {
						type: VariableType.magic,
					},
					OnHitDamage: {
						type: VariableType.magic,
						isCustom: true,
					},
				},
			}),
		},
		q: {
			variables: defineChampionVariables<'Locke', typeof ILocke, 'q'>()({
				meta: {
					MissileDamage: {
						type: VariableType.magic,
					},
					NailDamage: {
						type: VariableType.magic,
					},
				},
				uninteresting: ['SlowAmount1', 'SlowAmount2', 'SlowAmount3', 'SlowDuration1', 'SlowDuration2', 'SlowDuration3', 'TwoMarkBonusPercent', 'ThreeMarkBonusPercent'],
			}),
		},
		w: {
			variables: defineChampionVariables<'Locke', typeof ILocke, 'w'>()({
				meta: {
					DamageRestoreAmount: {
						type: VariableType.heal,
					},
					AdditionalHeal: {
						type: VariableType.heal,
					},
					MaxHealingThreshold: {
						type: VariableType.heal,
					},
				},
				uninteresting: ['DecayTimeHelper', 'BaseDuration', 'HealthCost'],
			}),
		},
	},
	Mordekaiser: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Naafiri: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Naafiri'>): ComputedRef<number> => computed((): number =>
			self.champion.value
				? ((VARIABLE_CALCULATION_FNS.mFormulaParts(
						(self.champion.value as typeof INaafiri).abilities.passive.variants[0]!.spellCalculations.PackmateCap,
						{},
						{
							variableValueFn: championAbilityVariableValue,
							variableValueParams: {
								abilityVariant: (self.champion.value as typeof INaafiri).abilities.passive.variants[0]!,
								allAbilitiesVariants: self.allAbilityVariants.value,
								damageSource: self,
							},
						},
					)?.value as number ?? 0)
					+ (self.champion.value! as typeof INaafiri).abilities.w.variants[0]!.dataValues.PackmatesToAdd[self.abilityLevels.value.w]!)
				: 0,
		),
		setupData(self) {
			const maxPassiveStacks: ComputedRef<number> = CHAMPION_SPECIFICS.Naafiri.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxPassiveStacks.value),
				_watchHandles: [watch(self.level, () => {
					self.internalData.value.passiveStacks = Math.min(self.internalData.value.passiveStacks, maxPassiveStacks.value);
				})],
			};
		},
	},
	Nami: {
		setupData(self) {
			return {
				passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 0), 100),
				passiveMSTotalAp: self.internalData.value.passiveMSTotalAp !== undefined ? Math.max(0, self.internalData.value.passiveMSTotalAp) : undefined,
			};
		},
		passive: {
			effectControls: {
				model: self => computed({
					get() {
						return self.internalData.value.passiveMSTotalAp !== undefined;
					},
					set(value) {
						if (value) {
							self.internalData.value.passiveMSTotalAp = self.stats.value.total.abilityPower;
							const effect = self.getEffect(EffectObjectName.namiPSurgingTides)?.[0];
							if (effect) {
								effect.data.value[0] = 0;
							}
						} else {
							self.internalData.value.passiveMSTotalAp = undefined;
						}
					},
				}),
				refresh(self) {
					self.internalData.value.passiveMSTotalAp = self.stats.value.total.abilityPower;
				},
				currentlySnapshot(_effectData, self) {
					return `calculating using: <scaleap>%i:${STAT_ICON.abilityPower}% ${roundNumber(self.internalData.value.passiveMSTotalAp ?? 0, 3)}</scaleap>`;
				},
			},
			derivedMS: ((progress, self): number => {
				return self?.stats.value.championPassive.moveSpeed ?? CHAMPION_SPECIFICS.Nami.passive.calculateMS(self.champion.value!, progress, self.stats.value.total.abilityPower);
			}) satisfies IDeriveProgressFn,
			calculateMS: (champion: IChampion, progress: number, totalAP: number) => {
				const bonusMS = championAbilityVariableValue('TotalMSBonus', {
					abilityVariant: champion.abilities.passive.variants[0]!,
					damageSource: { stats: { value: { total: { abilityPower: totalAP } } } } as DamageSource,
				});

				if (typeof bonusMS.value === 'number') {
					return bonusMS.value * progress / 100;
				}

				console.warn('[CHAMPION_SPECIFICS nami] failed to calculate passive bonus MS', bonusMS);
				return Number.NaN;
			},
			variables: defineChampionVariables<'Nami', typeof INami, 'passive'>()({
				known: {
					BonusMS: [],
				},
				calculate(self) {
					return {
						BonusMS: {
							value: self.stats.value.championPassive.moveSpeed ?? 0,
						},
					};
				},
				meta: {
					BonusMS: {
						isCustom: true,
					},
				},
				uninteresting: ['BuffDuration'],
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats }) {
					const { passiveMSProgress, passiveMSTotalAp } = self.internalData.value;
					if (passiveMSTotalAp === undefined) {
						return;
					}

					const bonusMS = CHAMPION_SPECIFICS.Nami.passive.calculateMS(self.champion.value!, passiveMSProgress, passiveMSTotalAp);

					if (!Number.isNaN(bonusMS)) {
						championPassiveStats.moveSpeed = bonusMS;
					}
				},
			},
		},
	},
	Nasus: {
		setupData(self) {
			return {
				wProgress: clamp(0, Math.round(self.internalData.value.wProgress ?? 0), 100),
			};
		},
		w: {
			derivedSlow: ((progress, self): number => {
				return self?.effectsOntoTargetVars.value.nasusWSlow ?? CHAMPION_SPECIFICS.Nasus.w.calculateSlow(self.champion.value!, progress, self.abilityLevels.value.w);
			}) satisfies IDeriveProgressFn,
			calculateSlow: (champion: IChampion, progress: number, wLevel: number) => {
				const wParams: IGameVariableValueParameters['championAbility'] = {
					abilityVariant: champion.abilities.w.variants[0]!,
					abilityLevel: wLevel || 1,
				};
				const minMSSlow = championAbilityVariableValue('SlowBase', wParams);
				const maxMSSlow = championAbilityVariableValue('MaxSlowTooltipOnly', wParams);

				if (typeof minMSSlow.value === 'number' && typeof maxMSSlow.value === 'number') {
					return progress === 1
						? minMSSlow.value
						: progress
							? (minMSSlow.value + (maxMSSlow.value - minMSSlow.value) * progress / 100)
							: 0;
				}

				console.warn('[CHAMPION_SPECIFICS nasus] failed to calculate W ms/as slow values', minMSSlow, maxMSSlow);
				return Number.NaN;
			},
			variables: defineChampionVariables<'Nasus', typeof INasus, 'w'>()({
				known: {
					AttackSpeedSlow: [],
					MoveSpeedSlow: [],
				},
				calculate(self) {
					return {
						MoveSpeedSlow: {
							value: self.effectsOntoTargetVars.value.nasusWSlow ?? 0,
						},
						AttackSpeedSlow: {
							value: self.effectsOntoTargetVars.value.nasusWCripple ?? 0,
						},
					};
				},
				meta: {
					MaxSlowTooltipOnly: {
						type: VariableType.affectedBySlowResist,
					},
					MoveSpeedSlow: {
						isCustom: true,
						resultsIsPercentage: true,
						type: VariableType.affectedBySlowResist,
					},
					AttackSpeedSlow: {
						isCustom: true,
						resultsIsPercentage: true,
					},
					Duration: {
						type: VariableType.affectedByTenacity,
					},
				},
				uninteresting: ['SlowBase', 'AttackSpeedSlowMult'],
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats }) {
					const lifeSteal = championAbilityVariableValue('LifestealTooltip', {
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});

					if (typeof lifeSteal.value === 'number') {
						championPassiveStats.lifeSteal = lifeSteal.value / 100;
					} else {
						console.warn('[CHAMPION_SPECIFICS nasus] failed to calculate passive life steal', lifeSteal);
					}
				},
			},
		},
		effectOntoTargetVars(self, vars) {
			vars.nasusWSlow = CHAMPION_SPECIFICS.Nasus.w.calculateSlow(self.champion.value!, self.internalData.value.wProgress, self.abilityLevels.value.w);
			const msToASSlowRatio = championAbilityVariableValue('AttackSpeedSlowMult', {
				abilityVariant: self.champion.value!.abilities.w.variants[0]!,
				abilityLevel: self.abilityLevels.value.w,
			});
			if (typeof msToASSlowRatio.value === 'number') {
				vars.nasusWCripple = vars.nasusWSlow * msToASSlowRatio.value;
			} else {
				console.warn('[CHAMPION_SPECIFICS nasus] failed to calculate W ms to as slow ratio', msToASSlowRatio);
			}
		},
	},
	Nidalee: {
		PASSIVE_OPTIONS: {
			none: 0,
			justBush: 1,
			towardsChampion: 2,
		},
		setupData(self) {
			const maxPassive: number = CHAMPION_SPECIFICS.Nidalee.PASSIVE_OPTIONS.towardsChampion;
			return {
				passiveVariantActive: clamp(0, Math.round(self.internalData.value.passiveVariantActive ?? 0), maxPassive),
			};
		},
	},
	Nunu: {
		setupData(self) {
			return {
				isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
			};
		},
		passive: {
			variables: defineChampionVariables<'Nunu', typeof INunu, 'passive'>()({
				meta: {
					CleaveDamage: {
						type: VariableType.physical,
					},
				},
			}),
			passiveBuffs(champion: IChampion) {
				const moveSpeed = championAbilityVariableValue('MSIncrease', { abilityVariant: champion.abilities.passive.variants[0]! });
				const attackSpeed = championAbilityVariableValue('ASIncrease', { abilityVariant: champion.abilities.passive.variants[0]! });

				if (typeof moveSpeed.value === 'number' && typeof attackSpeed.value === 'number') {
					return {
						bonusMSPercent: moveSpeed.value,
						bonusASPercent: attackSpeed.value,
					};
				}

				console.warn('[CHAMPION_SPECIFICS nunu] failed to calculate passive move/attack speed', moveSpeed, attackSpeed);

				return { bonusMSPercent: Number.NaN, bonusASPercent: Number.NaN };
			},
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats }, { calculatedVariables }) {
					if (self.internalData.value.isPassiveActive) {
						const { bonusMSPercent, bonusASPercent } = CHAMPION_SPECIFICS.Nunu.passive.passiveBuffs(self.champion.value!);
						championPassiveStats.bonusAttackSpeedPercent = bonusASPercent;
						calculatedVariables.totalBonusPercentMoveSpeed += bonusMSPercent;
					}
				},
			},
		},
		r: {
			variables: defineChampionVariables<'Nunu', typeof INunu, 'r'>()({
				meta: {
					MaximumDamage: {
						type: VariableType.magic,
					},
				},
			}),
		},
	},
	Orianna: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Orianna'>): number => (self.champion.value! as typeof IOrianna).abilities.passive.variants[0]!.dataValues.StackCount[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Orianna.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), maxStacks),
			};
		},
	},
	Ornn: {
		MASTERWORK_LEVEL: (self: DamageSource<'Ornn'>): number => (self.champion.value! as typeof IOrnn).abilities.passive.variants[0]!.dataValues.MasterworkLevel[1]!,
		MAX_UPGRADED_ALLIES: 4,
		calcMaxUpgradedAllies(self: DamageSource<'Ornn'>): number {
			return Math.min(CHAMPION_SPECIFICS.Ornn.MAX_UPGRADED_ALLIES, Math.max(0, self.level.value - CHAMPION_SPECIFICS.Ornn.MASTERWORK_LEVEL(self)));
		},
		setupData(self) {
			const _masterworkLevel: number = CHAMPION_SPECIFICS.Ornn.MASTERWORK_LEVEL(self);
			const maxUpgradedAllies: number = CHAMPION_SPECIFICS.Ornn.calcMaxUpgradedAllies(self);
			return {
				masterworkItemSlot: self.level.value >= _masterworkLevel
					? clamp(1, Math.round(self.internalData.value.masterworkItemSlot ?? 1), 6)
					: 1,
				passiveUpgradedAllies: clamp(0, Math.round(self.internalData.value.passiveUpgradedAllies ?? 0), maxUpgradedAllies),
				_masterworkLevel,
				_watchHandles: [watch(self.level, () => {
					self.internalData.value.passiveUpgradedAllies = Math.min(self.internalData.value.passiveUpgradedAllies, CHAMPION_SPECIFICS.Ornn.calcMaxUpgradedAllies(self));
				})],
			};
		},
		passive: {
			variables: defineChampionVariables<'Ornn', typeof IOrnn, 'passive'>()({
				known: {
					f1: [],
					f2: [],
					f3: [],
					f4: [],
					GameModeInteger: [1],
				},
				calculate(self) {
					return {
						GameModeInteger: {
							value: 1,
						},
						f1: {
							value: self.stats.value.variables.ornnPassiveStatAmp ?? 0,
						},
						f2: {
							value: self.stats.value.championPassive.armor ?? 0,
						},
						f3: {
							value: self.stats.value.championPassive.magicResist ?? 0,
						},
						f4: {
							value: self.stats.value.championPassive.hp ?? 0,
						},
					};
				},
				meta: {
					f1: {
						displayedName: 'AmpPercent',
						isPercentage: true,
						multiplier: 100,
					},
					f2: {
						displayedName: 'BonusArmor',
					},
					f3: {
						displayedName: 'BonusMagicResist',
					},
					f4: {
						displayedName: 'BonusHP',
					},
				},
				uninteresting: ['MasterworkLevel', 'BaseStatAmp', 'AdditionalMythicStatAmp'],
			}),
		},
		q: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
		r: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
		calculateHooks: {
			onTotalPreMultipliers: {
				handler(self, { championPassiveStats, itemPassivesStats, itemTotalStats, bonusStats, totalPreMultipliersStats, totalMultipliersStats }, { calculatedVariables }) {
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };
					const baseStatAmp = championAbilityVariableValue('BaseStatAmp', passiveParams);
					const additionalStatAmp = championAbilityVariableValue('AdditionalMythicStatAmp', passiveParams);

					if (typeof baseStatAmp.value === 'number' && typeof additionalStatAmp.value === 'number') {
						calculatedVariables.ornnPassiveStatAmp = baseStatAmp.value + additionalStatAmp.value * (self.internalData.value.passiveUpgradedAllies + (calculatedVariables.hasMasterworkItem ? 1 : 0));
					} else {
						console.warn('[CHAMPION_SPECIFICS ornn] failed to calculate passive stat amps', baseStatAmp, additionalStatAmp);
					}

					if (!calculatedVariables.ornnPassiveStatAmp) {
						return;
					}

					championPassiveStats.hp = bonusStats.hp * calculatedVariables.ornnPassiveStatAmp;
					totalMultipliersStats.hp += championPassiveStats.hp;

					championPassiveStats.armor = bonusStats.armor * calculatedVariables.ornnPassiveStatAmp;
					totalMultipliersStats.armor += championPassiveStats.armor;

					championPassiveStats.magicResist = bonusStats.magicResist * calculatedVariables.ornnPassiveStatAmp;
					totalMultipliersStats.magicResist += championPassiveStats.magicResist;

					if (championPassiveStats.hp && calculatedVariables.riftmakerBonusHPToAP) {
						const ap = championPassiveStats.hp * calculatedVariables.riftmakerBonusHPToAP;
						calculatedVariables.apMultipliersBase += ap;
						bonusStats.abilityPower += ap;
						itemPassivesStats.abilityPower += ap;
						itemTotalStats.abilityPower += ap;
						totalPreMultipliersStats.abilityPower += ap;
					}
				},
			},
		},
	},
	Pyke: {
		passive: {
			variables: defineChampionVariables<'Pyke', typeof IPyke, 'passive'>()({
				known: {
					f1: [],
				},
				calculate(self) {
					return {
						f1: {
							value: self.stats.value.championPassive.attackDamage,
						},
					};
				},
				meta: {
					f1: {
						displayedName: 'BonusAD',
					},
				},
			}),
		},
		r: {
			variables: defineChampionVariables<'Pyke', typeof IPyke, 'r'>()({
				known: {
					f9: [],
					f10: [],
				},
				calculate() {
					return {
						f9: { value: 0 },
						f10: { value: 0 },
					};
				},
				meta: {
					f1: {
						displayedName: 'BonusAD',
					},
					ReducedDamageFinal: {
						type: VariableType.physical,
					},
				},
				uninteresting: ['f9', 'f10', 'RRecastDuration', 'ReducedDamage'],
			}),
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { championPassiveStats, itemPassivesStats, itemBaseStats }, { miscDebug }) {
					const hpToAd = championAbilityVariableValue('HPPerBAD', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });

					if (typeof hpToAd.value === 'number') {
						miscDebug.pykePassiveHpToAd = hpToAd.value;
						const bonusHp = (itemBaseStats.hp + itemPassivesStats.hp);
						championPassiveStats.attackDamage = bonusHp / miscDebug.pykePassiveHpToAd;

						itemBaseStats.hp = 0;
						itemPassivesStats.hp = 0;
					} else {
						console.warn('[CHAMPION_SPECIFICS pyke] failed to calculate passive hp to ad', hpToAd);
						miscDebug.pykePassiveHpToAd = 0;
					}
				},
				priority: HOOK_PRIORITIES.preItemTotal.Pyke,
			},
			preBonus: {
				handler(_self, { runeShardStats, championPassiveStats }, { miscDebug }) {
					if (runeShardStats.hp) {
						championPassiveStats.attackDamage! += runeShardStats.hp / miscDebug.pykePassiveHpToAd!;
						runeShardStats.hp = 0;
					}
				},
				priority: HOOK_PRIORITIES.preBonus.Pyke,
			},
		},
	},
	Rammus: {
		setupData(self) {
			return {
				defensiveCurl: clamp(0, self.internalData.value.defensiveCurl ?? 0, 1),
			};
		},
		w: {
			// TODO not sure if actually desired, looks weird without styling the W as active (the border animation) and only clutters results, skip for now
			// additionalVariantsObjectNames: ['DefensiveBallCurlCancel'],
			variables: defineChampionVariables<'Rammus', typeof IRammus, 'w'>()({
				meta: {
					ReturnDamageCalc: {
						type: VariableType.magic,
					},
				},
				uninteresting: ['BuffDuration'],
			}),
		},
		calculateHooks: {
			postTotal: {
				handler(self, { totalStats, totalPreMultipliersStats, totalMultipliersStats, dragonStatMultipliers, championPassiveStats, bonusStats }, { calculatedVariables, debuffs }): void {
					let wBonusArmor: IVariableValueResult['value'] = 0;
					let wBonusMr: IVariableValueResult['value'] = 0;
					if (self.internalData.value.defensiveCurl) {
						/* rammus W bonus resists consist of a base value + a % of total armor, however this % also applies to base
						 * i.e base 20 + 50% armor = (20 * 1.5) + armor * 0.5
						 * so get that base & multiplier from tooltip variables' calculatesFrom
						 */
						const { calculatesFrom: armorCalculatesFrom } = championAbilityVariableValue('BonusArmorTooltip', { abilityVariant: (self.champion.value as typeof IRammus).abilities.w.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.w, damageSource: { stats: { value: { total: totalStats } } } as DamageSource });
						const { calculatesFrom: mrCalculatesFrom } = championAbilityVariableValue('BonusMRTooltip', { abilityVariant: (self.champion.value as typeof IRammus).abilities.w.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.w, damageSource: { stats: { value: { total: totalStats } } } as DamageSource });

						if (!armorCalculatesFrom || !mrCalculatesFrom) {
							console.warn('[CHAMPION_SPECIFICS Rammus] failed to resolve W bonus resists', armorCalculatesFrom, mrCalculatesFrom);

							return;
						}

						const wArmorMultiplier = armorCalculatesFrom[1]!.value as number;
						const wMrMultiplier = mrCalculatesFrom[1]!.value as number;
						const wConstArmorBonus = (armorCalculatesFrom[0]!.value as number) / (1 + wArmorMultiplier);
						const wConstMrBonus = (mrCalculatesFrom[0]!.value as number) / (1 + wMrMultiplier);
						const jakShoMultiplier = 1 + (calculatedVariables.jakShoBonusResistMultiplier ?? 0);
						const preDragonArmor = totalPreMultipliersStats.armor + (calculatedVariables.jakShoArmor ?? 0);
						const preDragonMr = totalPreMultipliersStats.magicResist + (calculatedVariables.jakShoMagicResist ?? 0);

						const rawArmorBonus = ((preDragonArmor + wConstArmorBonus * jakShoMultiplier) * wArmorMultiplier + wConstArmorBonus * jakShoMultiplier) * (1 + dragonStatMultipliers.armor);
						const rawMRBonus = ((preDragonMr + wConstMrBonus * jakShoMultiplier) * wMrMultiplier + wConstMrBonus * jakShoMultiplier) * (1 + dragonStatMultipliers.magicResist);

						const armorShredMultiplier = (1 - debuffs.percentageArmorShred);
						const mrShredMultiplier = (1 - debuffs.percentageMRShred);
						wBonusArmor = rawArmorBonus * armorShredMultiplier;
						wBonusMr = rawMRBonus * mrShredMultiplier;

						debuffs.shreddedArmor += rawArmorBonus * debuffs.percentageArmorShred;
						debuffs.shreddedMR += rawMRBonus * debuffs.percentageMRShred;
					}

					totalPreMultipliersStats.armor += wBonusArmor;
					totalPreMultipliersStats.magicResist += wBonusMr;
					championPassiveStats.armor = wBonusArmor;
					championPassiveStats.magicResist = wBonusMr;
					bonusStats.armor += wBonusArmor;
					bonusStats.magicResist += wBonusMr;
					totalStats.armor += wBonusArmor;
					totalStats.magicResist += wBonusMr;

					const bonusAd = championAbilityVariableValue('TotalDamage', { abilityVariant: (self.champion.value as typeof IRammus).abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { stats: { value: { total: totalStats } } } as DamageSource });

					if (typeof bonusAd.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS Rammus] failed to resolve passive bonus ad', bonusAd);

						return;
					}

					championPassiveStats.attackDamage = bonusAd.value;
					const passiveAd = championPassiveStats.attackDamage;

					const infernalMultiplierValue = passiveAd * dragonStatMultipliers.attackDamage;
					calculatedVariables.bloodmailRetributionExcludedAd += infernalMultiplierValue;

					const midQuestMultiplierValue = passiveAd * (1 + dragonStatMultipliers.attackDamage) * calculatedVariables.midQuestMultiplier;

					calculatedVariables.midQuestAd! += midQuestMultiplierValue;
					let value = infernalMultiplierValue + midQuestMultiplierValue;
					totalMultipliersStats.attackDamage += value;
					value += passiveAd;
					totalStats.attackDamage += value;
					bonusStats.attackDamage += value;
				},
				priority: HOOK_PRIORITIES.postTotal.Rammus,
			},
		},
	},
	RekSai: {
		w: {
			// TODO not in reksai.json but checked to be affected by mandate, make sure to handle
			1: {
				dataOverrides: {
					isImmobilizing: true,
				},
			},
		},
	},
	Rell: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Rell'>): number => (self.champion.value as typeof IRell)?.abilities?.passive.variants[0]!.dataValues.MaxStacks[1] ?? 5,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Rell.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), maxStacks),
			};
		},
		passive: {
			stolenResists([stacks, totalArmor = 0, totalMR = 0]: [stacks: number, totalArmor?: number, totalMR?: number], champion: IChampion, level = 1) {
				const minResistsSteal = championAbilityVariableValue('StealFloor', { abilityVariant: champion.abilities.passive.variants[0]!, damageSource: { level: { value: level } } as DamageSource });
				const stackStealPercent = championAbilityVariableValue('StealPercent', { abilityVariant: champion.abilities.passive.variants[0]! });
				if (typeof minResistsSteal.value === 'number' && typeof stackStealPercent.value === 'number') {
					const minSteal = stacks * minResistsSteal.value;
					const stealPercent = stacks * stackStealPercent.value;
					return {
						stealPercent,
						stolenArmor: Math.max(minSteal, totalArmor * stealPercent),
						stolenMR: Math.max(minSteal, totalMR * stealPercent),
					};
				} else {
					console.warn('[CHAMPION_SPECIFICS rell] failed to calculate passive steal variables', minResistsSteal, stackStealPercent);
					return {
						stealPercent: Number.NaN,
						stolenArmor: Number.NaN,
						stolenMR: Number.NaN,
					};
				}
			},
			variables: defineChampionVariables<'Rell', typeof IRell, 'passive'>()({
				known: {
					ResistsStealPercent: [],
					StolenArmor: [],
					StolenMagicResist: [],
				},
				calculate(self, target) {
					return {
						ResistsStealPercent: {
							value: self.effectsOntoTargetVars.value.rellPResistsStealPercent ?? 0,
						},
						StolenArmor: {
							value: (self.internalData.value.passiveStacksOnTarget && target?.stats.value.effectVars.rellPArmorStolen) ?? 0,
						},
						StolenMagicResist: {
							value: (self.internalData.value.passiveStacksOnTarget && target?.stats.value.effectVars.rellPMRStolen) ?? 0,
						},
					};
				},
				meta: {
					OnHitDamage: {
						type: VariableType.magic,
					},
					ResistsStealPercent: {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
					StolenArmor: {
						isCustom: true,
					},
					StolenMagicResist: {
						isCustom: true,
					},
				},
				uninteresting: ['StealPercent', 'ShredDuration', 'MaxPercentTooltipOnly'],
			}),
		},
		effectOntoTargetVars(self, vars) {
			const { passiveStacksOnTarget } = self.internalData.value;
			const stealPercent = championAbilityVariableValue('StealPercent', { abilityVariant: self.champion.value!.abilities.passive.variants[0]! });
			if (typeof stealPercent.value === 'number') {
				vars.rellPResistsStealPercent = passiveStacksOnTarget * stealPercent.value;
			} else {
				console.warn('[CHAMPION_SPECIFICS rell] failed to calculate passive resists steal percent', stealPercent);
			}
		},
		calculateHooks: {
			postInit: {
				handler(self, { championPassiveStats }) {
					if (!self.internalData.value.passiveStacksOnTarget) {
						return;
					}
					const targetEffect = self.calculationDamageTarget.value?.getEffect(EffectObjectName.rellPBreakMold)?.[0];
					if (!targetEffect) {
						return;
					}

					const { stolenArmor, stolenMR } = CHAMPION_SPECIFICS.Rell.passive.stolenResists(targetEffect.data.value, self.champion.value!, self.level.value);
					championPassiveStats.armor = stolenArmor;
					championPassiveStats.magicResist = stolenMR;
				},
			},
		},
	},
	Rengar: {
		MAX_PASSIVE_STACKS: 6,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Rengar.MAX_PASSIVE_STACKS;
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
		passive: {
			variables: defineChampionVariables<'Rengar', typeof IRengar, 'passive'>()({
				known: {
					BonusADPercent: [],
					BonusAD: [],
				},
				calculate(self) {
					return {
						BonusADPercent: {
							value: self.internalData.value.passiveStacks ** 2,
						},
						BonusAD: {
							value: self.stats.value.championPassive.attackDamage ?? 0,
						},
					};
				},
				meta: {
					BonusADPercent: {
						isCustom: true,
					},
					BonusAD: {
						isCustom: true,
					},
				},
				uninteresting: ['MaxFerocity', 'EmpoweredMSDuration', 'InCombatTimer'],
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, _stats, { calculatedVariables }) {
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					if (self.internalData.value.isPassiveMSActive) {
						const bonusMS = championAbilityVariableValue('EmpoweredMS', passiveParams);
						if (typeof bonusMS.value === 'number') {
							calculatedVariables.totalBonusPercentMoveSpeed += bonusMS.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS rengar] failed to calculate passive empowered ms', bonusMS);
						}
					}
				},
			},
			postTotal: {
				handler(self, { championPassiveStats, dragonStatMultipliers, itemPassivesStats, itemTotalStats, dragonStats, totalStats, bonusStats, totalMultipliersStats }, { calculatedVariables }) {
					const bonusADPercent = self.internalData.value.passiveStacks ** 2 / 100;
					if (!bonusADPercent) {
						return;
					}

					const dragonMult = dragonStatMultipliers?.attackDamage ?? 0;
					const midQuestMult = calculatedVariables.midQuestMultiplier;
					const bloodmailMult = calculatedVariables.bloodmailRetributionPercentage ?? 0;

					const dDragon = dragonMult;
					const dMidQuest = (1 + dragonMult) * midQuestMult;
					const dBloodmail = (1 + midQuestMult) * bloodmailMult;

					const K1 = dDragon + dMidQuest + dBloodmail;
					const denominator = 1 - bonusADPercent * K1;
					const passiveAd = (bonusADPercent * bonusStats.attackDamage) / (denominator > 0 ? denominator : 1);

					championPassiveStats.attackDamage = passiveAd;
					totalMultipliersStats.attackDamage += passiveAd;
					totalStats.attackDamage += passiveAd;
					bonusStats.attackDamage += passiveAd;

					if (midQuestMult) {
						const midQuestDiff = passiveAd * dMidQuest;
						calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + midQuestDiff;
						totalMultipliersStats.attackDamage += midQuestDiff;
						bonusStats.attackDamage += midQuestDiff;
						totalStats.attackDamage += midQuestDiff;
					}

					if (dragonMult) {
						const dragonDiff = passiveAd * dDragon;
						dragonStats.attackDamage! += dragonDiff;
						totalMultipliersStats.attackDamage += dragonDiff;
						bonusStats.attackDamage += dragonDiff;
						totalStats.attackDamage += dragonDiff;
					}

					if (bloodmailMult) {
						const bloodmailDiff = passiveAd * dBloodmail;
						calculatedVariables.bloodmailRetribution! += bloodmailDiff;
						itemPassivesStats.attackDamage += bloodmailDiff;
						itemTotalStats.attackDamage += bloodmailDiff;
						totalMultipliersStats.attackDamage += bloodmailDiff;
						bonusStats.attackDamage += bloodmailDiff;
						totalStats.attackDamage += bloodmailDiff;
					}
				},
				priority: HOOK_PRIORITIES.postTotal.Rengar,
			},
		},
	},
	Riven: {
		q: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
	},
	Rumble: {
		setupData(self) {
			return {
				isOverheated: clamp(0, Math.round(self.internalData.value.isOverheated ?? 0), 1),
			};
		},
	},
	Ryze: {
		passive: {
			variables: defineChampionVariables<'Ryze', typeof IRyze, 'passive'>()({
				known: {
					PassiveMana: [],
				},
				calculate(self) {
					return {
						PassiveMana: {
							value: self.stats.value.miscDebug.ryzePMana ?? 0,
						},
					};
				},
				meta: {
					PassiveMana: {
						isCustom: true,
					},
				},
			}),
		},
		calculateHooks: {
			postTotal: {
				handler(self, { totalStats, bonusStats, itemPassivesStats, itemTotalStats, championPassiveStats, dragonStats, dragonStatMultipliers }, { calculatedVariables, miscDebug }) {
					const apToMana = championAbilityVariableValue(
							'PercentManaIncrease' satisfies DetectChampionVariables<typeof IRyze, 'passive'>,
							{
								abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
								allAbilitiesVariants: self.allAbilityVariants.value,
								damageSource: self,
							},
					);

					if (typeof apToMana.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS ryze] failed to resolve PercentManaIncrease variable', apToMana);
						return;
					}

					const seraphManaToAp = calculatedVariables.archangelSeraphManaToAp ?? 0;
					const approachFimbulManaToHp = calculatedVariables.approachFimbulManaToHp ?? 0;
					const riftmakerBonusHPToAP = calculatedVariables.riftmakerBonusHPToAP ?? 0;

					const totalApMultiplier = (calculatedVariables.totalItemApMultipliers ?? 1)
						+ (dragonStatMultipliers?.abilityPower ?? 0)
						+ (calculatedVariables.midQuestMultiplier ?? 0);

					const effectiveManaToAp = seraphManaToAp + (approachFimbulManaToHp * riftmakerBonusHPToAP);

					const apToManaRatio = apToMana.value / 10_000;
					const loopDivisor = 1 - (totalStats.mana * apToManaRatio * effectiveManaToAp * totalApMultiplier);

					calculatedVariables.ryzePassivePercentManaIncrease = totalStats.abilityPower / loopDivisor * apToManaRatio;
					const passiveMana = totalStats.mana * calculatedVariables.ryzePassivePercentManaIncrease;
					miscDebug.ryzePMana = passiveMana;

					const passiveHp = passiveMana * approachFimbulManaToHp;
					const basePassiveAp = (passiveMana * seraphManaToAp) + (passiveHp * riftmakerBonusHPToAP);
					let passiveAd = passiveMana * (calculatedVariables.manaMuraManaToAd ?? 0);

					totalStats.mana += passiveMana;
					bonusStats.mana += passiveMana;
					championPassiveStats.mana = passiveMana;

					if (passiveHp > 0) {
						championPassiveStats.hp = passiveHp;
						totalStats.hp += passiveHp;
						bonusStats.hp += passiveHp;

						calculatedVariables.approachFimbulAwe = (calculatedVariables.approachFimbulAwe ?? 0) + passiveHp;
					}

					if (passiveAd) {
						const dragonAd = passiveAd * dragonStatMultipliers.attackDamage;
						dragonStats.attackDamage = (dragonStats.attackDamage ?? 0) + dragonAd;
						passiveAd += dragonAd;

						if (calculatedVariables.midQuestMultiplier) {
							const midQuestAd = passiveAd * calculatedVariables.midQuestMultiplier;
							calculatedVariables.midQuestAd! += midQuestAd;
							passiveAd += midQuestAd;
						}

						championPassiveStats.attackDamage = passiveAd;
						totalStats.attackDamage += passiveAd;
						bonusStats.attackDamage += passiveAd;

						if (calculatedVariables.manaMuraManaToAd) {
							calculatedVariables.manaMuraAwe! += passiveMana * calculatedVariables.manaMuraManaToAd;
						}
						if (calculatedVariables.bloodmailTyrannyBonusHpToAd) {
							calculatedVariables.bloodmailTyranny! += passiveHp * calculatedVariables.bloodmailTyrannyBonusHpToAd;
						}
					}

					if (basePassiveAp > 0) {
						const multipliedPassiveAp = basePassiveAp * totalApMultiplier;

						totalStats.abilityPower += multipliedPassiveAp;
						bonusStats.abilityPower += multipliedPassiveAp;
						championPassiveStats.abilityPower = multipliedPassiveAp;

						calculatedVariables.apMultipliersBase += basePassiveAp;

						if (seraphManaToAp > 0) {
							const seraphBaseAp = passiveMana * seraphManaToAp;
							calculatedVariables.archangelSeraphAwe = (calculatedVariables.archangelSeraphAwe ?? 0) + seraphBaseAp;
							itemPassivesStats.abilityPower += seraphBaseAp;
							itemTotalStats.abilityPower += seraphBaseAp;
						}

						if (riftmakerBonusHPToAP > 0) {
							const riftmakerBaseAp = passiveHp * riftmakerBonusHPToAP;
							calculatedVariables.riftmakerVoidInfusion = (calculatedVariables.riftmakerVoidInfusion ?? 0) + riftmakerBaseAp;
							itemPassivesStats.abilityPower += riftmakerBaseAp;
							itemTotalStats.abilityPower += riftmakerBaseAp;
						}

						if (calculatedVariables.rabadonApMultiplier) {
							const rabadonBonusAp = basePassiveAp * calculatedVariables.rabadonApMultiplier;
							calculatedVariables.rabadonMagicalOpus = (calculatedVariables.rabadonMagicalOpus ?? 0) + rabadonBonusAp;
							itemPassivesStats.abilityPower += rabadonBonusAp;
							itemTotalStats.abilityPower += rabadonBonusAp;
						}

						if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
							const bBlazeBonusAp = basePassiveAp * calculatedVariables.blackfireTorchBBlazeMultiplier;
							calculatedVariables.blackfireTorchBBlazeAP = (calculatedVariables.blackfireTorchBBlazeAP ?? 0) + bBlazeBonusAp;
							itemPassivesStats.abilityPower += bBlazeBonusAp;
							itemTotalStats.abilityPower += bBlazeBonusAp;
						}
						if (calculatedVariables.midQuestMultiplier) {
							calculatedVariables.midQuestAp! += basePassiveAp * calculatedVariables.midQuestMultiplier;
						}
					}
				},
				priority: HOOK_PRIORITIES.postTotal.Ryze,
			},
		},
	},
	Samira: {
		PASSIVE_OPTIONS: {
			none: 0,
			e: 1,
			d: 2,
			c: 3,
			b: 4,
			a: 5,
			s: 6,
		},
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Samira.PASSIVE_OPTIONS.s;
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
	},
	Sejuani: {
		setupData(self) {
			return {
				isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
			};
		},
		w: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
	},
	Senna: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
				passiveStealTargetMS: clamp(0, self.internalData.value.passiveStealTargetMS ?? 0, 1),
			};
		},
		passive: {
			variables: defineChampionVariables<'Senna', typeof ISenna, 'passive'>()({
				known: {
					'{e88568f8}': [0],
					'SiphonCurrentHealthDamage': [],
					'MoveSpeedFromTarget': [],
					'SoulsAD': [],
					'SoulsRange': [],
					'SoulsLifesteal': [],
				},
				calculate(self, target) {
					const passiveVarParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					const siphonHpPercent = championAbilityVariableValue('BonusCurentHealthDamage', passiveVarParams);
					let SiphonCurrentHealthDamage = Number.NaN;
					if (typeof siphonHpPercent.value === 'number') {
						SiphonCurrentHealthDamage = siphonHpPercent.value / 100 * (target?.stats.value.total.hp ?? 0);
					}

					return {
						'{e88568f8}': {
							value: self.internalData.value.passiveStacks,
						},
						'SiphonCurrentHealthDamage': {
							value: SiphonCurrentHealthDamage,
						},
						'MoveSpeedFromTarget': {
							value: self.stats.value.championPassive.moveSpeed ?? 0,
						},
						'SoulsAD': {
							value: self.stats.value.championPassive.attackDamage ?? 0,
						},
						'SoulsRange': {
							value: self.stats.value.championPassive.attackRange ?? 0,
						},
						'SoulsLifesteal': {
							value: self.stats.value.championPassive.lifeSteal ?? 0,
						},
					};
				},
				meta: {
					'SiphonCurrentHealthDamage': {
						type: VariableType.physical,
						isCustom: true,
					},
					'MoveSpeedFromTarget': {
						isCustom: true,
					},
					'SoulsAD': {
						isCustom: true,
					},
					'SoulsRange': {
						isCustom: true,
					},
					'SoulsLifesteal': {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
					'BonusOnHitDamage': {
						type: VariableType.physical,
					},
					'{e88568f8}': {
						isCustom: true,
						displayedName: 'Stacks',
					},
				},
				uninteresting: ['ADPerStack', 'StacksForBonus', 'BonusRange', 'BonusCritChance', 'CritToLifestealConversionPercent'],
			}),
		},
		calculateHooks: {
			postInit: {
				handler(self, { championPassiveStats }, { calculatedVariables, miscDebug }) {
					const params: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					const critDamageMod = championAbilityVariableValue('CritDamageMod', params);
					if (typeof critDamageMod.value === 'number') {
						// TODO on patch 16.17 seems to actually be 0.75, revisit when calculating aa dmg
						calculatedVariables.critMultiplierMod = critDamageMod.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS senna] failed to calculate crit damage multiplier', critDamageMod);
					}

					const stacksStep = championAbilityVariableValue('StacksForBonus', params);
					if (typeof stacksStep.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive stacks step', stacksStep);
						miscDebug.sennaPassiveStacksStep = 0;
						return;
					}

					miscDebug.sennaPassiveStacksStep = Math.floor(self.internalData.value.passiveStacks / stacksStep.value);

					const rangePerStep = championAbilityVariableValue('BonusRange', params);
					if (typeof rangePerStep.value === 'number') {
						championPassiveStats.attackRange = rangePerStep.value * miscDebug.sennaPassiveStacksStep;
					} else {
						console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive range per step', rangePerStep);
					}

					const critPerStep = championAbilityVariableValue('BonusCritChance', params);
					if (typeof critPerStep.value === 'number') {
						championPassiveStats.critChance = critPerStep.value * miscDebug.sennaPassiveStacksStep / 100;
					} else {
						console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive crit per step', critPerStep);
					}

					const adPerStack = championAbilityVariableValue('ADPerStack', params);
					if (typeof adPerStack.value === 'number') {
						championPassiveStats.attackDamage = adPerStack.value * self.internalData.value.passiveStacks;
					} else {
						console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive ad per stack', adPerStack);
					}

					if (self.internalData.value.passiveStealTargetMS && self.calculationDamageTarget.value) {
						const msSteal = championAbilityVariableValue('MSSteal', params);
						if (typeof msSteal.value === 'number') {
							championPassiveStats.moveSpeed = msSteal.value * self.calculationDamageTarget.value.stats.value.total.moveSpeed;
						} else {
							console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive ms steal', msSteal);
						}
					}
				},
			},
			onTotalPreMultipliers: {
				handler(self, { bonusStats, totalPreMultipliersStats, championPassiveStats }) {
					const params: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					const excessCritToLifesteal = championAbilityVariableValue('CritToLifestealConversionPercent', params);
					if (typeof excessCritToLifesteal.value === 'number') {
						championPassiveStats.lifeSteal = excessCritToLifesteal.value * Math.max(0, bonusStats.critChance - 1);
						bonusStats.lifeSteal += championPassiveStats.lifeSteal;
						totalPreMultipliersStats.lifeSteal += championPassiveStats.lifeSteal;
					} else {
						console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive ad per stack', excessCritToLifesteal);
					}
				},
			},
			postTotal: {
				handler(_self, { championPassiveStats }, { calculatedVariables }) {
					if (calculatedVariables.midQuestMultiplier) {
						const passiveMidQuestAd = championPassiveStats.attackDamage! * calculatedVariables.midQuestMultiplier;
						calculatedVariables.bloodmailRetributionExcludedAd += passiveMidQuestAd;
					}
				},
			},
		},
	},
	Seraphine: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Seraphine'>): number => (self.champion.value! as typeof ISeraphine).abilities.passive.variants[0]!.dataValues.MaxNotes[1]! * 5,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Seraphine.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
	},
	Shyvana: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
		passive: {
			variables: defineChampionVariables<'Shyvana', typeof IShyvana, 'passive'>()({
				known: {
					'{bba88b2a}': [0],
				},
				calculate(self) {
					return {
						'{bba88b2a}': {
							value: self.internalData.value.passiveStacks,
						},
					};
				},
				meta: {
					'{bba88b2a}': {
						isCustom: true,
						displayedName: 'Stacks',
					},
				},
				uninteresting: ['BonusArmor', 'BonusMagicResist', 'Stacks_Per_Large_Monster', 'Stacks_Per_Epic_Monster'],
			}),
		},
		calculateHooks: {
			postInit: {
				handler(self, { championPassiveStats }) {
					const params: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };
					const bonusArmor = championAbilityVariableValue('BonusArmor', params);
					const bonusMr = championAbilityVariableValue('BonusMagicResist', params);

					if (typeof bonusArmor.value === 'number' && typeof bonusMr.value === 'number') {
						championPassiveStats.armor = bonusArmor.value * self.internalData.value.passiveStacks;
						championPassiveStats.magicResist = bonusMr.value * self.internalData.value.passiveStacks;
					} else {
						console.warn('[CHAMPION_SPECIFICS shyvana] failed to calculate passive resists', bonusArmor, bonusMr);
					}
				},
			},
		},
	},
	Singed: {
		MAX_PASSIVE_STACKS: 9,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Singed.MAX_PASSIVE_STACKS;
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
		w: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
	},
	Sivir: {
		PASSIVE_BONUS_MS: ((progress, self) => {
			const bonusMS = championAbilityVariableValue('FlatMS', {
				abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
				damageSource: self,
			});

			if (typeof bonusMS.value === 'number') {
				return bonusMS.value * progress / 100;
			}

			console.warn('[CHAMPION_SPECIFICS sivir] failed to calculate passive bonus MS', bonusMS);
			return Number.NaN;
		}) satisfies IDeriveProgressFn,
		setupData(self) {
			return {
				passiveMSProgress: clamp(0, Math.round(self.internalData.value.passiveMSProgress ?? 0), 100),
			};
		},
		passive: {
			variables: defineChampionVariables<'Sivir', typeof ISivir, 'passive'>()({
				known: {
					BonusMS: [],
				},
				calculate(self) {
					return {
						BonusMS: {
							value: self.stats.value.championPassive.moveSpeed,
						},
					};
				},
				meta: {
					FlatMS: {
						displayedName: 'MaxBonusMS',
					},
					BonusMS: {
						isCustom: true,
					},
				},
				uninteresting: ['HasteDuration'],
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats }) {
					const bonusMS = CHAMPION_SPECIFICS.Sivir.PASSIVE_BONUS_MS(self.internalData.value.passiveMSProgress, { champion: self.champion, level: self.level } as DamageSource);
					if (!Number.isNaN(bonusMS)) {
						championPassiveStats.moveSpeed = bonusMS;
					}
				},
			},
		},
	},
	Smolder: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Sona: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Sona'>): number => (self.champion.value! as typeof ISona).abilities.passive.variants[0]!.dataValues.AccelerandoCap[1]! * 2,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Sona.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
	},
	Soraka: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Swain: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Sylas: {
		setupData(self) {
			return {
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
		e: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
	},
	Syndra: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Syndra'>): number => (self.champion.value! as typeof ISyndra).abilities.passive.variants[0]!.dataValues.MaxStackAmount[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Syndra.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
	},
	Taliyah: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Taric: {
		setupData(self) {
			return {
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
	},
	Teemo: {
		setupData(self) {
			return {
				isPassiveASActive: clamp(0, Math.round(self.internalData.value.isPassiveASActive ?? 0), 1),
			};
		},
	},
	Thresh: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	TwistedFate: {
		variables: defineChampionVariables<'TwistedFate', typeof ITwistedFate>()({
			known: {
				GameModeInteger: [1],
			},
			calculate() {
				return {
					GameModeInteger: {
						value: 1,
					},
				};
			},
		}),
	},
	Udyr: {
		// TODO shojin works on all abilities but ultimate haste on none
		setupData(self) {
			return {
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
	},
	Varus: {
		PASSIVE_OPTIONS: {
			none: 0,
			generic: 1,
			champion: 2,
		},
		setupData(self) {
			const maxPassive: number = CHAMPION_SPECIFICS.Varus.PASSIVE_OPTIONS.champion;
			return {
				passiveVariantActive: clamp(0, Math.round(self.internalData.value.passiveVariantActive ?? 0), maxPassive),
			};
		},
		passive: {
			variables: defineChampionVariables<'Varus', typeof IVarus, 'passive'>()({
				uninteresting: ['ASDuration'],
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats }, { calculatedVariables }) {
					const { passiveVariantActive } = self.internalData.value;
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					let bonusAS: IVariableValueResult | undefined;

					if (passiveVariantActive === CHAMPION_SPECIFICS.Varus.PASSIVE_OPTIONS.champion) {
						bonusAS = championAbilityVariableValue('PassiveAS', passiveParams);

						const asCap = championAbilityVariableValue('NewASCap', passiveParams);
						if (typeof asCap.value === 'number') {
							calculatedVariables.attackSpeedCap = asCap.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS varus] failed to calculate passive as cap', asCap);
						}
					} else if (passiveVariantActive) {
						bonusAS = championAbilityVariableValue('PassiveASMinion', passiveParams);
					}

					if (bonusAS) {
						if (typeof bonusAS.value === 'number') {
							championPassiveStats.bonusAttackSpeedPercent = bonusAS.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS varus] failed to calculate passive bonus as', bonusAS);
						}
					}
				},
			},
			onTotalPreMultipliers: {
				handler(self, { bonusStats, totalPreMultipliersStats, championPassiveStats, itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
					const { passiveVariantActive } = self.internalData.value;
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					let asToAD: IVariableValueResult | undefined;
					let asToAP: IVariableValueResult | undefined;

					if (passiveVariantActive === CHAMPION_SPECIFICS.Varus.PASSIVE_OPTIONS.champion) {
						asToAD = championAbilityVariableValue('AStoADChampion', passiveParams);
						asToAP = championAbilityVariableValue('AStoAPChampion', passiveParams);
					} else if (passiveVariantActive) {
						asToAD = championAbilityVariableValue('AStoADMinion', passiveParams);
						asToAP = championAbilityVariableValue('AStoAPMinion', passiveParams);
					}

					const bonusASPercent = (bonusStats.bonusAttackSpeedPercent - (championPassiveStats.bonusAttackSpeedPercent ?? 0));
					if (asToAD) {
						if (typeof asToAD.value === 'number') {
							const value = asToAD.value * bonusASPercent;
							championPassiveStats.attackDamage = value;
							bonusStats.attackDamage += value;
							totalPreMultipliersStats.attackDamage += value;
						} else {
							console.warn('[CHAMPION_SPECIFICS varus] failed to calculate passive bonus ad', asToAD);
						}
					}
					if (asToAP) {
						if (typeof asToAP.value === 'number') {
							const value = asToAP.value * bonusASPercent;
							calculatedVariables.apMultipliersBase += value;
							championPassiveStats.abilityPower = value;
							bonusStats.abilityPower += value;
							totalPreMultipliersStats.abilityPower += value;

							if (calculatedVariables.rabadonApMultiplier) {
								const rabadonAP = calculatedVariables.rabadonApMultiplier * value;
								itemPassivesStats.abilityPower += rabadonAP;
								itemTotalStats.abilityPower += rabadonAP;
								totalPreMultipliersStats.abilityPower += rabadonAP;
								calculatedVariables.rabadonMagicalOpus! += rabadonAP;
							}

							if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
								const rabadonAP = calculatedVariables.blackfireTorchBBlazeMultiplier * value;
								itemPassivesStats.abilityPower += rabadonAP;
								itemTotalStats.abilityPower += rabadonAP;
								totalPreMultipliersStats.abilityPower += rabadonAP;
								calculatedVariables.blackfireTorchBBlazeAP! += rabadonAP;
							}
						} else {
							console.warn('[CHAMPION_SPECIFICS varus] failed to calculate passive bonus ap', asToAP);
						}
					}
				},
			},
		},
	},
	Vayne: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Veigar: {
		setupData(self) {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
		calculateHooks: {
			postInit: {
				handler(self, { championPassiveStats }, { calculatedVariables }) {
					championPassiveStats.abilityPower = self.internalData.value.passiveStacks;
					calculatedVariables.apMultipliersBase += self.internalData.value.passiveStacks;
				},
			},
		},
		passive: {
			variables: defineChampionVariables<'Veigar', typeof IVeigar, 'passive'>()({
				known: {
					f1: [],
				},
				calculate(self) {
					return {
						f1: {
							value: self.internalData.value.passiveStacks,
						},
					};
				},
				uninteresting: ['dAbilityStacks', 'dTakedownStacks', 'APPerStack'],
			}),
		},
		r: {
			variables: defineChampionVariables<'Veigar', typeof IVeigar, 'passive'>()({
				meta: {
					MinDamage: {
						type: VariableType.magic,
					},
					MaxDamage: {
						type: VariableType.magic,
					},
				},
			}),
		},
	},
	Viego: {
		calculateHooks: {
			postTotal: {
				handler(_self, { totalStats }) {
					totalStats.mana = 0;
				},
			},
		},
	},
	Viktor: {
		MAX_PASSIVE_UPGRADES_MASK: 2 ** 4,
		setupData(self) {
			let passiveAbilityUpgradesMask = clamp(0, Math.round(self.internalData.value.passiveAbilityUpgradesMask ?? 0), CHAMPION_SPECIFICS.Viktor.MAX_PASSIVE_UPGRADES_MASK);

			/* unevolve R if not all basic are evolved */
			const rBit = 1 << 3;
			const notAllEvolved = (passiveAbilityUpgradesMask & (rBit - 1)) !== (rBit - 1);
			if (notAllEvolved) {
				passiveAbilityUpgradesMask &= ~rBit;
			}

			return {
				passiveAbilityUpgradesMask,
			};
		},
	},
	Vladimir: {
		q: {
			variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'q'>()({
				known: {
					EmpoweredHeal: [],
				},
				calculate(self) {
					const baseHeal = championAbilityVariableValue('EmpoweredHealTooltip', { abilityVariant: self.champion.value!.abilities.q.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.q, damageSource: self });
					const percentMissing = championAbilityVariableValue('EmpoweredHealPercentTooltip', { abilityVariant: self.champion.value!.abilities.q.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.q, damageSource: self });
					const missingHealth = Math.max(0, self.stats.value.total.hp - self.currentHealth.value);
					let EmpoweredHeal = 0;
					if (typeof baseHeal.value === 'number' && typeof percentMissing.value === 'number') {
						EmpoweredHeal = baseHeal.value + missingHealth * percentMissing.value;
					}
					return {
						EmpoweredHeal: {
							value: EmpoweredHeal,
						},
					};
				},
				meta: {
					EmpoweredHeal: {
						type: VariableType.heal,
						isCustom: true,
					},
					BaseDamageTooltip: {
						type: VariableType.magic,
					},
					BaseHeal: {
						type: VariableType.heal,
					},
					EmpoweredDamageTooltip: {
						type: VariableType.magic,
					},
					EmpoweredHealTooltip: {
						type: VariableType.heal,
					},
				},
				uninteresting: ['FrenzyDuration'],
			}),
		},
		w: {
			variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'w'>()({
				meta: {
					TotalDamage: {
						type: VariableType.magic,
					},
					TotalHeal: {
						type: VariableType.heal,
					},
				},
				uninteresting: ['HasteBoost', 'HasteDuration', 'MoveSpeedMod', 'MinionHealingMod'],
			}),
		},
		e: {
			variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'e'>()({
				meta: {
					MinDamageTooltip: {
						type: VariableType.magic,
					},
					MaxDamageTooltip: {
						type: VariableType.magic,
					},
					SlowPercent: {
						type: VariableType.affectedBySlowResist,
					},
				},
				uninteresting: ['MaxChannelTime'],
			}),
		},
		r: {
			/** Vladimir's ult uses the same `@Damage@` for both ult's damage and heal (and they are the same value) but in the calculator they need to be 2 separate variables, one being magic damage, the other heal */
			preplaceTooltipText(value) {
				return value.replace('<healing>@Damage@', '<healing>@Heal@');
			},
			modifyExtendedVariables(extendedVariables) {
				const damageVariable = extendedVariables[0];
				if (damageVariable?.name !== 'BaseDamage') {
					console.warn('[CHAMPION_SPECIFICS vladimir r] failed to modify extended variables, no base damage variable', extendedVariables);
					return;
				}
				extendedVariables.push({
					name: damageVariable.name,
					nameOverride: 'spell_listtype_healing',
				});
			},
			variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'r'>()({
				known: {
					Heal: [],
				},
				calculate(self) {
					return {
						Heal: championAbilityVariableValue('Damage', { abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self, abilityLevel: self.abilityLevels.value.r }),
					};
				},
				meta: {
					Damage: {
						type: VariableType.magic,
					},
					Heal: {
						type: VariableType.heal,
					},
					SecondaryHealingTooltip: {
						type: VariableType.heal,
					},
				},
				uninteresting: ['DamageAmp', 'Duration'],
			}),
		},
		passive: {
			variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'passive'>()({
				known: {
					BonusAP: [],
					BonusHP: [],
				},
				calculate(self) {
					return {
						BonusAP: {
							value: self.stats.value.variables.vladimirPassiveAp ?? 0,
						},
						BonusHP: {
							value: self.stats.value.variables.vladimirPassiveHp ?? 0,
						},
					};
				},
				meta: {
					BonusAP: {
						isCustom: true,
						additionalInfo: 'This is the actual AP that Vladimir\'s passive grants. The <var>ApproximateAPBonusAvoidingRecursion</var>, as the name suggests, is just the approximate value the game shows in the description and is, in most cases, incorrect',
					},
					BonusHP: {
						isCustom: true,
						additionalInfo: 'This is the actual HP that Vladimir\'s passive grants. The <var>ApproximateHPBonusAvoidingRecursion</var>, as the name suggests, is just the approximate value the game shows in the description and is, in most cases, incorrect',
					},
					ApproximateAPBonusAvoidingRecursion: {
						/* not displayed in game */
						calculatesFrom: [],
					},
					ApproximateHPBonusAvoidingRecursion: {
						/* not displayed in game */
						calculatesFrom: [],
					},
				},
				uninteresting: ['HPforAP', 'APRatioBonusHP'],
			}),
		},
		calculateHooks: {
			postTotal: {
				handler(self, { adaptiveForceMeta, totalStats, bonusStats, dragonStatMultipliers, championPassiveStats }, { calculatedVariables, miscDebug }) {
					const hpToAp = championAbilityVariableValue('HPforAP', { abilityVariant: self.champion.value!.abilities.passive.variants[0]! });
					const apToHp = championAbilityVariableValue('APRatioBonusHP', { abilityVariant: self.champion.value!.abilities.passive.variants[0]! });

					if (typeof hpToAp.value !== 'number' || typeof apToHp.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS vladimir] failed to calculate passive ratios', hpToAp, apToHp);
						return;
					}

					const totalApMultiplier = calculatedVariables.totalItemApMultipliers + dragonStatMultipliers.abilityPower + calculatedVariables.midQuestMultiplier;

					const excludedHPBaseAP = (adaptiveForceMeta[1] === 1 ? calculatedVariables.totalAdaptiveForce : 0)
						+ (calculatedVariables.riftmakerVoidInfusion ?? 0);

					miscDebug.vladimirPassiveAPHPBase = bonusStats.hp;
					miscDebug.vladimirPassiveHPAPBase = totalStats.abilityPower
						- excludedHPBaseAP * totalApMultiplier;

					const passiveHp = miscDebug.vladimirPassiveHPAPBase * apToHp.value;
					let passiveAp = miscDebug.vladimirPassiveAPHPBase / hpToAp.value + passiveHp * (calculatedVariables.riftmakerBonusHPToAP ?? 0);

					calculatedVariables.apMultipliersBase += passiveAp;
					passiveAp *= totalApMultiplier;

					calculatedVariables.vladimirPassiveAp = passiveAp;
					calculatedVariables.vladimirPassiveHp = passiveHp;

					totalStats.abilityPower += passiveAp;
					bonusStats.abilityPower += passiveAp;
					championPassiveStats.abilityPower = passiveAp;

					totalStats.hp += passiveHp;
					bonusStats.hp += passiveHp;
					championPassiveStats.hp = passiveHp;
				},
				priority: HOOK_PRIORITIES.postTotal.Vladimir,
			},
		},
	},
	Volibear: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Volibear'>): number => (self.champion.value! as typeof IVolibear).abilities.passive.variants[0]!.dataValues.BounceCounterMax[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Volibear.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
		passive: {
			variables: defineChampionVariables<'Volibear', typeof IVolibear, 'passive'>()({
				known: {
					AttackSpeedPercent: [],
				},
				calculate(self) {
					return {
						AttackSpeedPercent: {
							value: self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0,
						},
					};
				},
				meta: {
					ChainLightningDamage: {
						type: VariableType.magic,
					},
					AttackSpeedPercent: {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
				},
				uninteresting: ['BuffDuration'],
			}),
		},
		calculateHooks: {
			postTotal: {
				handler(self, { baseOnLevelStats, championPassiveStats, bonusStats, totalPreMultipliersStats, totalStats }, { debuffs }) {
					const attackSpeedPerStack = championAbilityVariableValue('AttackSpeedCalc', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value }, stats: { value: { total: totalStats } } } as DamageSource });
					if (typeof attackSpeedPerStack.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value;
						championPassiveStats.attackSpeed = championPassiveStats.bonusAttackSpeedPercent * baseOnLevelStats.attackSpeedRatio;
						bonusStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;
						bonusStats.attackSpeed += championPassiveStats.attackSpeed;
						totalPreMultipliersStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;

						const crippleValue = championPassiveStats.attackSpeed * debuffs.cripple;
						const crippledAS = championPassiveStats.attackSpeed - crippleValue;
						debuffs.totalCrippledAttackSpeed += crippleValue;
						totalPreMultipliersStats.attackSpeed += crippledAS;

						totalStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;
						totalStats.attackSpeed += crippledAS;
					} else {
						console.warn('[CHAMPION_SPECIFICS volibear] failed to calculate passive attack speed', attackSpeedPerStack);
					}
				},
				priority: HOOK_PRIORITIES.postTotal.Volibear,
			},
		},
	},
	MonkeyKing: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'MonkeyKing'>): number => (self.champion.value! as typeof IMonkeyKing).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.MonkeyKing.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
	},
	Yasuo: {
		passive: {
			variables: defineChampionVariables<'Yasuo', typeof IYasuo, 'passive'>()({
				known: {
					f2: [],
					f3: [],
				},
				calculate(self) {
					return {
						f2: {
							value: self.stats.value.championPassive.critChance ?? 0,
						},
						f3: {
							value: self.stats.value.championPassive.attackDamage,
						},
					};
				},
				meta: {
					ShieldValue: {
						type: VariableType.shield,
					},
					f2: {
						displayedName: 'BonusCritChance',
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
					f3: {
						displayedName: 'BonusAD',
					},
				},
				uninteresting: ['YasuoCritToAD', 'CritChanceMultiplier'],
			}),
		},
		q: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
		e: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
		calculateHooks: windBrotherCalculateHooks('Yasuo'),
	},
	Yone: {
		passive: {
			variables: defineChampionVariables<'Yone', typeof IYone, 'passive'>()({
				known: {
					f2: [],
					f3: [],
				},
				calculate(self) {
					return {
						f2: {
							value: self.stats.value.championPassive.critChance ?? 0,
						},
						f3: {
							value: self.stats.value.championPassive.attackDamage,
						},
					};
				},
				meta: {
					f2: {
						displayedName: 'BonusCritChance',
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
					f3: {
						displayedName: 'BonusAD',
					},
				},
				uninteresting: ['YoneCritToAD', 'CritChanceMultiplier', 'MagicDamageSplit'],
			}),
		},
		q: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
		calculateHooks: windBrotherCalculateHooks('Yone'),
	},
	Zaahen: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Zaahen'>): number => (self.champion.value! as typeof IZaahen).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Zaahen.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
		},
		passive: {
			variables: defineChampionVariables<'Zaahen', typeof IZaahen, 'passive'>()({
				known: {
					BonusADPercent: [],
					BonusAD: [],
				},
				calculate(self) {
					return {
						BonusADPercent: {
							value: self.stats.value.variables.zaahenPassiveAdMultiplier ?? 0,
						},
						BonusAD: {
							value: self.stats.value.championPassive.attackDamage ?? 0,
						},
					};
				},
				meta: {
					BonusADPercent: {
						isCustom: true,
						resultsIsPercentage: true,
						resultsMultiplier: 100,
					},
					BonusAD: {
						isCustom: true,
					},
				},
				uninteresting: ['MaxStacks', 'ReviveDuration'],
			}),
		},
		calculateHooks: {
			postTotal: {
				handler(self, { totalPreMultipliersStats, totalMultipliersStats, championPassiveStats, bonusStats, totalStats, dragonStats }, { calculatedVariables }) {
					const { passiveStacks } = self.internalData.value;
					if (!passiveStacks) {
						return;
					}

					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };
					const adPercentPerStack = championAbilityVariableValue('PercentBonusADCalc', passiveParams);
					const maxStacksMult = championAbilityVariableValue('MaxStacksMultiplier', passiveParams);
					if (typeof adPercentPerStack.value !== 'number' || typeof maxStacksMult.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS zaahen] failed to calculate passive ad per stack', adPercentPerStack, maxStacksMult);
						return;
					}

					const maxStacks = CHAMPION_SPECIFICS.Zaahen.MAX_PASSIVE_STACKS(self);
					const bonusADPercent = passiveStacks * adPercentPerStack.value * (passiveStacks === maxStacks ? maxStacksMult.value : 1);
					calculatedVariables.zaahenPassiveAdMultiplier = bonusADPercent;

					const passiveAd = totalPreMultipliersStats.attackDamage * bonusADPercent;

					if (calculatedVariables.midQuestMultiplier) {
						const preMultiplierBonusAd = bonusStats.attackDamage - (dragonStats.attackDamage ?? 0) - calculatedVariables.midQuestAd!;
						const midQuestAd = preMultiplierBonusAd * calculatedVariables.midQuestMultiplier * bonusADPercent;

						calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + midQuestAd;
						totalMultipliersStats.attackDamage += midQuestAd;
						totalStats.attackDamage += midQuestAd;
						bonusStats.attackDamage += midQuestAd;
						calculatedVariables.bloodmailRetributionExcludedAd = (calculatedVariables.bloodmailRetributionExcludedAd ?? 0) + midQuestAd;
					}

					championPassiveStats.attackDamage = passiveAd;
					totalMultipliersStats.attackDamage += passiveAd;
					totalStats.attackDamage += passiveAd;
					bonusStats.attackDamage += passiveAd;

					calculatedVariables.bloodmailRetributionExcludedAd += passiveAd;
				},
				priority: HOOK_PRIORITIES.postTotal.Zaahen,
			},
		},
	},
	Zeri: {
		setupData(self) {
			return {
				rActive: clamp(0, self.internalData.value.rActive ?? 0, 1),
				rStacks: Math.max(0, self.internalData.value.rStacks ?? 0),
			};
		},
		passive: {
			variables: defineChampionVariables<'Zeri', typeof IZeri, 'passive'>()({
				known: {
					TotalFullChargeDamage: [],
				},
				calculate(self, target) {
					let TotalFullChargeDamage = Number.NaN;

					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.q.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };
					const baseDamage = championAbilityVariableValue('PassiveMaxDamage', passiveParams);
					const percentHPDmg = championAbilityVariableValue('PassiveMaxChargePercentHealth', passiveParams);

					if (typeof baseDamage.value === 'number' && typeof percentHPDmg.value === 'number') {
						TotalFullChargeDamage = baseDamage.value + (target?.stats.value.total.hp ?? 0) * percentHPDmg.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS zeri] failed to calculate passive total full charge damage variables', baseDamage, percentHPDmg);
					}

					return {
						TotalFullChargeDamage: {
							value: TotalFullChargeDamage,
						},
					};
				},
				meta: {
					TotalFullChargeDamage: {
						isCustom: true,
						type: VariableType.magic,
					},
					MinDamage: {
						type: VariableType.magic,
					},
					PassiveMaxDamage: {
						type: VariableType.magic,
					},
				},
			}),
		},
		q: {
			variables: defineChampionVariables<'Zeri', typeof IZeri, 'q'>()({
				known: {
					BonusAD: [],
				},
				calculate(self) {
					return {
						BonusAD: {
							value: self.stats.value.championPassive.attackDamage ?? 0,
						},
					};
				},
				meta: {
					ActiveDamageThatCanCrit: {
						type: VariableType.physical,
					},
					BonusAD: {
						isCustom: true,
					},
				},
				uninteresting: ['NumberOfMissiles', 'ExcessAttackSpeedToADMult', 'AttackSpeedCap'],
			}),
		},
		w: {
			variables: defineChampionVariables<'Zeri', typeof IZeri, 'w'>()({
				known: {
					WallCritDamage: [],
				},
				calculate() {
					return {
						WallCritDamage: {
							value: 'TODO',
						},
					};
				},
				meta: {
					TotalDamage: {
						type: VariableType.physical,
					},
					SlowPercent: {
						type: VariableType.affectedBySlowResist,
					},
					SlowDuration: {
						type: VariableType.affectedByTenacity,
					},
					WallDamage: {
						type: VariableType.physical,
					},
					WallCritDamage: {
						type: VariableType.physical,
						isCustom: true,
					},
				},
				uninteresting: ['CriticalEffectiveness'],
			}),
		},
		e: {
			variables: defineChampionVariables<'Zeri', typeof IZeri, 'e'>()({
				meta: {
					BonusDamageTotal: {
						type: VariableType.magic,
					},
				},
				uninteresting: ['BuffDuration', 'CDReductionPerHit', 'CritCDReductionPerHit', 'CritScalingMod'],
			}),
		},
		r: {
			variables: defineChampionVariables<'Zeri', typeof IZeri, 'r'>()({
				meta: {
					TotalActiveDamage: {
						type: VariableType.magic,
					},
					ChainPhysicalDamage: {
						type: VariableType.physical,
					},
				},
				uninteresting: ['BaseASPercent', 'BaseBonusMS', 'RDuration', 'MaxHyperchargeDuration', 'MSPercent'],
			}),
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, _stats, { calculatedVariables }) {
					if (!self.internalData.value.rActive) {
						return;
					}

					const rParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value?.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self, abilityLevel: self.abilityLevels.value.r };

					const ultBonusMS = championAbilityVariableValue('BaseBonusMS', rParams);
					if (typeof ultBonusMS.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += ultBonusMS.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate r bonus ms', ultBonusMS);
					}

					if (self.internalData.value.rStacks) {
						const stackMS = championAbilityVariableValue('MSPercent', rParams);
						if (typeof stackMS.value === 'number') {
							calculatedVariables.totalBonusPercentMoveSpeed += self.internalData.value.rStacks * stackMS.value;
						} else {
							console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate r stacks bonus ms', stackMS);
						}
					}
				},
			},
			onTotalPreMultipliers: {
				handler(self, { totalPreMultipliersStats, baseStats, championPassiveStats, bonusStats }, { calculatedVariables, miscDebug }) {
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.q.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

					miscDebug.zeriExcessAS = 0;

					const passiveASCap = championAbilityVariableValue('AttackSpeedCap', passiveParams);
					if (typeof passiveASCap.value === 'number') {
						calculatedVariables.attackSpeedCap = passiveASCap.value;
						miscDebug.zeriExcessAS = Math.max(0, totalPreMultipliersStats.attackSpeed - passiveASCap.value);
					} else {
						console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate passive attack speed cap', passiveASCap);
					}

					const asToAD = championAbilityVariableValue('ExcessAttackSpeedToADMult', passiveParams);
					if (typeof asToAD.value === 'number') {
						miscDebug.zeriExcessASPercent = (miscDebug.zeriExcessAS / baseStats.attackSpeedRatio);
						/* passive calculates off of excess bonus % attack speed, so convert raw excess as to it */
						championPassiveStats.attackDamage = miscDebug.zeriExcessASPercent * asToAD.value * 100;
						bonusStats.attackDamage += championPassiveStats.attackDamage;
						totalPreMultipliersStats.attackDamage += championPassiveStats.attackDamage;

						calculatedVariables.bloodmailRetributionExcludedAd += championPassiveStats.attackDamage * calculatedVariables.midQuestMultiplier;
					} else {
						console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate attack speed cap', asToAD);
					}

					if (!self.internalData.value.rActive) {
						return;
					}

					const ultASPercent = championAbilityVariableValue('BaseASPercent', { abilityVariant: self.champion.value?.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self, abilityLevel: self.abilityLevels.value.r });
					if (typeof ultASPercent.value === 'number') {
						calculatedVariables.attackSpeedCap += ultASPercent.value * baseStats.attackSpeedRatio;
						championPassiveStats.bonusAttackSpeedPercent = ultASPercent.value;
						championPassiveStats.attackSpeed = baseStats.attackSpeedRatio * ultASPercent.value;
						totalPreMultipliersStats.attackSpeed += championPassiveStats.attackSpeed;
						totalPreMultipliersStats.bonusAttackSpeedPercent += ultASPercent.value;
						bonusStats.bonusAttackSpeedPercent = ultASPercent.value;
						bonusStats.attackSpeed += championPassiveStats.attackSpeed;
					} else {
						console.warn('[CHAMPION_SPECIFICS] zeri failed to calculate r attack speed', ultASPercent);
					}
				},
			},
		},
	},
	Zilean: {
		variables: defineChampionVariables<'Zilean', typeof IZilean>()({
			known: {
				GameModeInteger: [1],
			},
			calculate() {
				return {
					GameModeInteger: {
						value: 1,
					},
				};
			},
		}),
	},
} satisfies IHypotheticalChampionSpecifics;

export type TChampionSpecifics = typeof CHAMPION_SPECIFICS;
export type IHypotheticalChampionSpecifics = {
	[Id in IChampionId]?: IChampionSpecific<Id>;
};

export type IChampionSpecific<Id extends IChampionId | undefined = undefined>
	= IProviderGroupDataSetup<Id, Id extends keyof IChampionInternalDataMap ? IChampionInternalDataMap[Id] : never>
		& {
			[AbilityKey in IChampionAbilityKey]?: IChampionAbilitySpecific<Id>;
		} & {
			variables?: ISpecificVariables<any, any, Id, 'championAbility'>;
			calculateHooks?: ICalculateChampionStatsHookSource<Id>;
			effectOntoTargetVars?: IEffectOntoTargetVarsHook<Id>;
			[key: string]: any;
		};

export interface IChampionAbilitySpecific<Id extends IChampionId | undefined = undefined> {
	variables?: ISpecificVariables<any, any, Id, 'championAbility'>;
	effectControls?: IEffectControlsProps<any, Id>;
	/** ability will be styled as disabled (grayscale), for example Kled dismounted E & R */
	isDisabled?: (self: DamageSource) => boolean | number | undefined;
	// TODO probably need to be per variant for gnar?
	/** overrides for every ability's variant data */
	dataOverrides?: IChampionAbilityVariantDataOverrides;
	/** called in `scripts/updateData`, if present the tooltip text will be replaced with the value returned from this function. It's passed the original text */
	preplaceTooltipText?: (value: string) => string;
	/**
	 * called in `scripts/updateData` after ability variant's extended variables are parsed, meant for modifying them
	 * @note it's called for every variant of the ability, currently only Vladimir needs it but might need updating
	 */
	modifyExtendedVariables?: (extendedVariables: NonNullable<IChampionAbilityVariant['extendedVariables']>) => void;
	/**
	 * object names of additional ability variants to be extracted during `updateData`
	 * maybe there's a way not to have to declare these manually but in the ability's data I don't see anything that would point an ability's object to what it belongs to (QWER). `updateData` script warns about potential detected but missed ability variants
	 */
	additionalVariantsObjectNames?: string[];
	[key: string]: any;
	/**
	 * ability's variant specific
	 * something like `CHAMPION_SPECIFICS.Amumu.passive[0]` would be for variant 0 of Amumu's passive
	 */
	[key: number]: IChampionAbilityVariantSpecific<Id>;
};

export type IChampionAbilityVariantSpecific<Id extends IChampionId | undefined = undefined> = IProviderGroupImageText & {
	variables?: ISpecificVariables<any, any, Id, 'championAbility'>;
	dataOverrides?: IChampionAbilityVariantDataOverrides;
};

interface IChampionAbilityVariantDataOverrides {
	isImmobilizing?: boolean;
}

function windBrotherCalculateHooks(id: 'Yasuo' | 'Yone'): ICalculateChampionStatsHookSource {
	return {
		postInit: {
			handler(self, _stats, { calculatedVariables }) {
				const critDamageMod = championAbilityVariableValue('CritDamageMod', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });
				if (typeof critDamageMod.value === 'number') {
					calculatedVariables.critMultiplierMod = critDamageMod.value;
				} else {
					console.warn(`[CHAMPION_SPECIFICS ${id}] failed to calculate passive crit multiplier`, critDamageMod);
				}
			},
		},
		onTotalPreMultipliers: {
			handler(self, { bonusStats, championPassiveStats, totalPreMultipliersStats }) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };

				const critMultiplier = championAbilityVariableValue('CritChanceMultiplier', passiveParams);
				if (typeof critMultiplier.value === 'number') {
					championPassiveStats.critChance = bonusStats.critChance * critMultiplier.value;
					bonusStats.critChance += championPassiveStats.critChance;
					totalPreMultipliersStats.critChance += championPassiveStats.critChance;
				} else {
					console.warn(`[CHAMPION_SPECIFICS ${id}] failed to calculate passive crit multiplier`, critMultiplier);
				}

				const critToAD = championAbilityVariableValue(`${id}CritToAD`, passiveParams);
				if (typeof critToAD.value === 'number') {
					championPassiveStats.attackDamage = Math.max(0, bonusStats.critChance - 1) * critToAD.value;
					bonusStats.attackDamage += championPassiveStats.attackDamage;
					totalPreMultipliersStats.attackDamage += championPassiveStats.attackDamage;
				} else {
					console.warn(`[CHAMPION_SPECIFICS ${id}] failed to calculate passive crit to ad`, critToAD);
				}
			},
		},
	};
}

export interface IChampionInternalDataMap {
	TargetDummy: IChampionStats;
	Akali: { isPassiveMSActive: number };
	Ambessa: { hasPassiveStack: number };
	Amumu: { applyPassive: number };
	Anivia: { isEgg: number };
	Aphelios: { lastRotatedVariantIndex: number };
	AurelionSol: { passiveStacks: number };
	Ashe: { frostShot: number };
	Bard: { passiveStacks: number; chimeMoveSpeed: number };
	Belveth: { passiveStacks: number; hasPassiveStack: number };
	Chogath: { ultStacks: number };
	Darius: { isChampionAtMaxBleed: number };
	Diana: { isPassiveEmpowered: number };
	Draven: { passiveStacks: number };
	Ekko: { isPassiveMSActive: number };
	Ezreal: { passiveStacks: number };
	Fiora: { passiveMSProgress: number };
	Garen: { isPassiveActive: number };
	Heimerdinger: { isPassiveMSActive: number };
	Irelia: { passiveStacks: number };
	Jax: { passiveStacks: number };
	Jhin: { isPassiveMSActive: number };
	Jinx: { passiveStacks: number };
	Kaisa: { passiveStacksOnTarget: number };
	Kayle: { passiveStacks: number };
	Kayn: { form: number };
	Kindred: { passiveStacks: number };
	Kled: {
		kledCurrentHP: number;
		skaarlCurrentHP: number;
		runningTowardsEnemy: number;
		enemiesNearby: number;
	};
	LeeSin: { hasPassiveStack: number };
	Mordekaiser: { isPassiveMSActive: number };
	Naafiri: { passiveStacks: number };
	Nami: {
		passiveMSProgress: number;
		/**
		 * passive MS needs total AP. Snapshot it on extra component `calculate/recalculate` press, then use it in calculation
		 * basically lets you do something like: apply passive -> you gain stats -> apply passive again with the stats you have from the previous application
		 */
		passiveMSTotalAp?: number;
	};
	Nasus: { wProgress: number };
	Nidalee: { passiveVariantActive: number };
	Nunu: { isPassiveActive: number };
	Orianna: { passiveStacksOnTarget: number };
	Ornn: { _masterworkLevel: number; masterworkItemSlot: number; passiveUpgradedAllies: number };
	Rammus: { defensiveCurl: number };
	Rell: { passiveStacksOnTarget: number };
	Rengar: { passiveStacks: number; isPassiveMSActive: number };
	Rumble: { isOverheated: number };
	Samira: { passiveStacks: number };
	Sejuani: { isPassiveActive: number };
	Senna: { passiveStacks: number; passiveStealTargetMS: number };
	Seraphine: { passiveStacks: number };
	Shyvana: { passiveStacks: number };
	Singed: { passiveStacks: number };
	Sivir: { passiveMSProgress: number };
	Smolder: { passiveStacks: number };
	Sona: { passiveStacks: number };
	Soraka: { isPassiveMSActive: number };
	Swain: { passiveStacks: number };
	Sylas: { hasPassiveStack: number };
	Syndra: { passiveStacks: number };
	Taliyah: { isPassiveMSActive: number };
	Taric: { hasPassiveStack: number };
	Teemo: { isPassiveASActive: number };
	Thresh: { passiveStacks: number };
	Udyr: { hasPassiveStack: number };
	Varus: { passiveVariantActive: number };
	Vayne: { isPassiveMSActive: number };
	Veigar: { passiveStacks: number };
	Viktor: { passiveAbilityUpgradesMask: number };
	Volibear: { passiveStacks: number };
	MonkeyKing: { passiveStacks: number };
	Zeri: { rActive: number; rStacks: number };
	Zaahen: { passiveStacks: number };
}

/** wrapper around `defineVariables` for types on champion specific's variables */
export function defineChampionVariables<
	Id extends IChampionId,
	T = never,
	AbilityKey extends IChampionAbilityKey = IChampionAbilityKey,
	DetectedVariables extends string = DetectChampionVariables<T, AbilityKey>,
>() {
	return function <
		Config extends IDefineVariablesConfig<Id, 'championAbility', DetectedVariables> = IDefineVariablesConfig<Id, 'championAbility', DetectedVariables>,
	>(
		config: Config & Omit<ISpecificVariables<DetectedVariables, IExtractExtraVariables<Config, DetectedVariables>, Id, 'championAbility'>, 'default'>,
	): ISpecificVariables<DetectedVariables, IExtractExtraVariables<Config, DetectedVariables>, Id, 'championAbility'> {
		return defineVariables<DetectedVariables, Id, 'championAbility', Config>(config as any);
	};
}
