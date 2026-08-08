import type { TMiscData } from '@lolcalc/data';
import type IAphelios from '@lolcalc/data/files/champion/Aphelios.json';
import type IBard from '@lolcalc/data/files/champion/Bard.json';
import type IBriar from '@lolcalc/data/files/champion/Briar.json';
import type ICassiopeia from '@lolcalc/data/files/champion/Cassiopeia.json';
import type IEvelynn from '@lolcalc/data/files/champion/Evelynn.json';
import type IEzreal from '@lolcalc/data/files/champion/Ezreal.json';
import type IFiora from '@lolcalc/data/files/champion/Fiora.json';
import type IIrelia from '@lolcalc/data/files/champion/Irelia.json';
import type IJax from '@lolcalc/data/files/champion/Jax.json';
import type IKaisa from '@lolcalc/data/files/champion/Kaisa.json';
import type IKalista from '@lolcalc/data/files/champion/Kalista.json';
import type IKayle from '@lolcalc/data/files/champion/Kayle.json';
import type IKayn from '@lolcalc/data/files/champion/Kayn.json';
import type IKSante from '@lolcalc/data/files/champion/KSante.json';
import type IMonkeyKing from '@lolcalc/data/files/champion/MonkeyKing.json';
import type INaafiri from '@lolcalc/data/files/champion/Naafiri.json';
import type INami from '@lolcalc/data/files/champion/Nami.json';
import type INasus from '@lolcalc/data/files/champion/Nasus.json';
import type IOrianna from '@lolcalc/data/files/champion/Orianna.json';
import type IOrnn from '@lolcalc/data/files/champion/Ornn.json';
import type IRammus from '@lolcalc/data/files/champion/Rammus.json';
import type IRell from '@lolcalc/data/files/champion/Rell.json';
import type IRyze from '@lolcalc/data/files/champion/Ryze.json';
import type ISeraphine from '@lolcalc/data/files/champion/Seraphine.json';
import type ISivir from '@lolcalc/data/files/champion/Sivir.json';
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
import type { IGameVariableValueParameters } from '../variables/game.ts';
import type { IControlEffectProps, IDefineVariablesConfig, IDeriveProgressFn, IExtractExtraVariables, ISpecificVariables, IVariableValueResult } from './index';
import { MISC } from '@lolcalc/data';
import { ALL_CHAMPION_STATS_ENTRIES, ITEM_NAME_TO_ID, VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { computed, watch } from 'vue';
import { combineCompounding } from '../calculate/util.ts';
import { championAbilityVariableValue, VARIABLE_CALCULATION_FNS } from '../variables/game.ts';
import { defineVariables, HOOK_PRIORITIES, ITEM_SPECIFICS_SHARED } from './index.ts';

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
		variables: defineChampionVariables<'Aphelios', typeof IAphelios>()({
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
		setupData(self) {
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
			variables: defineChampionVariables<'Aphelios', typeof IAphelios, 'e'>()({
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
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), 1),
			};
		},
	},
	Briar: {
		calculateHooks: {
			postTotal: {
				handler(self, { bonusStats, totalStats }, { calculatedVariables }) {
					const currentHpPercent = self.currentHealth.value / totalStats.hp;
					const missingHealthPercent = (1 - currentHpPercent) * 100;

					const healingMultVar = championAbilityVariableValue('TotalHealPerMissingHPPercentTooltip', { abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { stats: { value: { bonus: bonusStats } } } as DamageSource });
					const { calculatesFrom } = healingMultVar;

					if (typeof calculatesFrom?.[0]?.value !== 'number' || typeof calculatesFrom?.[1]?.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS briar] failed to calculate passive healing multiplier', healingMultVar);

						return;
					}

					calculatedVariables.briarHealingMult = calculatesFrom[0].value * missingHealthPercent / 10_000 + (bonusStats.hp / 100) * missingHealthPercent * calculatesFrom[1].value / 100;

					calculatedVariables.hpRegenMult = combineCompounding(calculatedVariables.hpRegenMult, calculatedVariables.briarHealingMult);
					/* TODO not sure if that's the appropriate scaling for it test what heals Briar receives in game */
					calculatedVariables.healMult = combineCompounding(calculatedVariables.healMult, calculatedVariables.briarHealingMult);
				},
				priority: HOOK_PRIORITIES.postTotal.Briar,
			},
		},
		passive: {
			variables: defineChampionVariables<'Briar', typeof IBriar, 'passive'>()({
				uninteresting: ['BleedDuration', 'MaxBleedStacks', 'HealPercent', 'CurrentHealthPercentCost', 'PercentOfBleedHealedOnKill'],
			}),
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
	Darius: {
		setupData(self) {
			return {
				isChampionAtMaxBleed: clamp(0, Math.round(self.internalData.value.isChampionAtMaxBleed ?? 0), 1),
			};
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
	},
	Jhin: {
		setupData(self) {
			return {
				isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
			};
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
			return {
				// TODO skaarl hp, Q variant, disabled E & R when dismounted
				isDismounted: clamp(0, Math.round(self.internalData.value.isDismounted ?? 0), 1),
			};
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
				passiveMSTotalAp: Math.max(0, Math.round(self.internalData.value.passiveMSTotalAp ?? 0)),
			};
		},
		passive: {
			effectControls: {
				model: self => computed({
					get() {
						return self.internalData.value.passiveMSTotalAp !== undefined;
					},
					set(value) {
						self.internalData.value.passiveMSTotalAp = value ? self.stats.value.total.abilityPower : undefined;
						console.log('set', value, self.internalData.value);
					},
				}),
				refresh(self) {
					console.log('refreshing', self.stats.value.total.abilityPower, self.internalData.value);
				},
			},
			calculateBonusMS: ((progress, self) => {
				const bonusMS = championAbilityVariableValue('TotalMSBonus', {
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				console.log('calcaulting bonus ms with', { progress, ap: self.stats.value.total.abilityPower }, bonusMS);

				// if (typeof bonusMS.value === 'number') {
				// 	return bonusMS.value * progress / 100;
				// }

				// console.warn('[CHAMPION_SPECIFICS namie] failed to calculate passive bonus MS', bonusMS);
				// return Number.NaN;
				return 42;
			}) satisfies IDeriveProgressFn,
			variables: defineChampionVariables<'Nami', typeof INami, 'passive'>()({
				known: {
					BonusMS: [],
				},
				calculate(self) {
					// TODO is incorrect in results copy, also calc should be in postTotal
					return {
						BonusMS: {
							value: self.stats.value.championPassive.moveSpeed,
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
					console.log('namiying', { ...self.internalData.value });
					// const bonusMS = CHAMPION_SPECIFICS.Nami.PASSIVE_BONUS_MS(self.internalData.value.passiveMSProgress, { champion: self.champion, stats: { value: { total: { abilityPower: 18 } } } } as DamageSource);
					// if (!Number.isNaN(bonusMS)) {
					// 	championPassiveStats.moveSpeed = bonusMS;
					// }
					championPassiveStats.moveSpeed = 0;
				},
			},
		},
	},
	Nasus: {
		WITHER_MS_SLOW: ((progress, self) => {
			const wParams: IGameVariableValueParameters['championAbility'] = {
				abilityVariant: self.champion.value!.abilities.w.variants[0]!,
				abilityLevel: self.abilityLevels.value.w || 1,
				damageSource: self,
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
		}) satisfies IDeriveProgressFn,
		setupData(self) {
			return {
				wProgress: clamp(0, Math.round(self.internalData.value.wProgress ?? 0), 100),
			};
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
		w: {
			variables: defineChampionVariables<'Nasus', typeof INasus, 'w'>()({
				known: {
					AttackSpeedSlow: [],
					MoveSpeedSlow: [],
				},
				calculate(self) {
					const msSlow: number = CHAMPION_SPECIFICS.Nasus.WITHER_MS_SLOW(self.internalData.value.wProgress, self);
					const msToASSlowRatio = championAbilityVariableValue('AttackSpeedSlowMult', {
						abilityVariant: self.champion.value!.abilities.w.variants[0]!,
						abilityLevel: self.abilityLevels.value.w,
						damageSource: self,
					});

					if (typeof msToASSlowRatio.value === 'number') {
						return {
							MoveSpeedSlow: {
								value: msSlow,
							},
							AttackSpeedSlow: {
								value: msSlow * msToASSlowRatio.value,
							},
						};
					}

					console.warn('[CHAMPION_SPECIFICS nasus] failed to calculate W ms to as slow ratio', msToASSlowRatio);
					return {
						MoveSpeedSlow: {
							value: msSlow,
						},
						AttackSpeedSlow: { value: Number.NaN },
					};
				},
				meta: {
					AttackSpeedSlow: {
						isCustom: true,
						resultsIsPercentage: true,
					},
					MoveSpeedSlow: {
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
		variables: defineChampionVariables<'Ornn', typeof IOrnn>()({
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
		setupData(self) {
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
			variables: defineChampionVariables<'Rammus', typeof IRammus, 'w'>()({
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
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Rell.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), maxStacks),
			};
		},
	},
	Rengar: {
		MAX_PASSIVE_STACKS: 5,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Rengar.MAX_PASSIVE_STACKS;
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
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
		setupData(self) {
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
		variables: defineChampionVariables<'Ryze', typeof IRyze>()({
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
			};
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
	Volibear: {
		MAX_PASSIVE_STACKS: 5,
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Volibear.MAX_PASSIVE_STACKS;
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
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
		setupData(self) {
			const maxStacks: number = CHAMPION_SPECIFICS.Zaahen.MAX_PASSIVE_STACKS(self);
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
			};
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
			[key: string]: any;
		};

export interface IChampionAbilitySpecific<Id extends IChampionId | undefined = undefined> {
	variables?: ISpecificVariables<any, any, Id, 'championAbility'>;
	dataOverrides?: IChampionAbilityVariantDataOverrides;
	effectControls?: IControlEffectProps<Id>;
	[key: string]: any;
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

export interface IChampionInternalDataMap {
	TargetDummy: IChampionStats;
	Ambessa: { hasPassiveStack: number };
	Amumu: { applyPassive: number };
	Anivia: { isEgg: number };
	Aphelios: IDamageSourceInternalDataBase;
	AurelionSol: { passiveStacks: number };
	Bard: { passiveStacks: number; chimeMoveSpeed: number };
	Belveth: { passiveStacks: number; hasPassiveStack: number };
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
	Kled: { isDismounted: number };
	LeeSin: { hasPassiveStack: number };
	Mordekaiser: { isPassiveMSActive: number };
	Naafiri: { passiveStacks: number } & IDamageSourceInternalDataBase;
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
	Ornn: { _masterworkLevel: number; masterworkItemSlot: number; passiveUpgradedAllies: number } & IDamageSourceInternalDataBase;
	Rammus: { defensiveCurl: number };
	Rell: { passiveStacksOnTarget: number };
	Rengar: { passiveStacks: number; isPassiveMSActive: number };
	Rumble: { isOverheated: number };
	Samira: { passiveStacks: number };
	Sejuani: { isPassiveActive: number };
	Senna: { passiveStacks: number };
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
