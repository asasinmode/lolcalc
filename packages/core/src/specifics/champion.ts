import type IKarma from '@lolcalc/data/files/champion/Karma.json';
import type IKayle from '@lolcalc/data/files/champion/Kayle.json';
import type IKayn from '@lolcalc/data/files/champion/Kayn.json';
import type IKhazix from '@lolcalc/data/files/champion/Khazix.json';
import type IKled from '@lolcalc/data/files/champion/Kled.json';
import type IKSante from '@lolcalc/data/files/champion/KSante.json';
import type ILocke from '@lolcalc/data/files/champion/Locke.json';
import type IMel from '@lolcalc/data/files/champion/Mel.json';
import type INaafiri from '@lolcalc/data/files/champion/Naafiri.json';
import type INami from '@lolcalc/data/files/champion/Nami.json';
import type INasus from '@lolcalc/data/files/champion/Nasus.json';
import type INidalee from '@lolcalc/data/files/champion/Nidalee.json';
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
import type IShen from '@lolcalc/data/files/champion/Shen.json';
import type IShyvana from '@lolcalc/data/files/champion/Shyvana.json';
import type ISivir from '@lolcalc/data/files/champion/Sivir.json';
import type ISona from '@lolcalc/data/files/champion/Sona.json';
import type ISyndra from '@lolcalc/data/files/champion/Syndra.json';
import type ITwistedFate from '@lolcalc/data/files/champion/TwistedFate.json';
import type IVarus from '@lolcalc/data/files/champion/Varus.json';
import type IVeigar from '@lolcalc/data/files/champion/Veigar.json';
import type IVladimir from '@lolcalc/data/files/champion/Vladimir.json';
import type { IChampion, IChampionAbilityVariant, IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IChampionStats } from '@lolcalc/shared';
import type { ComputedRef } from 'vue';
import type { DamageSource, ICalculateChampionStatsHookSource, IEffectOntoTargetVarsHook, IProviderGroupDataSetup, IProviderGroupImageText } from '../DamageSource';
import type { DetectChampionVariables } from '../types';
import type { IGameVariableValueParameters } from '../variables/game.ts';
import type { IDeriveProgressFn, IEffectControlsProps, IExtraInactiveFn, ISpecificVariables, IVariableValueResult } from './index';
import { STAT_ICON } from '@lolcalc/data';
import { ALL_CHAMPION_STATS_ENTRIES, EffectObjectName, VariableType } from '@lolcalc/shared';
import { clamp, roundNumber } from '@lolcalc/shared/utils.ts';
import { computed, watch } from 'vue';
import { calculatesFromPartExtendedEquals, championAbilityVariableValue, VARIABLE_CALCULATION_FNS } from '../variables/game.ts';
import Akali from './champion/Akali.ts';
import Akshan from './champion/Akshan.ts';
import Ambessa from './champion/Ambessa.ts';
import Amumu from './champion/Amumu.ts';
import Anivia from './champion/Anivia.ts';
import Aphelios from './champion/Aphelios.ts';
import Ashe from './champion/Ashe.ts';
import AurelionSol from './champion/AurelionSol.ts';
import Bard from './champion/Bard.ts';
import Belveth from './champion/Belveth.ts';
import Briar from './champion/Briar.ts';
import Cassiopeia from './champion/Cassiopeia.ts';
import Chogath from './champion/Chogath.ts';
import Darius from './champion/Darius.ts';
import Diana from './champion/Diana.ts';
import Draven from './champion/Draven.ts';
import DrMundo from './champion/DrMundo.ts';
import Ekko from './champion/Ekko.ts';
import Elise from './champion/Elise.ts';
import Evelynn from './champion/Evelynn.ts';
import Ezreal from './champion/Ezreal.ts';
import Fiora from './champion/Fiora.ts';
import Gangplank from './champion/Gangplank.ts';
import Garen from './champion/Garen.ts';
import Gnar from './champion/Gnar.ts';
import Hecarim from './champion/Hecarim.ts';
import Heimerdinger from './champion/Heimerdinger.ts';
import Hwei from './champion/Hwei.ts';
import Irelia from './champion/Irelia.ts';
import JarvanIV from './champion/JarvanIV.ts';
import Jax from './champion/Jax.ts';
import Jayce from './champion/Jayce.ts';
import Jhin from './champion/Jhin.ts';
import Jinx from './champion/Jinx.ts';
import Kaisa from './champion/Kaisa.ts';
import Kalista from './champion/Kalista.ts';
import MonkeyKing from './champion/MonkeyKing.ts';
import Yasuo from './champion/Yasuo.ts';
import Yone from './champion/Yone.ts';
import Zaahen from './champion/Zaahen.ts';
import Zeri from './champion/Zeri.ts';
import Zilean from './champion/Zilean.ts';
import { HOOK_PRIORITIES } from './index.ts';

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
	Akali,
	Akshan,
	Ambessa,
	Amumu,
	Anivia,
	Aphelios,
	Ashe,
	AurelionSol,
	Bard,
	Belveth,
	Briar,
	Cassiopeia,
	Chogath,
	DrMundo,
	Darius,
	Diana,
	Draven,
	Ekko,
	Elise,
	Evelynn,
	Ezreal,
	Fiora,
	Garen,
	Gangplank,
	Gnar,
	Hecarim,
	Heimerdinger,
	Hwei,
	Irelia,
	JarvanIV,
	Jax,
	Jayce,
	Jhin,
	Jinx,
	Kaisa,
	Kalista,
	Karma: {
		setupData(self) {
			self.abilityLevels.value.r ||= 1;
			return {} as never;
		},
		variables: defineChampionVariables<'Karma', typeof IKarma>()({
			known: {
				IsEmpowered: [0, 1],
			},
			calculate() {
				return {
					IsEmpowered: {
						value: 0,
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
					const attackSpeedPerStack = championAbilityVariableValue('EnrageTotalASPerStack', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
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
			calculate(self) {
				return {
					f1: {
						value: self.internalData.value.form,
					},
				};
			},
		}),
		passive: {
			variables: defineChampionVariables<'Kayn', typeof IKayn, 'passive'>()({
				uninteresting: ['PassiveSecondFormDelayTooltip', 'PAmpDurationAss', 'PAmpCooldownAss'],
			}),
		},
	},
	Khazix: {
		MAX_PASSIVE_UPGRADES_MASK: 2 ** 4,
		setupData(self) {
			const rEvolvesMask: number = clamp(0, Math.round(self.internalData.value.rEvolvesMask ?? 0), CHAMPION_SPECIFICS.Khazix.MAX_PASSIVE_UPGRADES_MASK);

			return {
				rEvolvesMask,
			};
		},
		q: {
			variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
				known: {
					IsEvolved: [0, 1],
				},
				calculate(self) {
					return {
						IsEvolved: {
							value: self.internalData.value.rEvolvesMask ^ 0,
						},
					};
				},
			}),
		},
		w: {
			variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
				known: {
					IsEvolved: [0, 1],
				},
				calculate(self) {
					return {
						IsEvolved: {
							value: self.internalData.value.rEvolvesMask ^ 0,
						},
					};
				},
			}),
		},
		e: {
			variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
				known: {
					IsEvolved: [0, 1],
				},
				calculate(self) {
					return {
						IsEvolved: {
							value: self.internalData.value.rEvolvesMask ^ 0,
						},
					};
				},
			}),
		},
		r: {
			variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
				known: {
					IsEvolved: [0, 1],
				},
				calculate(self) {
					return {
						IsEvolved: {
							value: self.internalData.value.rEvolvesMask ^ 0,
						},
					};
				},
			}),
		},
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
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };

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
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value }, stats: { value: { bonus: { hp: bonusStats.hp } } } } as DamageSource };

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
						abilityKey: 'passive',
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
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };
					const minDamage = championAbilityVariableValue('MinOnHitDamage', passiveParams);
					const maxDamage = championAbilityVariableValue('MaxOnHitDamage', passiveParams);
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
	Mel: {
		passive: {
			variables: defineChampionVariables<'Mel', typeof IMel, 'passive'>()({
				meta: {
					PassiveFlatDamage: {
						type: VariableType.magic,
					},
					PassiveStackDamage: {
						type: VariableType.magic,
					},
					PassiveBonusMissileDamage: {
						type: VariableType.magic,
					},
				},
				/* minion mod is from R */
				uninteresting: ['MinionModTooltip' as any, 'PassiveBonusMissiles', 'MaxPassiveBonusMissiles', 'OverwhelmDuration'],
			}),
		},
		q: {
			variables: defineChampionVariables<'Mel', typeof IMel, 'q'>()({
				meta: {
					InitialExplosionDamage: {
						type: VariableType.magic,
					},
					TotalExplosionDamage: {
						type: VariableType.magic,
					},
					AllDamageHit: {
						type: VariableType.magic,
						scalesWithStatIcon: undefined,
						/* on patch 26.19 different from what the game shows `= (60 const + (0.55 %i:ap%) + 29.5 const)` but I think it's better */
						extendedEquals(variableValueParams) {
							const projectiles = championAbilityVariableValue('ExplosionCount', variableValueParams);
							const base = championAbilityVariableValue('InitialExplosionDamage', variableValueParams);
							const followup = championAbilityVariableValue('TotalExplosionDamage', variableValueParams);
							const projectilesCount = (projectiles.value as number) - 1;

							const constPart = (base.calculatesFrom?.[0]?.value as number) + (followup.calculatesFrom?.[0]?.value as number) * projectilesCount;
							const apPart = (base.calculatesFrom?.[1]?.value as number) + (followup.calculatesFrom?.[1]?.value as number) * projectilesCount;

							return `${calculatesFromPartExtendedEquals({ value: constPart, stat: 'const' })} + ${calculatesFromPartExtendedEquals({ value: apPart, stat: 'abilityPower', isPercentage: true })}`;
						},
					},
				},
				uninteresting: ['ExplosionCount'],
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
								abilityKey: 'passive',
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
					abilityKey: 'passive',
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
					abilityKey: 'w',
					abilityVariant: champion.abilities.w.variants[0]!,
					abilityLevel: wLevel,
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
						abilityKey: 'passive',
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
				abilityKey: 'w',
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
		PassiveOptions: {
			none: 0,
			justBush: 1,
			towardsChampion: 2,
		},
		setupData(self) {
			const maxPassive: number = CHAMPION_SPECIFICS.Nidalee.PassiveOptions.towardsChampion;
			self.abilityLevels.value.r ||= 1;
			return {
				passiveVariantActive: clamp(0, Math.round(self.internalData.value.passiveVariantActive ?? 0), maxPassive),
			};
		},
		passive: {
			preplaceTooltipText(value) {
				/** use a custom var for hunting ms, otherwise it's displayed as `30%` always and in places where the tooltip shows `10%` */
				return value.replaceAll('spell.AspectOfTheCougar:PassivePercentMS*3', 'HuntingPercentMS');
			},
			modifyVariantData(abilityVariant) {
				/* game doesn't show it, maybe a leftover from some previous patch */
				abilityVariant.tooltipExtended = undefined;
			},
			variables: defineChampionVariables<'Nidalee', typeof INidalee, 'passive'>()({
				known: {
					HuntingPercentMS: [],
				},
				calculate(self) {
					const msVariable = championAbilityVariableValue('PassivePercentMS', { abilityKey: 'r', abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.r, damageSource: self });
					(msVariable.value as number) *= 3;

					return {
						HuntingPercentMS: msVariable,
					};
				},
			}),
		},
		w: {
			0: {
				/* add a variable used in MaxTraps formula but not saved in the data because the original value is empty and is override only for arena */
				modifyVariantData(abilityVariant) {
					abilityVariant.dataValues ??= {};
					abilityVariant.dataValues.ModesBonusMaxTraps = Array.from({ length: 7 }).fill(0);
				},
			},
		},
		calculateHooks: {
			postInit: {
				handler(self, { baseStats }) {
					const { q, w, e } = self.abilityVariantsIndexes.value;

					if (q & w & e) {
						/* doesn't seem to be in a variable */
						baseStats.attackRange = 125;
					}
				},
			},
			onChampionPassive: {
				handler(self, _stats, { calculatedVariables }) {
					if (!self.internalData.value.passiveVariantActive) {
						return;
					}

					const msVariable = championAbilityVariableValue('PassivePercentMS', { abilityKey: 'r', abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.r, damageSource: self });
					let bonusMS = 0;

					if (typeof msVariable.value === 'number') {
						bonusMS = msVariable.value * 0.01;
					} else {
						console.warn('[CHAMPION_SPECIFICS nidalee] failed to calculate passive move speed');
					}

					if (self.internalData.value.passiveVariantActive === CHAMPION_SPECIFICS.Nidalee.PassiveOptions.towardsChampion) {
						bonusMS *= 3;
					}

					calculatedVariables.totalBonusPercentMoveSpeed += bonusMS;
				},
			},
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
				const moveSpeed = championAbilityVariableValue('MSIncrease', { abilityKey: 'passive', abilityVariant: champion.abilities.passive.variants[0]! });
				const attackSpeed = championAbilityVariableValue('ASIncrease', { abilityKey: 'passive', abilityVariant: champion.abilities.passive.variants[0]! });

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
					? clamp(-1, Math.round(self.internalData.value.masterworkItemSlot ?? 1), 6)
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
			postItemTotal: {
				handler(self, { championPassiveStats, itemPassivesStats, itemTotalStats, totalMultipliersStats }, { calculatedVariables }) {
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self };
					const baseStatAmp = championAbilityVariableValue('BaseStatAmp', passiveParams);
					const additionalStatAmp = championAbilityVariableValue('AdditionalMythicStatAmp', passiveParams);

					if (typeof baseStatAmp.value === 'number' && typeof additionalStatAmp.value === 'number') {
						calculatedVariables.ornnPassiveStatAmp = baseStatAmp.value
							+ additionalStatAmp.value * (self.internalData.value.passiveUpgradedAllies
								+ (~self.internalData.value.masterworkItemSlot && (self.level.value >= CHAMPION_SPECIFICS.Ornn.MASTERWORK_LEVEL(self)) ? 1 : 0));
					} else {
						console.warn('[CHAMPION_SPECIFICS ornn] failed to calculate passive stat amps', baseStatAmp, additionalStatAmp);
					}

					if (!calculatedVariables.ornnPassiveStatAmp) {
						return;
					}

					championPassiveStats.hp = itemTotalStats.hp * calculatedVariables.ornnPassiveStatAmp;
					totalMultipliersStats.hp += championPassiveStats.hp;

					if (championPassiveStats.hp && calculatedVariables.riftmakerBonusHPToAP) {
						const ap = championPassiveStats.hp * calculatedVariables.riftmakerBonusHPToAP;
						calculatedVariables.riftmakerVoidInfusion! += ap;
						calculatedVariables.apMultipliersBase += ap;
						calculatedVariables.additionalAdaptiveForceCheckAp -= ap;
						itemPassivesStats.abilityPower += ap;
						itemTotalStats.abilityPower += ap;
					}
				},
				priority: HOOK_PRIORITIES.postItemTotal.Ornn,
			},
			onTotalPreMultipliers: {
				handler(_self, { championPassiveStats, bonusStats, runeShardStats, itemPassivesStats, itemTotalStats, totalMultipliersStats, totalPreMultipliersStats }, { calculatedVariables }) {
					if (!calculatedVariables.ornnPassiveStatAmp) {
						return;
					}

					/* this hp was already added to bonus from `championPassiveStats.hp` set in `preItemTotal` hook. Remove it so it's not doubled */
					bonusStats.hp -= championPassiveStats.hp!;
					totalPreMultipliersStats.hp -= championPassiveStats.hp!;

					const hp = (runeShardStats.hp ?? 0) * calculatedVariables.ornnPassiveStatAmp;
					championPassiveStats.hp! += hp;
					totalMultipliersStats.hp += hp;

					if (hp && calculatedVariables.riftmakerBonusHPToAP) {
						const ap = hp * calculatedVariables.riftmakerBonusHPToAP;
						calculatedVariables.riftmakerVoidInfusion! += ap;
						calculatedVariables.apMultipliersBase += ap;
						itemPassivesStats.abilityPower += ap;
						itemTotalStats.abilityPower += ap;
						bonusStats.abilityPower += ap;
						totalPreMultipliersStats.abilityPower += ap;

						if (calculatedVariables.rabadonApMultiplier) {
							const value = ap * calculatedVariables.rabadonApMultiplier;
							calculatedVariables.rabadonMagicalOpus! += value;
							itemPassivesStats.abilityPower += value;
							itemTotalStats.abilityPower += value;
							bonusStats.abilityPower += value;
							totalPreMultipliersStats.abilityPower += value;
						}

						if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
							const value = ap * calculatedVariables.blackfireTorchBBlazeMultiplier;
							calculatedVariables.blackfireTorchBBlazeAP! += value;
							itemPassivesStats.abilityPower += value;
							itemTotalStats.abilityPower += value;
							bonusStats.abilityPower += value;
							totalPreMultipliersStats.abilityPower += value;
						}
					}

					championPassiveStats.armor = bonusStats.armor * calculatedVariables.ornnPassiveStatAmp;
					totalMultipliersStats.armor += championPassiveStats.armor;

					championPassiveStats.magicResist = bonusStats.magicResist * calculatedVariables.ornnPassiveStatAmp;
					totalMultipliersStats.magicResist += championPassiveStats.magicResist;
				},
				priority: 1,
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
				handler(self, { championPassiveStats, itemPassivesStats, itemBaseStats }, { calculatedVariables }) {
					const hpToAd = championAbilityVariableValue('HPPerBAD', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });

					if (typeof hpToAd.value === 'number') {
						calculatedVariables.pykePassiveHpToAd = hpToAd.value;
						const bonusHp = (itemBaseStats.hp + itemPassivesStats.hp);
						championPassiveStats.attackDamage = bonusHp / calculatedVariables.pykePassiveHpToAd;

						itemBaseStats.hp = 0;
						itemPassivesStats.hp = 0;
					} else {
						console.warn('[CHAMPION_SPECIFICS pyke] failed to calculate passive hp to ad', hpToAd);
						calculatedVariables.pykePassiveHpToAd = 0;
					}
				},
				priority: HOOK_PRIORITIES.preItemTotal.Pyke,
			},
			preBonus: {
				handler(_self, { runeShardStats, championPassiveStats }, { calculatedVariables }) {
					if (runeShardStats.hp) {
						championPassiveStats.attackDamage! += runeShardStats.hp / calculatedVariables.pykePassiveHpToAd!;
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
				handler(self, { totalStats, totalPreMultipliersStats, totalMultipliersStats, dragonStatMultipliers, championPassiveStats, bonusStats }, { calculatedVariables, debuffs }) {
					let wBonusArmor: IVariableValueResult['value'] = 0;
					let wBonusMr: IVariableValueResult['value'] = 0;
					if (self.internalData.value.defensiveCurl) {
						const wParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'w', abilityVariant: (self.champion.value as typeof IRammus).abilities.w.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.w, damageSource: { stats: { value: { total: totalStats } } } as DamageSource };
						/* rammus W bonus resists consist of a base value + a % of total armor, however this % also applies to base
						 * i.e base 20 + 50% armor = (20 * 1.5) + armor * 0.5
						 * so get that base & multiplier from tooltip variables' calculatesFrom
						 */
						const { calculatesFrom: armorCalculatesFrom } = championAbilityVariableValue('BonusArmorTooltip', wParams);
						const { calculatesFrom: mrCalculatesFrom } = championAbilityVariableValue('BonusMRTooltip', wParams);

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

					const bonusAd = championAbilityVariableValue('TotalDamage', { abilityKey: 'passive', abilityVariant: (self.champion.value as typeof IRammus).abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { stats: { value: { total: totalStats } } } as DamageSource });

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
				const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: champion.abilities.passive.variants[0]!, damageSource: { level: { value: level } } as DamageSource };
				const minResistsSteal = championAbilityVariableValue('StealFloor', passiveParams);
				const stackStealPercent = championAbilityVariableValue('StealPercent', passiveParams);
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
			const stealPercent = championAbilityVariableValue('StealPercent', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]! });
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
					if (self.internalData.value.isPassiveMSActive) {
						const bonusMS = championAbilityVariableValue('EmpoweredMS', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });
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
							value: self.stats.value.variables.ryzePMana ?? 0,
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
				handler(self, { totalStats, bonusStats, itemPassivesStats, itemTotalStats, championPassiveStats, dragonStats, dragonStatMultipliers }, { calculatedVariables }) {
					const apToMana = championAbilityVariableValue(
							'PercentManaIncrease' satisfies DetectChampionVariables<typeof IRyze, 'passive'>,
							{
								abilityKey: 'passive',
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
					calculatedVariables.ryzePMana = passiveMana;

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
					const passiveVarParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };

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
				handler(self, { championPassiveStats }, { calculatedVariables }) {
					const params: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };

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
						return;
					}

					const sennaPassiveStacksStep = Math.floor(self.internalData.value.passiveStacks / stacksStep.value);

					const rangePerStep = championAbilityVariableValue('BonusRange', params);
					if (typeof rangePerStep.value === 'number') {
						championPassiveStats.attackRange = rangePerStep.value * sennaPassiveStacksStep;
					} else {
						console.warn('[CHAMPION_SPECIFICS senna] failed to calculate passive range per step', rangePerStep);
					}

					const critPerStep = championAbilityVariableValue('BonusCritChance', params);
					if (typeof critPerStep.value === 'number') {
						championPassiveStats.critChance = critPerStep.value * sennaPassiveStacksStep / 100;
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
					const params: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };

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
	Shen: {
		passive: {
			variables: defineChampionVariables<'Shen', typeof IShen, 'passive'>()({
				known: {
					'{7dfdcd99}': [],
				},
				calculate() {
					return {
						/* originally a buff indicating shen has won his nemesis quest vs zed */
						'{7dfdcd99}': {
							value: 0,
						},
					};
				},
				meta: {
					ShieldValue: {
						type: VariableType.shield,
					},
				},
				uninteresting: ['ShieldDuration', 'ShieldCooldown'],
			}),
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
					const params: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };
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
				abilityKey: 'passive',
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
		w: {
			variables: defineChampionVariables<'Syndra', typeof ISyndra, 'w'>()({
				known: {
					f2: [],
					f3: [0, 1],
				},
				calculate(self) {
					let f3 = Number.NaN;
					const wUpgradeThreshold = championAbilityVariableValue('WUpgradeThreshold', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self });

					if (typeof wUpgradeThreshold.value === 'number') {
						f3 = self.internalData.value.passiveStacks >= wUpgradeThreshold.value ? 1 : 0;
					} else {
						console.warn('[CHAMPION_SPECIFICS syndra] failed to calculate w upgrade threshold', wUpgradeThreshold);
					}

					return {
						f2: championAbilityVariableValue('SlowDuration', { abilityKey: 'w', abilityVariant: self.champion.value!.abilities.w.variants[0]!, damageSource: self }),
						f3: {
							value: f3,
						},
					};
				},
				meta: {
					f2: {
						displayedName: 'SlowDuration',
						type: VariableType.affectedByTenacity,
						roundReplaced: 2,
					},
				},
			}),
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
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };

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
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };

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
					const qParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'q', abilityVariant: self.champion.value!.abilities.q.variants[0]!, damageSource: self };
					const baseHeal = championAbilityVariableValue('EmpoweredHealTooltip', qParams);
					const percentMissing = championAbilityVariableValue('EmpoweredHealPercentTooltip', qParams);
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
			modifyVariantData(abilityVariant) {
				if (abilityVariant.extendedVariables) {
					const damageVariable = abilityVariant.extendedVariables[0];
					if (damageVariable?.name !== 'BaseDamage') {
						console.warn('[CHAMPION_SPECIFICS vladimir r] failed to modify extended variables, no base damage variable', abilityVariant.extendedVariables);
						return;
					}
					abilityVariant.extendedVariables.push({
						name: damageVariable.name,
						nameOverride: 'spell_listtype_healing',
					});
				}
			},
			variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'r'>()({
				known: {
					Heal: [],
				},
				calculate(self) {
					return {
						Heal: championAbilityVariableValue('Damage', { abilityKey: 'r', abilityVariant: self.champion.value!.abilities.r.variants[0]!, damageSource: self }),
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
				handler(self, { totalStats, bonusStats, dragonStatMultipliers, championPassiveStats, itemPassivesStats, itemTotalStats, totalMultipliersStats, dragonStats }, { calculatedVariables }) {
					const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]! };
					const hpToAp = championAbilityVariableValue('HPforAP', passiveParams);
					const apToHp = championAbilityVariableValue('APRatioBonusHP', passiveParams);

					if (typeof hpToAp.value !== 'number' || typeof apToHp.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS vladimir] failed to calculate passive ratios', hpToAp, apToHp);
						return;
					}

					const totalApMultiplier = calculatedVariables.totalItemApMultipliers + dragonStatMultipliers.abilityPower + calculatedVariables.midQuestMultiplier;

					const baseAP = bonusStats.hp / hpToAp.value;
					const riftmakerBonusHpToAp = calculatedVariables.riftmakerBonusHPToAP ?? 0;
					const hpAPBase = totalStats.abilityPower + baseAP * (totalApMultiplier - 1);
					const passiveHP = (hpAPBase * apToHp.value) / (1 - riftmakerBonusHpToAp * totalApMultiplier * apToHp.value);

					/* not tracking stats to `totalPreMultipliersStats`, which maybe should be done but don't really know if anything else I'm trying to track below makes sense. Revisit if there are any issues */
					calculatedVariables.vladimirPassiveHp = passiveHP;
					calculatedVariables.apMultipliersBase += baseAP;
					championPassiveStats.hp = passiveHP;
					totalStats.hp += passiveHP;
					bonusStats.hp += passiveHP;

					let passiveAP = baseAP;
					championPassiveStats.abilityPower = passiveAP;
					calculatedVariables.vladimirPassiveAp = passiveAP;

					if (calculatedVariables.rabadonApMultiplier) {
						const value = baseAP * calculatedVariables.rabadonApMultiplier;
						calculatedVariables.rabadonMagicalOpus! += value;
						passiveAP += value;
						itemPassivesStats.abilityPower += value;
						itemTotalStats.abilityPower += value;
					}
					if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
						const value = baseAP * calculatedVariables.blackfireTorchBBlazeMultiplier;
						calculatedVariables.blackfireTorchBBlazeAP! += value;
						passiveAP += value;
						itemPassivesStats.abilityPower += value;
						itemTotalStats.abilityPower += value;
					}
					if (dragonStatMultipliers.abilityPower) {
						const value = baseAP * dragonStatMultipliers.abilityPower;
						passiveAP += value;
						dragonStats.abilityPower! += value;
						totalMultipliersStats.abilityPower += value;
					}
					if (calculatedVariables.midQuestMultiplier) {
						const value = baseAP * calculatedVariables.midQuestMultiplier;
						passiveAP += value;
						calculatedVariables.midQuestAp! += value;
						totalMultipliersStats.abilityPower += value;
					}

					totalStats.abilityPower += passiveAP;
					bonusStats.abilityPower += passiveAP;

					if (riftmakerBonusHpToAp) {
						const passiveHPInfusion = passiveHP * riftmakerBonusHpToAp;
						calculatedVariables.riftmakerVoidInfusion! += passiveHPInfusion;

						let riftmakerTotalAp = passiveHPInfusion;
						if (calculatedVariables.rabadonApMultiplier) {
							const value = passiveHPInfusion * calculatedVariables.rabadonApMultiplier;
							calculatedVariables.rabadonMagicalOpus! += value;
							riftmakerTotalAp += value;
						}
						if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
							const value = passiveHPInfusion * calculatedVariables.blackfireTorchBBlazeMultiplier;
							calculatedVariables.blackfireTorchBBlazeAP! += value;
							riftmakerTotalAp += value;
						}
						if (dragonStatMultipliers.abilityPower) {
							const value = passiveHPInfusion * dragonStatMultipliers.abilityPower;
							riftmakerTotalAp += value;
							dragonStats.abilityPower! += value;
							totalMultipliersStats.abilityPower += value;
						}
						if (calculatedVariables.midQuestMultiplier) {
							const value = passiveHPInfusion * calculatedVariables.midQuestMultiplier;
							riftmakerTotalAp += value;
							calculatedVariables.midQuestAp! += value;
							totalMultipliersStats.abilityPower += value;
						}

						itemPassivesStats.abilityPower += riftmakerTotalAp;
						itemTotalStats.abilityPower += riftmakerTotalAp;
						totalStats.abilityPower += riftmakerTotalAp;
						bonusStats.abilityPower += riftmakerTotalAp;
					}
				},
				priority: HOOK_PRIORITIES.postTotal.Vladimir,
			},
		},
	},
	Volibear,
	MonkeyKing,
	Yasuo,
	Yone,
	Zaahen,
	Zeri,
	Zilean,
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
	/** overrides for every ability's variant data */
	dataOverrides?: IChampionAbilityVariantDataOverrides;
	/** called in `scripts/updateData`, if present the tooltip text will be replaced with the value returned from this function. It's passed the original text */
	preplaceTooltipText?: (value: string) => string;
	/**
	 * called in `scripts/updateData` after ability variant's data is extracted (before resolving tooltip stringtable values)
	 * @note it's called for every variant of the ability, put it under variant index to run it only for that one
	 */
	modifyVariantData?: (
		abilityVariant: IChampionAbilityVariant,
		/** is the champion.bin.json file, merged with any additional characters */
		binData: any,
	) => void;
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
	modifyVariantData?: (abilityVariant: IChampionAbilityVariant) => void;
};

interface IChampionAbilityVariantDataOverrides {
	isImmobilizing?: boolean;
}

export interface IChampionInternalDataMap {
	TargetDummy: IChampionStats;
	Akali: { isPassiveMSActive: number };
	Ambessa: { hasPassiveStack: number };
	Amumu: { applyPassive: number };
	Anivia: { isEgg: number };
	Aphelios: { lastRotatedVariantIndex: number; gravitumSlowProgress: number };
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
	Jayce: { isPassiveMSActive: number };
	Jhin: { isPassiveMSActive: number };
	Jinx: { passiveStacks: number };
	Kaisa: { passiveStacksOnTarget: number; eBuff: number };
	Kayle: { passiveStacks: number };
	Kayn: { form: number };
	Kindred: { passiveStacks: number };
	Khazix: { rEvolvesMask: number };
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
