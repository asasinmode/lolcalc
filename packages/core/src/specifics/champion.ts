import type IAphelios from '@lolcalc/data/files/champion/Aphelios.json';
import type IAshe from '@lolcalc/data/files/champion/Ashe.json';
import type IBard from '@lolcalc/data/files/champion/Bard.json';
import type IBriar from '@lolcalc/data/files/champion/Briar.json';
import type ICassiopeia from '@lolcalc/data/files/champion/Cassiopeia.json';
import type IDrMundo from '@lolcalc/data/files/champion/DrMundo.json';
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
import type ILocke from '@lolcalc/data/files/champion/Locke.json';
import type IMonkeyKing from '@lolcalc/data/files/champion/MonkeyKing.json';
import type INaafiri from '@lolcalc/data/files/champion/Naafiri.json';
import type INami from '@lolcalc/data/files/champion/Nami.json';
import type INasus from '@lolcalc/data/files/champion/Nasus.json';
import type INunu from '@lolcalc/data/files/champion/Nunu.json';
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
import type IVladimir from '@lolcalc/data/files/champion/Vladimir.json';
import type IVolibear from '@lolcalc/data/files/champion/Volibear.json';
import type IZaahen from '@lolcalc/data/files/champion/Zaahen.json';
import type IZilean from '@lolcalc/data/files/champion/Zilean.json';
import type { IChampion, IChampionAbilityVariant, IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IChampionStats } from '@lolcalc/shared';
import type { ComputedRef } from 'vue';
import type { DamageSource, ICalculateChampionStatsHookSource, IDamageSourceInternalDataBase, IEffectOntoTargetVarsHook, IProviderGroupDataSetup, IProviderGroupImageText } from '../DamageSource';
import type { DetectChampionVariables } from '../types';
import type { IGameVariableValueParameters } from '../variables/game.ts';
import type { IDefineVariablesConfig, IDeriveProgressFn, IEffectControlsProps, IExtractExtraVariables, ISpecificVariables, IVariableValueResult } from './index';
import { MISC, STAT_ICON } from '@lolcalc/data';
import { ALL_CHAMPION_STATS_ENTRIES, EFFECT_OBJECT_NAME, ITEM_NAME_TO_ID, VariableType } from '@lolcalc/shared';
import { clamp, roundNumber } from '@lolcalc/shared/utils.ts';
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
				hasPassiveStack: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), 1),
			};
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
						const targetPercentHealth = (target?.currentHealth.value ?? 0) / (target?.stats.value.total.hp || 1);
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
							const effect = self.getEffect(EFFECT_OBJECT_NAME.namiPSurgingTides)?.[0];
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
		// TODO calculate masterwork items
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
					ArmorStolen: [],
					MagicResistStolen: [],
				},
				calculate(self, target) {
					return {
						ResistsStealPercent: {
							value: self.effectsOntoTargetVars.value.rellPResistsStealPercent ?? 0,
						},
						ArmorStolen: {
							value: (self.internalData.value.passiveStacksOnTarget && target?.stats.value.effectVars.rellPArmorStolen) ?? 0,
						},
						MagicResistStolen: {
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
					ArmorStolen: {
						isCustom: true,
					},
					MagicResistStolen: {
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
					const targetEffect = self.calculationDamageTarget.value?.getEffect(EFFECT_OBJECT_NAME.rellPBreakMold)?.[0];
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

					const apToManaRatio = apToMana.value / 10_000;

					console.log({
						apToManaRatio,
						itemTotalAp: itemTotalStats.abilityPower,
						itemTotalAd: itemTotalStats.attackDamage,
						itemTotalHp: itemTotalStats.hp,
						itemTotalMana: itemTotalStats.mana,
						bonusAp: bonusStats.abilityPower,
						bonusAd: bonusStats.attackDamage,
						bonusHp: bonusStats.hp,
						bonusMana: bonusStats.mana,
						totalAp: totalStats.abilityPower,
						totalAd: totalStats.attackDamage,
						totalHp: totalStats.hp,
						totalMana: totalStats.mana,
						midQuestMultiplier: calculatedVariables.midQuestMultiplier,
						dragonApMultiplier: dragonStatMultipliers.abilityPower,
						dragonAdMultiplier: dragonStatMultipliers.attackDamage,
						seraphManaToAp: calculatedVariables.archangelSeraphManaToAp,
						rabadonApMultiplier: calculatedVariables.rabadonApMultiplier,
						totalItemApMultipliers: calculatedVariables.totalItemApMultipliers,
						muramanaManaToAd: calculatedVariables.manaMuraManaToAd,
						approachFimbulManaToHp: calculatedVariables.approachFimbulManaToHp,
						riftmakerBonusHPToAP: calculatedVariables.riftmakerBonusHPToAP,
						bloodmailTyrannyBonusHpToAd: calculatedVariables.bloodmailTyrannyBonusHpToAd,
						bloodmailRetributionPercentage: calculatedVariables.bloodmailRetributionPercentage,
					});

					const seraphManaToAp = calculatedVariables.archangelSeraphManaToAp ?? 0;
					const muramanaManaToAd = calculatedVariables.manaMuraManaToAd ?? 0;
					const approachFimbulManaToHp = calculatedVariables.approachFimbulManaToHp ?? 0;
					const riftmakerBonusHPToAP = calculatedVariables.riftmakerBonusHPToAP ?? 0;
					const bloodmailTyrannyBonusHpToAd = calculatedVariables.bloodmailTyrannyBonusHpToAd ?? 0;

					const totalApMultiplier = (calculatedVariables.totalItemApMultipliers ?? 1)
						+ (dragonStatMultipliers?.abilityPower ?? 0)
						+ (calculatedVariables.midQuestMultiplier ?? 0);

					const effectiveManaToAp = seraphManaToAp + (approachFimbulManaToHp * riftmakerBonusHPToAP);

					const loopDivisor = 1 - (totalStats.mana * apToManaRatio * effectiveManaToAp * totalApMultiplier);
					const finalAp = totalStats.abilityPower / loopDivisor;

					calculatedVariables.ryzePassivePercentManaIncrease = finalAp * apToManaRatio;
					const passiveMana = totalStats.mana * calculatedVariables.ryzePassivePercentManaIncrease;
					miscDebug.ryzePMana = passiveMana;

					const passiveHp = passiveMana * approachFimbulManaToHp;
					const basePassiveAp = (passiveMana * seraphManaToAp) + (passiveHp * riftmakerBonusHPToAP);
					let basePassiveAd = passiveMana * muramanaManaToAd;

					totalStats.mana += passiveMana;
					bonusStats.mana += passiveMana;
					championPassiveStats.mana = passiveMana;

					if (passiveHp > 0) {
						championPassiveStats.hp = passiveHp;
						totalStats.hp += passiveHp;
						bonusStats.hp += passiveHp;

						calculatedVariables.approachFimbulAwe = (calculatedVariables.approachFimbulAwe ?? 0) + passiveHp;
					}

					if (basePassiveAd > 0) {
						const dragonAd = basePassiveAd * dragonStatMultipliers.attackDamage;
						dragonStats.attackDamage = (dragonStats.attackDamage ?? 0) + dragonAd;

						if (calculatedVariables.midQuestMultiplier) {
							const midQuestAd = basePassiveAd * calculatedVariables.midQuestMultiplier;
							calculatedVariables.midQuestAd! += midQuestAd;
							basePassiveAd += midQuestAd;
						}

						basePassiveAd += dragonAd;
						championPassiveStats.attackDamage = basePassiveAd;
						totalStats.attackDamage += basePassiveAd;
						bonusStats.attackDamage += basePassiveAd;

						if (muramanaManaToAd > 0) {
							calculatedVariables.manaMuraAwe = (calculatedVariables.manaMuraAwe ?? 0) + (passiveMana * muramanaManaToAd);
						}
						if (bloodmailTyrannyBonusHpToAd > 0) {
							calculatedVariables.bloodmailTyranny = (calculatedVariables.bloodmailTyranny ?? 0) + (passiveHp * bloodmailTyrannyBonusHpToAd);
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
							calculatedVariables.midQuestAp! += basePassiveAd * calculatedVariables.midQuestMultiplier;
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
	Vladimir: {
		q: {
			variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'q'>()({
				known: {
					EmpoweredHeal: [],
				},
				calculate(self) {
					const baseHeal = championAbilityVariableValue('EmpoweredHealTooltip', { abilityVariant: self.champion.value!.abilities.q.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.q, damageSource: self });
					const percentMissing = championAbilityVariableValue('EmpoweredHealPercentTooltip', { abilityVariant: self.champion.value!.abilities.q.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.q, damageSource: self });
					const missingHealth = self.stats.value.total.hp - self.currentHealth.value;
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
				handler(self, { totalStats, bonusStats, runeShardStats, dragonStatMultipliers, championPassiveStats }, { calculatedVariables, miscDebug }) {
					const hpToAp = championAbilityVariableValue('HPforAP', { abilityVariant: self.champion.value!.abilities.passive.variants[0]! });
					const apToHp = championAbilityVariableValue('APRatioBonusHP', { abilityVariant: self.champion.value!.abilities.passive.variants[0]! });

					if (typeof hpToAp.value !== 'number' || typeof apToHp.value !== 'number') {
						console.warn('[CHAMPION_SPECIFICS vladimir] failed to calculate passive ratios', hpToAp, apToHp);
						return;
					}

					const totalApMultiplier = calculatedVariables.totalItemApMultipliers + dragonStatMultipliers.abilityPower + calculatedVariables.midQuestMultiplier;

					const excludedHPBaseAP = (runeShardStats.abilityPower ?? 0)
						+ (calculatedVariables.swiftmarchAdaptive ?? 0)
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
			effectOntoTargetVars?: IEffectOntoTargetVarsHook<Id>;
			[key: string]: any;
		};

export interface IChampionAbilitySpecific<Id extends IChampionId | undefined = undefined> {
	variables?: ISpecificVariables<any, any, Id, 'championAbility'>;
	dataOverrides?: IChampionAbilityVariantDataOverrides;
	effectControls?: IEffectControlsProps<any, Id>;
	/** called in `scripts/updateData`, if present the tooltip text will be replaced with the value returned from this function. It's passed the original text */
	preplaceTooltipText?: (value: string) => string;
	/**
	 * called in `scripts/updateData` after ability variant's extended variables are parsed, meant for modifying them
	 * @note it's called for every variant of the ability, currently only Vladimir needs it but might need updating
	 */
	modifyExtendedVariables?: (extendedVariables: NonNullable<IChampionAbilityVariant['extendedVariables']>) => void;
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
	Ashe: { frostShot: number };
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
