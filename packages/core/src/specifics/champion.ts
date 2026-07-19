import type { TMiscData } from '@lolcalc/data';
import type IAphelios from '@lolcalc/data/files/champion/Aphelios.json';
import type IBriar from '@lolcalc/data/files/champion/Briar.json';
import type ICassiopeia from '@lolcalc/data/files/champion/Cassiopeia.json';
import type IEvelynn from '@lolcalc/data/files/champion/Evelynn.json';
import type IEzreal from '@lolcalc/data/files/champion/Ezreal.json';
import type IIrelia from '@lolcalc/data/files/champion/Irelia.json';
import type IJax from '@lolcalc/data/files/champion/Jax.json';
import type IKaisa from '@lolcalc/data/files/champion/Kaisa.json';
import type IKalista from '@lolcalc/data/files/champion/Kalista.json';
import type IKayle from '@lolcalc/data/files/champion/Kayle.json';
import type IKayn from '@lolcalc/data/files/champion/Kayn.json';
import type IMonkeyKing from '@lolcalc/data/files/champion/MonkeyKing.json';
import type INaafiri from '@lolcalc/data/files/champion/Naafiri.json';
import type IOrianna from '@lolcalc/data/files/champion/Orianna.json';
import type IOrnn from '@lolcalc/data/files/champion/Ornn.json';
import type IRammus from '@lolcalc/data/files/champion/Rammus.json';
import type IRell from '@lolcalc/data/files/champion/Rell.json';
import type IRyze from '@lolcalc/data/files/champion/Ryze.json';
import type ISeraphine from '@lolcalc/data/files/champion/Seraphine.json';
import type ISona from '@lolcalc/data/files/champion/Sona.json';
import type ISyndra from '@lolcalc/data/files/champion/Syndra.json';
import type ITwistedFate from '@lolcalc/data/files/champion/TwistedFate.json';
import type IZaahen from '@lolcalc/data/files/champion/Zaahen.json';
import type IZilean from '@lolcalc/data/files/champion/Zilean.json';
import type { IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IChampionStats } from '@lolcalc/shared';
import type { ComputedRef } from 'vue';
import type { DamageSource, ICalculateChampionStatsHookSource, IDamageSourceInternalDataBase, IProviderGroupDataSetup, IProviderGroupImageText } from '../DamageSource';
import type { DetectChampionVariables } from '../types';
import type { ISpecificVariables, IVariableValueResult } from './index';
import { MISC } from '@lolcalc/data';
import { ALL_CHAMPION_STATS_ENTRIES, ITEM_NAME_TO_ID, VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { computed, watch } from 'vue';
import { calculateMSCapPenalty } from '../calculate/util.ts';
import { championAbilityVariableValue, VARIABLE_CALCULATION_FNS } from '../variables/game.ts';
import { defineVariables, HOOK_PRIORITIES, ITEM_SPECIFICS_SHARED } from './index.ts';

export function cooldownReductionPercentageFromHaste(haste: number): number {
	return haste / (haste + 100) * 100;
}

export type IApheliosWeapon = 'calibrum' | 'severum' | 'gravitum' | 'infernum' | 'crescendum';

/** specific champions' helpers, utils and calculations */
export const CHAMPION_SPECIFICS = {
	TargetDummy: {
		setupData(self): IChampionStats {
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
				handler(self, { baseStats }) {
					for (const [statName, statMeta] of ALL_CHAMPION_STATS_ENTRIES) {
						if (self.internalData.value[statName] !== undefined) {
							baseStats[statName] = self.internalData.value[statName] * (statMeta.isPercentage ? 0.01 : 1);
						}
					}
				},
			},
		},
	},
	Ambessa: {
		setupData(self): { hasPassiveStack: number } {
			return {
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
	},
	Amumu: {
		setupData(self): { applyPassive: number } {
			return {
				applyPassive: clamp(0, Math.round(self.internalData.value.applyPassive ?? 0), 1),
			};
		},
	},
	Anivia: {
		setupData(self): { isEgg: number } {
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
		variables: defineChampionVariables<'Aphelios', typeof IAphelios>({
			known: {
			/* f2-f5 variants are covered by f1, they seem to be intended for different guns but resolve to the same values */
				f1: [1, 2, 3, 4, 5],
				f2: [],
				f3: [],
				f4: [],
				f5: [],
				/* array of 12, 13, ..., 21, 23, ..., 53, 53 - no 2 repeated numbers like 11, 22 */
				f7: Array.from({ length: 5 }, (_, i) => i + 1).flatMap(i => Array.from({ length: 5 }, (_, j) => i === (j + 1) ? undefined : `${i}${j + 1}`).filter(Boolean)) as string[],
			},
			calculate() {
				// TODO
				return {} as any;
			},
		}),
		setupData(self): IDamageSourceInternalDataBase {
			const abilityVariantsIndexes = self.abilityVariantsIndexes.value;
			const { WEAPON_NAME_TO_VARIANT_INDEX, WEAPON_VARIANT_INDEX_TO_NAME } = CHAMPION_SPECIFICS.Aphelios;

			abilityVariantsIndexes.q ??= WEAPON_NAME_TO_VARIANT_INDEX.calibrum;

			abilityVariantsIndexes.w ??= WEAPON_NAME_TO_VARIANT_INDEX.severum;
			if (abilityVariantsIndexes.w === abilityVariantsIndexes.q) {
				abilityVariantsIndexes.w = (abilityVariantsIndexes.q + 1) % WEAPON_VARIANT_INDEX_TO_NAME.length;
			}

			abilityVariantsIndexes.e ??= WEAPON_NAME_TO_VARIANT_INDEX.gravitum;
			while (
				abilityVariantsIndexes.e === abilityVariantsIndexes.q
				|| abilityVariantsIndexes.e === abilityVariantsIndexes.w
			) {
				abilityVariantsIndexes.e = (abilityVariantsIndexes.e + 1) % WEAPON_VARIANT_INDEX_TO_NAME.length;
			}

			return {
				_watchHandles: [watch(self.level, () => {
					self.abilityLevels.value.r = Math.floor((self.level.value - 1) / 5);
				}, { immediate: true })],
			};
		},
		e: {
			variables: defineChampionVariables<'Aphelios', typeof IAphelios>({
				known: {
					f1: [1, 2, 3],
				},
				calculate() {
					// TODO
					return {} as any;
				},
			}),
		},
	},
	AurelionSol: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Bard: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Belveth: {
		setupData(self): { passiveStacks: number; hasPassiveStack: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), 1),
			};
		},
	},
	Briar: {
		calculateHooks: {
			postTotal: {
				handler(self, { championPassiveStats, bonusStats, totalStats }, { calculatedVariables }) {
					const currentHpPercent = self.currentHealth.value / totalStats.hp;
					console.log('briaring', currentHpPercent);
				},
				priority: HOOK_PRIORITIES.postTotal.Briar,
			},
		},
		passive: {
			variables: defineChampionVariables<'Briar', typeof IBriar, 'passive'>({
				uninteresting: ['BleedDuration', 'MaxBleedStacks', 'HealPercent', 'CurrentHealthPercentCost', 'PercentOfBleedHealedOnKill'],
			}),
		},
	},
	Cassiopeia: {
		calculateHooks: {
			onTotalPreMultipliers: {
				handler(self, { championPassiveStats, totalPreMultipliersStats, baseStats, bonusStats }, { calculatedVariables }) {
					const msMultiplier = championAbilityVariableValue('PercentHasteMod', { abilityVariant: (self.champion.value as typeof ICassiopeia).abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });

					if (typeof msMultiplier.value === 'number') {
						/* could store those variables pre applying mult & penalty in `championStats` but since it's only cassio for now that needs them it can stay, if more stuff needs access to them then refactor */
						const standardPrePenalty = totalPreMultipliersStats.moveSpeed + calculatedVariables.movespeedSoftCapPenalty;
						const percent = calculatedVariables.totalBonusPercentMoveSpeed;
						const flat = standardPrePenalty / (1 + percent) - baseStats.moveSpeed;

						const mult = 1 + msMultiplier.value;
						const effectiveFlat = flat * mult;
						const effectivePercent = percent * mult;

						const newPrePenaltyMS = (baseStats.moveSpeed + effectiveFlat) * (1 + effectivePercent);
						const newPenalty = calculateMSCapPenalty(newPrePenaltyMS);
						const newFinalMS = newPrePenaltyMS - newPenalty;

						totalPreMultipliersStats.moveSpeed = newFinalMS;
						const newBonus = newFinalMS - baseStats.moveSpeed;
						championPassiveStats.moveSpeed = newBonus - bonusStats.moveSpeed;
						bonusStats.moveSpeed = newBonus;
						calculatedVariables.movespeedSoftCapPenalty = newPenalty;
					} else {
						console.warn('[CHAMPION_SPECIFICS cassiopeia] failed to calculate passive ms multiplier');
					}
				},
				priority: HOOK_PRIORITIES.onTotalPreMultipliers.Cassiopeia,
			},
		},
		passive: {
			variables: defineChampionVariables<'Cassiopeia', typeof ICassiopeia, 'passive'>({
				meta: {
					PercentHasteMod: {
						displayedName: 'MoveSpeedPercent',
					},
				},
			}),
		},
	},
	Darius: {
		setupData(self): { isChampionAtMaxBleed: number } {
			return {
				isChampionAtMaxBleed: clamp(0, Math.round(self.internalData.value.isChampionAtMaxBleed ?? 0), 1),
			};
		},
	},
	Diana: {
		setupData(self): { isPassiveEmpowered: number } {
			return {
				isPassiveEmpowered: clamp(0, Math.round(self.internalData.value.isPassiveEmpowered ?? 0), 1),
			};
		},
	},
	Draven: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Ekko: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Evelynn: {
		passive: {
			variables: defineChampionVariables<'Evelynn', typeof IEvelynn, 'passive'>({
				uninteresting: ['DemonShadeTimer', 'StealthDropTimer'],
			}),
		},
	},
	Ezreal: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Ezreal'>): number => (self.champion.value! as typeof IEzreal).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Ezreal.MAX_PASSIVE_STACKS(self)),
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
	Garen: {
		setupData(self): { isPassiveActive: number } {
			return {
				isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
			};
		},
	},
	Heimerdinger: {
		setupData(self): { isPassiveMSActive: number } {
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
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Irelia.MAX_PASSIVE_STACKS(self)),
			};
		},
		r: {
			dataOverrides: {
				isImmobilizing: false,
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
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Jax.MAX_PASSIVE_STACKS(self)),
			};
		},
		calculateHooks: {
			onChampionPassive: {
				handler(self, { championPassiveStats }) {
					const attackSpeedPerStack = championAbilityVariableValue('AttackSpeedPerStack', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof attackSpeedPerStack.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS jax] failed to calculate passive attack speed');
					}
				},
			},
		},
		passive: {
			variables: defineChampionVariables<'Jax', typeof IJax, 'passive'>({
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
	},
	Jhin: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Jinx: {
		MAX_PASSIVE_STACKS: 5, /* doesn't seem to be in passive's data */
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Jinx.MAX_PASSIVE_STACKS),
			};
		},
	},
	Kaisa: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Kaisa'>): number => (self.champion.value! as typeof IKaisa).abilities.passive.variants[0]!.dataValues.PMaxStacks[1]!,
		setupData(self): { passiveStacksOnTarget: number } {
			return {
				passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), CHAMPION_SPECIFICS.Kaisa.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Kalista: {
		variables: defineChampionVariables<'Kalista', typeof IKalista>({
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
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Kayle.MAX_PASSIVE_STACKS(self)),
			};
		},
		passive: {
			variables: defineChampionVariables<'Kayle', typeof IKayle, 'passive'>({
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
		setupData(self): { form: number } {
			return {
				form: clamp(0, Math.round(self.internalData.value.form ?? 0), CHAMPION_SPECIFICS.Kayn.FORM_OPTIONS.rhaast),
			};
		},
		variables: defineChampionVariables<'Kayn', typeof IKayn>({
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
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Kled: {
		setupData(self): { isDismounted: number } {
			return {
				isDismounted: clamp(0, Math.round(self.internalData.value.isDismounted ?? 0), 1),
			};
		},
	},
	KSante: {
		q: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
	},
	LeeSin: {
		setupData(self): { hasPassiveStack: number } {
			return {
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
	},
	Mordekaiser: {
		setupData(self): { isPassiveMSActive: number } {
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
		setupData(self): { passiveStacks: number } & IDamageSourceInternalDataBase {
			const maxPassiveStacks = CHAMPION_SPECIFICS.Naafiri.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxPassiveStacks.value),
				_watchHandles: [watch(self.level, () => {
					self.internalData.value.passiveStacks = Math.min(self.internalData.value.passiveStacks, maxPassiveStacks.value);
				})],
			};
		},
	},
	Nidalee: {
		PASSIVE_OPTIONS: {
			none: 0,
			justBush: 1,
			towardsChampion: 2,
		},
		setupData(self): { passiveVariantActive: number } {
			return {
				passiveVariantActive: clamp(0, Math.round(self.internalData.value.passiveVariantActive ?? 0), CHAMPION_SPECIFICS.Nidalee.PASSIVE_OPTIONS.towardsChampion),
			};
		},
	},
	Nunu: {
		setupData(self): { isPassiveActive: number } {
			return {
				isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
			};
		},
	},
	Orianna: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Orianna'>): number => (self.champion.value! as typeof IOrianna).abilities.passive.variants[0]!.dataValues.StackCount[1]!,
		setupData(self): { passiveStacksOnTarget: number } {
			return {
				passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), CHAMPION_SPECIFICS.Orianna.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Ornn: {
		MASTERWORK_LEVEL: (self: DamageSource<'Ornn'>): number => (self.champion.value! as typeof IOrnn).abilities.passive.variants[0]!.dataValues.MasterworkLevel[1]!,
		MAX_UPGRADED_ALLIES: 4,
		calcMaxUpgradedAllies(self: DamageSource<'Ornn'>): number {
			return Math.min(CHAMPION_SPECIFICS.Ornn.MAX_UPGRADED_ALLIES, Math.max(0, self.level.value - CHAMPION_SPECIFICS.Ornn.MASTERWORK_LEVEL(self)));
		},
		setupData(self): { _masterworkLevel: number; masterworkItemSlot: number; passiveUpgradedAllies: number } & IDamageSourceInternalDataBase {
			const _masterworkLevel = CHAMPION_SPECIFICS.Ornn.MASTERWORK_LEVEL(self);
			return {
				masterworkItemSlot: self.level.value >= _masterworkLevel
					? clamp(1, Math.round(self.internalData.value.masterworkItemSlot ?? 1), 6)
					: 1,
				passiveUpgradedAllies: clamp(0, Math.round(self.internalData.value.passiveUpgradedAllies ?? 0), CHAMPION_SPECIFICS.Ornn.calcMaxUpgradedAllies(self)),
				_masterworkLevel,
				_watchHandles: [watch(self.level, () => {
					self.internalData.value.passiveUpgradedAllies = Math.min(self.internalData.value.passiveUpgradedAllies, CHAMPION_SPECIFICS.Ornn.calcMaxUpgradedAllies(self));
				})],
			};
		},
		variables: defineChampionVariables<'Ornn', typeof IOrnn>({
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
	},
	Rammus: {
		// TODO get w cancel variant spell_defensiveballcurlcancel_tooltip
		// rammusdbc https://raw.communitydragon.org/latest/game/global/champions/champions.bin.json
		setupData(self): { defensiveCurl: number } {
			return {
				defensiveCurl: clamp(0, self.internalData.value.defensiveCurl ?? 0, 1),
			};
		},
		calculateHooks: {
			postTotal: {
				handler(self, { totalStats, totalPreMultipliersStats, totalMultipliersStats, dragonStatMultipliers, championPassiveStats, bonusStats }, { calculatedVariables }): void {
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

						wBonusArmor = ((preDragonArmor + wConstArmorBonus * jakShoMultiplier) * wArmorMultiplier + wConstArmorBonus * jakShoMultiplier) * (1 + dragonStatMultipliers.armor);
						wBonusMr = ((preDragonMr + wConstMrBonus * jakShoMultiplier) * wMrMultiplier + wConstMrBonus * jakShoMultiplier) * (1 + dragonStatMultipliers.magicResist);
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
		w: {
			variables: defineChampionVariables<'Rammus', typeof IRammus, 'w'>({
				meta: {
					ReturnDamageCalc: {
						type: VariableType.magic,
					},
				},
				uninteresting: ['BuffDuration'],
			}),
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
		MAX_PASSIVE_STACKS: (self: DamageSource<'Rell'>): number => (self.champion.value! as typeof IRell).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self): { passiveStacksOnTarget: number } {
			return {
				passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), CHAMPION_SPECIFICS.Rell.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Rengar: {
		MAX_PASSIVE_STACKS: 5,
		setupData(self): { passiveStacks: number; isPassiveMSActive: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Rengar.MAX_PASSIVE_STACKS),
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
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
		setupData(self): { isOverheated: number } {
			return {
				isOverheated: clamp(0, Math.round(self.internalData.value.isOverheated ?? 0), 1),
			};
		},
	},
	Ryze: {
		calculateHooks: {
			postTotal: {
				handler(self, { totalStats, bonusStats, totalMultipliersStats, championPassiveStats }, { calculatedVariables, miscDebug }) {
					if (!self.champion.value) {
						return;
					}

					const apMultiplier = championAbilityVariableValue(
							'PercentManaIncrease' satisfies DetectChampionVariables<typeof IRyze, 'passive'>,
							{
								abilityVariant: self.champion.value.abilities.passive.variants[0]!,
								allAbilitiesVariants: self.allAbilityVariants.value,
								damageSource: self,
							},
					);

					if (typeof apMultiplier.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS ryze] failed to resolve PercentManaIncrease variable', apMultiplier);
						return;
					}

					const apTearItemId = [ITEM_NAME_TO_ID.archangelsStaff, ITEM_NAME_TO_ID.seraphsEmbrace]
						.find(id => self.items.value.some(item => item && item.id === id));
					const hpTearItemId = [ITEM_NAME_TO_ID.wintersApproach, ITEM_NAME_TO_ID.fimbulwinter]
						.find(id => self.items.value.some(item => item && item.id === id));

					const apToManaPercentIncreaseRatio = apMultiplier.value / 10_000;
					const tearItemAPRatio = apTearItemId ? ITEM_SPECIFICS_SHARED[apTearItemId].AP_FROM_MANA : 0;
					const tearItemHPRatio = hpTearItemId ? ITEM_SPECIFICS_SHARED[hpTearItemId].HP_FROM_MANA : 0;
					const riftmakerHpToApRatio = self.items.value.some(item => item && item.id === ITEM_NAME_TO_ID.riftmaker) ? ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.riftmaker].HP_TO_AP : 0;

					miscDebug.ryzePassiveAPBase = totalStats.abilityPower;
					miscDebug.ryzePassiveManaBase = totalStats.mana;

					// eslint-disable-next-line no-console
					console.log('INPUT', {
						apToManaPercentIncreaseRatio,
						tearItemAPRatio,
						tearItemHPRatio,
						riftmakerHpToApRatio,
						ryzePassiveAPBase: totalStats.abilityPower,
						ryzePassiveManaBase: totalStats.mana,
						questStatMultiplier: (MISC as TMiscData).roleQuests.mid.dataValues.BonusADAP,
						totalStats: {
							abilityPower: totalStats.abilityPower,
							hp: totalStats.hp,
							mana: totalStats.mana,
						},
						calculatedVariables: {
							totalItemApMultipliers: calculatedVariables.totalItemApMultipliers,
							archangelSeraphAwe: calculatedVariables.archangelSeraphAwe,
							approachFimbulAwe: calculatedVariables.approachFimbulAwe,
							riftmakerVoidInfusion: calculatedVariables.riftmakerVoidInfusion,
							rabadonMagicalOpus: calculatedVariables.rabadonMagicalOpus,
						},
					});

					const effectiveAddedAPRatio = tearItemAPRatio * (1 + (MISC as TMiscData).roleQuests.mid.dataValues.BonusADAP);
					const effectiveAddedHPRatio = tearItemHPRatio * (riftmakerHpToApRatio ? (1 + (MISC as TMiscData).roleQuests.mid.dataValues.BonusADAP) : 1);

					const totalAddedAP = effectiveAddedAPRatio + (riftmakerHpToApRatio * effectiveAddedHPRatio);

					const numerator = miscDebug.ryzePassiveManaBase * apToManaPercentIncreaseRatio * miscDebug.ryzePassiveAPBase;
					const denominator = 1 - (miscDebug.ryzePassiveManaBase * apToManaPercentIncreaseRatio * totalAddedAP);
					miscDebug.ryzePMana = (totalAddedAP === 0 || denominator <= 0) ? numerator : numerator / denominator;

					const tearItemBaseAddedAP = tearItemAPRatio * miscDebug.ryzePMana;
					const tearItemFromQuestAddedAP = tearItemBaseAddedAP * (MISC as TMiscData).roleQuests.mid.dataValues.BonusADAP;
					const tearItemTotalAp = tearItemBaseAddedAP + tearItemFromQuestAddedAP;

					const addedHP = effectiveAddedHPRatio * miscDebug.ryzePMana;
					const riftmakerAddedAP = riftmakerHpToApRatio * addedHP;
					const addedAP = tearItemTotalAp + riftmakerAddedAP;

					totalStats.mana += miscDebug.ryzePMana;
					bonusStats.mana += miscDebug.ryzePMana;
					championPassiveStats.mana = miscDebug.ryzePMana;

					totalStats.abilityPower += addedAP;
					totalMultipliersStats.abilityPower += tearItemFromQuestAddedAP;
					bonusStats.abilityPower += addedAP;

					totalStats.hp += addedHP;
					bonusStats.hp += addedHP;

					miscDebug.tearItemBonusMana = (miscDebug.tearItemBonusMana ?? 0) + miscDebug.ryzePMana;
					calculatedVariables.ryzePassivePercentManaIncrease = miscDebug.ryzePMana / miscDebug.ryzePassiveManaBase;

					miscDebug.tearItemBonusMana = (miscDebug.tearItemBonusMana ?? 0) + miscDebug.ryzePMana;
					calculatedVariables.ryzePassivePercentManaIncrease = miscDebug.ryzePMana / miscDebug.ryzePassiveManaBase;

					if (calculatedVariables.archangelSeraphAwe !== undefined) {
						calculatedVariables.archangelSeraphAwe += tearItemBaseAddedAP;
					}
					if (calculatedVariables.approachFimbulAwe !== undefined) {
						calculatedVariables.approachFimbulAwe += addedHP;
					}
					if (calculatedVariables.midQuestAp !== undefined) {
						calculatedVariables.midQuestAp += tearItemFromQuestAddedAP;
					}
					if (calculatedVariables.riftmakerVoidInfusion !== undefined) {
						calculatedVariables.riftmakerVoidInfusion += riftmakerAddedAP;
					}

					// eslint-disable-next-line no-console
					console.log('OUTPUT', {
						totalStats: {
							abilityPower: totalStats.abilityPower,
							hp: totalStats.hp,
							mana: totalStats.mana,
						},
						calculatedVariables: {
							archangelSeraphAwe: calculatedVariables.archangelSeraphAwe,
							approachFimbulAwe: calculatedVariables.approachFimbulAwe,
							riftmakerVoidInfusion: calculatedVariables.riftmakerVoidInfusion,
							ryzePassivePercentManaIncrease: calculatedVariables.ryzePassivePercentManaIncrease,
							rabadonMagicalOpus: calculatedVariables.rabadonMagicalOpus,
						},
					});
				},
				priority: HOOK_PRIORITIES.postTotal.Ryze,
			},
		},
		variables: defineChampionVariables<'Ryze', typeof IRyze>({
			known: {
				PassiveManaCalcTooltip: [],
				PassiveMana: [],
			},
			calculate(self) {
				return {
					PassiveManaCalcTooltip: {
						value: self.stats.value.variables.ryzePassivePercentManaIncrease ?? 0,
					},
					PassiveMana: {
						value: self.stats.value.miscDebug.ryzePMana ?? 0,
					},
				};
			},
			meta: {
				PassiveManaCalcTooltip: {
					scalesWithStatIcon: 'abilityPower',
					multiplier: 100,
					roundReplaced: 2,
					resultsIsPercentage: true,
					extendedEquals(params, dynamicVariables) {
						const apMultiplier = championAbilityVariableValue(
							'PercentManaIncrease' satisfies DetectChampionVariables<typeof IRyze, 'passive'>,
							params,
							dynamicVariables,
						);
						return `<scaleap>${apMultiplier.value}%</scaleap>`;
					},
				},
				PassiveMana: {
					isCustom: true,
				},
			},
		}),
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
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Samira.PASSIVE_OPTIONS.s),
			};
		},
	},
	Sejuani: {
		setupData(self): { isPassiveActive: number } {
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
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Seraphine: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Seraphine'>): number => (self.champion.value! as typeof ISeraphine).abilities.passive.variants[0]!.dataValues.MaxNotes[1]! * 5,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Seraphine.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Shyvana: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Singed: {
		MAX_PASSIVE_STACKS: 9,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Singed.MAX_PASSIVE_STACKS),
			};
		},
		w: {
			dataOverrides: {
				isImmobilizing: true,
			},
		},
	},
	Smolder: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Sona: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Sona'>): number => (self.champion.value! as typeof ISona).abilities.passive.variants[0]!.dataValues.AccelerandoCap[1]! * 2,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Sona.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Soraka: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Swain: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	Sylas: {
		setupData(self): { hasPassiveStack: number } {
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
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Syndra.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Taliyah: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Taric: {
		setupData(self): { hasPassiveStack: number } {
			return {
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.hasPassiveStack ?? 0), 1),
			};
		},
	},
	Teemo: {
		setupData(self): { isPassiveASActive: number } {
			return {
				isPassiveASActive: clamp(0, Math.round(self.internalData.value.isPassiveASActive ?? 0), 1),
			};
		},
	},
	Thresh: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
		},
	},
	TwistedFate: {
		variables: defineChampionVariables<'TwistedFate', typeof ITwistedFate>({
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
		setupData(self): { hasPassiveStack: number } {
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
		setupData(self): { passiveVariantActive: number } {
			return {
				passiveVariantActive: clamp(0, Math.round(self.internalData.value.passiveVariantActive ?? 0), CHAMPION_SPECIFICS.Varus.PASSIVE_OPTIONS.champion),
			};
		},
	},
	Vayne: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
		},
	},
	Veigar: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			};
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
		setupData(self): { passiveAbilityUpgradesMask: number } {
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
	Volibear: {
		MAX_PASSIVE_STACKS: 5,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Volibear.MAX_PASSIVE_STACKS),
			};
		},
	},
	MonkeyKing: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'MonkeyKing'>): number => (self.champion.value! as typeof IMonkeyKing).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.MonkeyKing.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Yasuo: {
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
	},
	Yone: {
		q: {
			dataOverrides: {
				isImmobilizing: false,
			},
		},
	},
	Zaahen: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Zaahen'>): number => (self.champion.value! as typeof IZaahen).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Zaahen.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Zilean: {
		variables: defineChampionVariables<'Zilean', typeof IZilean>({
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
	= IProviderGroupDataSetup<Id>
		& {
			[AbilityKey in IChampionAbilityKey]?: IChampionAbilitySpecific<Id>;
		} & {
			variables?: ISpecificVariables<string, string, Id, 'championAbility'>;
			calculateHooks?: ICalculateChampionStatsHookSource<Id>;
			[key: string]: any;
		};

export interface IChampionAbilitySpecific<Id extends IChampionId | undefined = undefined> {
	variables?: ISpecificVariables<string, string, Id, 'championAbility'>;
	dataOverrides?: IChampionAbilityVariantDataOverrides;
	/**
	 * ability's variant specific
	 * something like `CHAMPION_SPECIFICS.Amumu.passive[0]` would be for variant 0 of Amumu's passive
	 */
	[key: number]: IChampionAbilityVariantSpecific;
};

export type IChampionAbilityVariantSpecific = IProviderGroupImageText & {
	dataOverrides?: IChampionAbilityVariantDataOverrides;
};

interface IChampionAbilityVariantDataOverrides {
	isImmobilizing?: boolean;
}

/** wrapper around `defineVariables` for types on champion specific's variables */
export function defineChampionVariables<
	Id extends IChampionId,
	T = never,
	AbilityKey extends IChampionAbilityKey = IChampionAbilityKey,
	DetectedVariables extends string = DetectChampionVariables<T, AbilityKey>,
>(
	config: Omit<ISpecificVariables<DetectedVariables, string, Id, 'championAbility'>, 'default'>,
): ISpecificVariables<DetectedVariables, string, Id, 'championAbility'> {
	return defineVariables(config);
}
