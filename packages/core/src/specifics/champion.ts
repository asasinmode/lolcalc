import type IAphelios from '@lolcalc/data/files/champion/Aphelios.json';
import type IEzreal from '@lolcalc/data/files/champion/Ezreal.json';
import type IIrelia from '@lolcalc/data/files/champion/Irelia.json';
import type IJax from '@lolcalc/data/files/champion/Jax.json';
import type IKaisa from '@lolcalc/data/files/champion/Kaisa.json';
import type IKayn from '@lolcalc/data/files/champion/Kayn.json';
import type IMonkeyKing from '@lolcalc/data/files/champion/MonkeyKing.json';
import type INaafiri from '@lolcalc/data/files/champion/Naafiri.json';
import type IOrianna from '@lolcalc/data/files/champion/Orianna.json';
import type IOrnn from '@lolcalc/data/files/champion/Ornn.json';
import type IRell from '@lolcalc/data/files/champion/Rell.json';
import type IRyze from '@lolcalc/data/files/champion/Ryze.json';
import type ISeraphine from '@lolcalc/data/files/champion/Seraphine.json';
import type ISona from '@lolcalc/data/files/champion/Sona.json';
import type ISyndra from '@lolcalc/data/files/champion/Syndra.json';
import type ITwistedFate from '@lolcalc/data/files/champion/TwistedFate.json';
import type IZaahen from '@lolcalc/data/files/champion/Zaahen.json';
import type { IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IChampionStats } from '@lolcalc/shared';
import type { ComputedRef } from 'vue';
import type { DamageSource, ICalculateChampionStatsHookSource, IDamageSourceInternalDataBase, IProviderGroupDataSetup, IProviderGroupImageText } from '../DamageSource';
import type { DetectChampionVariables } from '../types';
import type { ISpecificVariables } from './index';
import { ALL_CHAMPION_STATS_ENTRIES, ITEM_NAME_TO_ID } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { computed, watch } from 'vue';
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
	Irelia: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Irelia'>): number => (self.champion.value! as typeof IIrelia).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Irelia.MAX_PASSIVE_STACKS(self)),
			};
		},
	},
	Jax: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Jax'>): number => (self.champion.value! as typeof IJax).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Jax.MAX_PASSIVE_STACKS(self)),
			};
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
				? ((VARIABLE_CALCULATION_FNS.mFormulaParts((self.champion.value as typeof INaafiri).abilities.passive.variants[0]!.spellCalculations.PackmateCap, {}, self)?.value as number ?? 0)
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
				handler(self, { totalStats, bonusStats, totalMultipliersStats, questStatMultiplier }, { calculatedVariables, miscDebug }) {
					if (self.champion.value) {
						const apMultiplier = championAbilityVariableValue(
							'PercentManaIncrease' satisfies DetectChampionVariables<typeof IRyze, 'passive'>,
							{
								abilityVariant: self.champion.value.abilities.passive.variants[0]!,
								allAbilitiesVariants: self.allAbilityVariants.value,
								damageSource: self,
								dynamicVariables: self.computed.variables.value.abilities.passive[0],
							},
						);
						const apTearItemId = [ITEM_NAME_TO_ID.archangelsStaff, ITEM_NAME_TO_ID.seraphsEmbrace]
							.find(id => self.items.value.some(item => item && item.id === id));
						const hpTearItemId = [ITEM_NAME_TO_ID.wintersApproach, ITEM_NAME_TO_ID.fimbulwinter]
							.find(id => self.items.value.some(item => item && item.id === id));

						if (typeof apMultiplier.value === 'number') {
							const manaPerAP = apMultiplier.value / 10_000;

							miscDebug.ryzePManaBase = totalStats.mana;
							miscDebug.ryzePTotalAp = totalStats.abilityPower;
							miscDebug.ryzePMana = 0;
							calculatedVariables.ryzePManaPercentIncrease = 0;

							const tearAPPerBonusMana = apTearItemId ? ITEM_SPECIFICS_SHARED[apTearItemId].AP_FROM_MANA : 0;
							const tearHPPerBonusMana = hpTearItemId ? ITEM_SPECIFICS_SHARED[hpTearItemId].HP_FROM_MANA : 0;

							let depth = 0;
							let addedAP = 0;
							let addedHP = 0;
							let currentRecursiveManaPercentIncrease = 0;
							let currentRecursiveMana = miscDebug.ryzePManaBase;
							let currentRecursiveAp = miscDebug.ryzePTotalAp;
							do {
								currentRecursiveManaPercentIncrease = currentRecursiveAp * manaPerAP;
								currentRecursiveMana = currentRecursiveMana * currentRecursiveManaPercentIncrease;
								currentRecursiveAp = currentRecursiveMana * tearAPPerBonusMana;
								const questStatBonus = currentRecursiveAp * questStatMultiplier;
								currentRecursiveAp += questStatBonus;

								// TODO
								totalMultipliersStats.abilityPower += questStatBonus;

								calculatedVariables.ryzePManaPercentIncrease += currentRecursiveManaPercentIncrease;
								calculatedVariables.midQuestAp! += questStatBonus;
								miscDebug.ryzePMana += currentRecursiveMana;
								addedAP += currentRecursiveAp;
								addedHP += tearHPPerBonusMana * miscDebug.ryzePMana;

								if (!tearAPPerBonusMana) {
									break;
								}
								depth += 1;
							} while (depth < 10);

							totalStats.mana += miscDebug.ryzePMana;
							bonusStats.mana += miscDebug.ryzePMana;
							totalStats.abilityPower += addedAP;
							bonusStats.abilityPower += addedAP;
							totalStats.hp += addedHP;
							bonusStats.hp += addedHP;

							miscDebug.tearItemBonusMana = (miscDebug.tearItemBonusMana ?? 0) + miscDebug.ryzePMana;

							if (calculatedVariables.archangelSeraphAwe !== undefined) {
								calculatedVariables.archangelSeraphAwe += addedAP;
							}
							if (calculatedVariables.approachFimbulAwe !== undefined) {
								calculatedVariables.approachFimbulAwe += addedHP;
							}
						} else {
							console.warn('[CHAMPION_SPECIFICS ryze] failed to resolve PercentManaIncrease variable', apMultiplier);
						}
					}
				},
				priority: HOOK_PRIORITIES.postTotal.Ryze,
			},
		},
		variables: defineChampionVariables<'Ryze', typeof IRyze>({
			known: {
				PassiveManaCalcTooltip: [],
			},
			calculate(self) {
				return {
					PassiveManaCalcTooltip: {
						value: self.stats.value.variables.ryzePManaPercentIncrease ?? 0,
						roundReplaced: 2,
					},
				};
			},
			meta: {
				// TODO custom variable how much mana he gains
				PassiveManaCalcTooltip: {
					statIconKey: 'abilityPower',
					multiplier: 100,
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
	Zaahen: {
		MAX_PASSIVE_STACKS: (self: DamageSource<'Zaahen'>): number => (self.champion.value! as typeof IZaahen).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), CHAMPION_SPECIFICS.Zaahen.MAX_PASSIVE_STACKS(self)),
			};
		},
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
	/**
	 * ability's variant specific
	 * something like `CHAMPION_SPECIFICS.Amumu.passive[0]` would be for variant 0 of Amumu's passive
	 */
	[key: number]: IChampionAbilityVariantSpecific;
};

export type IChampionAbilityVariantSpecific = IProviderGroupImageText;

/** wrapper around `defineVariables` for types on champion specific's variables */
export function defineChampionVariables<
	Id extends IChampionId,
	T = never,
	DetectedVariables extends string = DetectChampionVariables<T>,
>(
	config: Omit<ISpecificVariables<DetectedVariables, string, Id, 'championAbility'>, 'default'>,
): ISpecificVariables<DetectedVariables, string, Id, 'championAbility'> {
	return defineVariables(config);
}
