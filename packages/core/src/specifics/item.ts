/*
 * `ITEMS_BY_NAME.item` or `ITEMS_BY_NAME.itemId.` access is behind `?` because when developing, sometimes I resolve only singular items/their variables and they might not be present which would result in `undefined.propertyAccess` error
 */

import type { TItems } from '@lolcalc/data';
import type { IChampionId, IItem, IShopItem } from '@lolcalc/data/types';
import type { IStatsCalculationResult } from '@lolcalc/shared';
import type { IDeriveProgressFn, IInternalItemDataOf, ISpecificVariables, IVariableValueResult } from '.';
import type { DamageSource, ICalculateChampionStatsHookSource, IEffectOntoTargetVarsHook, IProviderGroupImageText, IProviderGroupInternalItemData } from '../DamageSource';
import type { DetectItemVariables } from '../types';
import { ITEMS, ITEMS_BY_NAME } from '@lolcalc/data';
import { AbilityType, CHAMPION_LEVEL, GRIEVOUS_WOUND_ITEMS, ITEM_NAME_TO_ID, RANGED_ONLY_ITEMS, UNTRANSFORMED_TEAR_ITEM_IDS, UPGRADED_SUPPORT_ITEMS, VariableType } from '@lolcalc/shared';
import { clamp, roundNumber } from '@lolcalc/shared/utils.ts';
import { addMultiplicative, combineCompounding, combineRecursive } from '../calculate/util.ts';
import { simpleFormattingGameAbilityImage } from '../misc.ts';
import { itemVariableValue, variableResolveFn } from '../variables/game.ts';
import { defineVariables, HOOK_PRIORITIES, ITEM_SPECIFICS_SHARED } from './index.ts';

const actualGWoundsItems = Object.values(ITEMS).filter(item => item.dataValues?.GrievousAmount);
if (!actualGWoundsItems.every(item => (GRIEVOUS_WOUND_ITEMS as string[]).includes(item.id))) {
	console.warn('[ITEM_SPECIFICS] grievous wounds item is missing from GRIEVOUS_WOUND_ITEMS, all:', actualGWoundsItems.map(item => item.name), 'known:', GRIEVOUS_WOUND_ITEMS.map(id => ITEMS[id]?.name));
}

const tearItem = {
	specific: {
		MAX_STACKS: ITEMS_BY_NAME.tear?.dataValues.MaxMana,
		internalDataProperties: ['manaflow'],
		setupData(self: DamageSource) {
			self.internalItemData.value.manaflow = clamp(0, Math.round(self.internalItemData.value.manaflow ?? 0), tearItem.specific.MAX_STACKS);
			return { manaflow: 0 };
		},
		imgTextLabel: 'Manaflow stacks',
		imgText(self) {
			return (self.internalItemData.value as { manaflow: number }).manaflow;
		},
	} satisfies IItemSpecific,
	calculateHookPreItemTotal: {
		handler(self, { itemBaseStats, itemPassivesStats, itemStatIncreases }, { miscDebug }) {
			const { manaflow = 0 } = self.internalItemData.value as IInternalItemDataOf<'tear'>;
			itemPassivesStats.mana += manaflow;
			miscDebug.tearItemBonusMana = itemBaseStats.mana + manaflow;

			const tearItemId = self.items.value.find(item => item && (UNTRANSFORMED_TEAR_ITEM_IDS as string[]).includes(item.id))?.id;
			if (tearItemId) {
				itemStatIncreases[tearItemId] ??= {};
				itemStatIncreases[tearItemId]!.FlatMPPoolMod = manaflow;
			}
		},
	} satisfies ICalculateChampionStatsHookSource['preItemTotal'],
	uninterestingVariables: ['ManaPerCharge', 'ManaChargeAmmoCD', 'ManaChargeMaxAmmo', 'ManaPerCharge', 'MaxMana', 'BonusMinionDamage'] satisfies (DetectItemVariables<TItems[typeof ITEM_NAME_TO_ID['tear']]>)[] as any[],
};

const gluttonousGreavesSpecific = {
	MAX_STACKS: ITEMS_BY_NAME.gluttonousGreaves?.dataValues.MaxStacks,
	internalDataProperties: ['slay'],
	setupData(self) {
		self.internalItemData.value.slay = clamp(0, self.internalItemData.value.slay ?? 0, gluttonousGreavesSpecific.MAX_STACKS);
		return { slay: 0 };
	},
	imgTextLabel: 'Slay stacks',
	imgText(self) {
		return (self.internalItemData.value as { slay: number }).slay;
	},
	variables: defineVariables({
		known: {
			Omnivamp: [],
		},
		calculate(self) {
			return {
				Omnivamp: {
					value: self.stats.value.variables.gluttonousImmortalOmnivamp ?? 0,
				},
			};
		},
		meta: {
			Omnivamp: {
				isCustom: true,
				resultsIsPercentage: true,
			},
		},
		uninteresting: ['OmnivampOnTakedown', 'MaxStacks', 'DamageMod', 'HealingMod'],
	}),
	calculateHooks: {
		preItemTotal: {
			handler(self, { itemPassivesStats, itemStatIncreases }, { calculatedVariables }) {
				const { slay } = self.internalItemData.value as IInternalItemDataOf<'gluttonousGreaves'>;
				calculatedVariables.gluttonousImmortalOmnivamp = (slay ?? 0) * ITEMS_BY_NAME.gluttonousGreaves?.dataValues.OmnivampOnTakedown;
				itemPassivesStats.omnivamp += calculatedVariables.gluttonousImmortalOmnivamp;
				calculatedVariables.gluttonousImmortalOmnivamp *= 100;

				const bootsId = self.items.value.find(item => item && (item.id === ITEM_NAME_TO_ID.gluttonousGreaves || item.id === ITEM_NAME_TO_ID.immortalPath))?.id;
				if (bootsId) {
					itemStatIncreases[bootsId] = {
						PercentOmnivampMod: calculatedVariables.gluttonousImmortalOmnivamp,
					};
				}
			},
		},
	},
} satisfies IItemSpecific;

const grievousWoundItemSpecific = {
	internalDataProperties: ['gWounds'],
	setupData(self) {
		self.internalItemData.value.gWounds = clamp(0, self.internalItemData.value.gWounds ?? 0, 1);
		return { gWounds: 0 };
	},
	imgActive(internalData: { gWounds: number }) {
		return internalData.gWounds;
	},
	variables: {
		uninteresting: ['f2', 'f3', 'GrievousAmount', 'GrievousDuration'] as const,
	},
} satisfies IItemSpecific<typeof GRIEVOUS_WOUND_ITEMS[number]>;

/** specific items' helpers, utils and calculations */
export const ITEM_SPECIFICS = {
	[ITEM_NAME_TO_ID.hubris]: {
		calculateBonusAd: (self: DamageSource): number => {
			const { eminence } = self.internalItemData.value;
			if (eminence) {
				return ITEMS_BY_NAME.hubris?.dataValues.BaseADBonus + eminence * ITEMS_BY_NAME.hubris?.dataValues.ADPerStatue;
			}
			return 0;
		},
		internalDataProperties: ['eminence'],
		setupData(self) {
			self.internalItemData.value.eminence = Math.max(0, self.internalItemData.value.eminence ?? 0);
			return { eminence: 0 };
		},
		imgTextLabel: 'Eminence stacks',
		imgText(self): number {
			return ITEM_SPECIFICS[ITEM_NAME_TO_ID.hubris].calculateBonusAd(self);
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }) {
					itemPassivesStats.attackDamage += ITEM_SPECIFICS[ITEM_NAME_TO_ID.hubris].calculateBonusAd(self);
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		MAX_STACKS: ITEMS_BY_NAME.darkSeal?.dataValues.MaxGloryStacks,
		internalDataProperties: ['glory'],
		setupData(self) {
			self.internalItemData.value.glory = clamp(0, self.internalItemData.value.glory ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.darkSeal].MAX_STACKS);
			return { glory: 0 };
		},
		imgTextLabel: 'Glory stacks',
		imgText(self) {
			return (self.internalItemData.value as { glory: number }).glory;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }) {
					itemPassivesStats.abilityPower += self.internalItemData.value.glory * ITEMS_BY_NAME.darkSeal?.dataValues.APPerGlory;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.mejai]: {
		MAX_STACKS: ITEMS_BY_NAME.mejai?.dataValues.MaxGloryStacks,
		internalDataProperties: ['glory'],
		setupData(self) {
			self.internalItemData.value.glory = clamp(0, self.internalItemData.value.glory ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.mejai].MAX_STACKS);
			return { glory: 0 };
		},
		imgTextLabel: 'Glory stacks',
		imgText(self) {
			return (self.internalItemData.value as { glory: number }).glory;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					const { glory } = self.internalItemData.value as IInternalItemDataOf<'mejai'>;
					itemPassivesStats.abilityPower += glory * ITEMS_BY_NAME.mejai?.dataValues.APPerGlory;
					if (glory >= ITEMS_BY_NAME.mejai?.dataValues.GloryThreshold) {
						calculatedVariables.totalBonusPercentMoveSpeed += ITEMS_BY_NAME.mejai?.dataValues.MoveSpeedMod;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		MAX_STACKS: ITEMS_BY_NAME.hauntingGuise?.dataValues.SecondsInCombat,
		internalDataProperties: ['madness'],
		setupData(self) {
			self.internalItemData.value.madness = clamp(0, self.internalItemData.value.madness ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.hauntingGuise].MAX_STACKS);
			return { madness: 0 };
		},
		imgTextLabel: 'Madness bonus damage',
		imgText(self): number | undefined {
			return (self.internalItemData.value as IInternalItemDataOf<'hauntingGuise'>).madness;
		},
		variables: defineVariables({
			known: {
				BonusDamage: [],
			},
			calculate(self) {
				return {
					BonusDamage: {
						value: self.stats.value.variables.hauntingGuiseBonusDamagePercent ?? 0,
					},
				};
			},
			meta: {
				BonusDamage: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['DamageIncreasePerSecond', 'DamageIncreaseMax'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, _args, { calculatedVariables }) {
					calculatedVariables.hauntingGuiseBonusDamagePercent = ((self.internalItemData.value as IInternalItemDataOf<'hauntingGuise'>).madness ?? 0) * ITEMS_BY_NAME.hauntingGuise?.dataValues.DamageIncreasePerSecond;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.roa]: {
		MAX_STACKS: ITEMS_BY_NAME.roa?.dataValues.MaxStacks,
		internalDataProperties: ['eternity'],
		setupData(self) {
			self.internalItemData.value.eternity = clamp(0, self.internalItemData.value.eternity ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.roa].MAX_STACKS);
			return { eternity: 0 };
		},
		imgTextLabel: 'Eternity stacks',
		imgText(self) {
			return (self.internalItemData.value as { eternity: number }).eternity;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats, itemStatIncreases }, { calculatedVariables }) {
					const { eternity = 0 } = self.internalItemData.value;
					const { APPerStack, HealthPerStack, ManaPerStack } = ITEMS_BY_NAME.roa?.dataValues;
					itemPassivesStats.abilityPower += (calculatedVariables.roaAp = eternity * APPerStack);
					itemPassivesStats.hp += (calculatedVariables.roaHp = eternity * HealthPerStack);
					itemPassivesStats.mana += (calculatedVariables.roaMana = eternity * ManaPerStack);

					itemStatIncreases[ITEM_NAME_TO_ID.roa] = {
						FlatMagicDamageMod: calculatedVariables.roaAp,
						FlatHPPoolMod: calculatedVariables.roaHp,
						FlatMPPoolMod: calculatedVariables.roaMana,
					};
				},
			},
		},
		variables: defineVariables({
			known: {
				f4: [],
				f5: [],
				StacksHealth: [],
				StacksMana: [],
				StacksAP: [],
			},
			calculate(self) {
				const { eternity = 0 } = self.internalItemData.value;
				const { APPerStack, HealthPerStack, ManaPerStack } = ITEMS_BY_NAME.roa?.dataValues;
				return {
					f4: { value: 0 },
					f5: { value: 0 },
					StacksHealth: {
						value: self.stats.value.variables.roaHp ?? (eternity * HealthPerStack),
					},
					StacksMana: {
						value: self.stats.value.variables.roaMana ?? (eternity * ManaPerStack),
					},
					StacksAP: {
						value: self.stats.value.variables.roaAp ?? (eternity * APPerStack),
					},
				};
			},
			meta: {
				StacksHealth: {
					isCustom: true,
				},
				StacksMana: {
					isCustom: true,
				},
				StacksAP: {
					isCustom: true,
				},
			},
			uninteresting: ['f4', 'f5', 'HealthPerStack', 'ManaPerStack', 'APPerStack', 'SecondsPerStack', 'MaxStacks', 'EternityManaRestore', 'EternityHealthRestore', 'EternityMaxHealPerCast'],
		}),
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		internalDataProperties: ['bBlaze'],
		setupData(self) {
			self.internalItemData.value.bBlaze = Math.max(0, self.internalItemData.value.bBlaze ?? 0);
			return { bBlaze: 0 };
		},
		imgTextLabel: 'Baleful Blaze ap increase',
		imgText(self) {
			const { bBlaze } = self.internalItemData.value as { bBlaze: number };
			return bBlaze && `${Math.round(bBlaze * ITEMS_BY_NAME.blackfireTorch?.dataValues.APPerStack * 100)}%`;
		},
		calculateHooks: {
			preBonus: {
				handler(self, { itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
					const multiplier = self.internalItemData.value.bBlaze * ITEMS_BY_NAME.blackfireTorch?.dataValues.APPerStack;
					calculatedVariables.blackfireTorchBBlazeMultiplier = multiplier;
					calculatedVariables.blackfireTorchBBlazeAP = calculatedVariables.apMultipliersBase * multiplier;
					calculatedVariables.totalItemApMultipliers += multiplier;
					itemPassivesStats.abilityPower += calculatedVariables.blackfireTorchBBlazeAP;
					itemTotalStats.abilityPower += calculatedVariables.blackfireTorchBBlazeAP;
				},
			},
			onTotalPreMultipliers: {
				handler(_self, { adaptiveForceMeta, itemPassivesStats, totalMultipliersStats, itemTotalStats }, { calculatedVariables }) {
					if (calculatedVariables.swiftmarchAdaptive && adaptiveForceMeta[0] === 'abilityPower') {
						const value = calculatedVariables.swiftmarchAdaptive * calculatedVariables.blackfireTorchBBlazeMultiplier!;
						calculatedVariables.blackfireTorchBBlazeAP! += value;
						itemPassivesStats.abilityPower += value;
						totalMultipliersStats.abilityPower += value;
						itemTotalStats.abilityPower += value;
					}
				},
				priority: HOOK_PRIORITIES.onTotalPreMultipliers[ITEM_NAME_TO_ID.blackfireTorch],
			},
		},
		variables: defineVariables({
			known: {
				f2: [],
			},
			calculate() {
				return {
					/** damage dealt to champions */
					f2: {
						value: 0,
					},
				};
			},
			meta: {
				BurnDamagePerSecondCalc: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MinionBurnCalc', 'MonsterBurnCalc', 'f2', 'APPerStack', 'BurnDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.liandry]: {
		MAX_STACKS: ITEMS_BY_NAME.liandry?.dataValues.MaxStackNumber,
		internalDataProperties: ['madness'],
		setupData(self) {
			self.internalItemData.value.madness = clamp(0, self.internalItemData.value.madness ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.liandry].MAX_STACKS);
			return { madness: 0 };
		},
		imgTextLabel: 'Madness bonus damage',
		imgText(self): number | undefined {
			return (self.internalItemData.value as IInternalItemDataOf<'liandry'>).madness;
		},
		variables: defineVariables({
			known: {
				f2: [],
				BonusDamage: [],
			},
			calculate(self) {
				return {
					f2: { value: 0 },
					BonusDamage: {
						value: self.stats.value.variables.liandryBonusDamagePercent ?? 0,
					},
				};
			},
			meta: {
				BonusDamage: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['f2', 'BurnPercentHealthDamage', 'BurnDuration', 'DamageIncreasePerSecond', 'DamageIncreaseMax'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, _args, { calculatedVariables }) {
					calculatedVariables.liandryBonusDamagePercent = ((self.internalItemData.value as IInternalItemDataOf<'liandry'>).madness ?? 0) * ITEMS_BY_NAME.liandry?.dataValues.DamageIncreasePerSecond;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		MAX_PRACTICE_CRIT: ITEMS_BY_NAME.yunTal?.dataValues.CritMax,
		MELEE_CRIT_STEP: itemVariableValue('CritPerStackCalc', { item: ITEMS_BY_NAME.yunTal, isRanged: false }).value as number,
		RANGED_CRIT_STEP: itemVariableValue('CritPerStackCalc', { item: ITEMS_BY_NAME.yunTal, isRanged: true }).value as number,
		FLURRY_ATTACK_SPEED: itemVariableValue('ASMod', { item: ITEMS_BY_NAME.yunTal }).value as number,
		internalDataProperties: ['practice', 'flurry'],
		setupData(self) {
			self.internalItemData.value.practice = clamp(0, self.internalItemData.value.practice ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].MAX_PRACTICE_CRIT);
			self.internalItemData.value.flurry = clamp(0, self.internalItemData.value.flurry ?? 0, 1);
			return { practice: 0, flurry: 0 };
		},
		imgTextLabel: 'Practice Makes Lethal critical strike chance',
		imgText(self) {
			const { practice } = self.internalItemData.value as { practice: number };
			return practice && `${Math.round(practice)}%`;
		},
		imgActive(internalData: { flurry: number }) {
			return internalData.flurry;
		},
		variables: defineVariables({
			known: {
				BonusCrit: [],
			},
			calculate(self): {
				BonusCrit: IVariableValueResult;
			} {
				return {
					BonusCrit: {
						value: (self.internalItemData.value as IInternalItemDataOf<'yunTal'>).practice ?? 0,
					},
				};
			},
			meta: {
				BonusCrit: {
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['CritPerStackCalc', 'CritMax', 'ASMod', 'ASDuration', 'AACDR', 'CritCDR'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats, itemStatIncreases }, { calculatedVariables }) {
					const { practice = 0 } = self.internalItemData.value as IInternalItemDataOf<'yunTal'>;
					calculatedVariables.yuntalCritChance = roundNumber(practice / 100, 2);
					itemPassivesStats.critChance += calculatedVariables.yuntalCritChance;
					itemStatIncreases[ITEM_NAME_TO_ID.yunTal] = {
						FlatCritChanceMod: practice,
					};
					if ((self.internalItemData.value as IInternalItemDataOf<'yunTal'>).flurry) {
						calculatedVariables.yuntalAttackSpeed = ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].FLURRY_ATTACK_SPEED;
						itemPassivesStats.bonusAttackSpeedPercent += calculatedVariables.yuntalAttackSpeed;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.shojin]: {
		MAX_STACKS: ITEMS_BY_NAME.shojin?.dataValues.StackCount,
		internalDataProperties: ['fWill'],
		setupData(self) {
			self.internalItemData.value.fWill = clamp(0, self.internalItemData.value.fWill ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.shojin].MAX_STACKS);
			return { fWill: 0 };
		},
		imgTextLabel: 'Focused Will ability damage increase',
		imgText(self) {
			const { shojinBonusDamagePercent } = self.stats.value.variables;
			return shojinBonusDamagePercent ? `${Math.round(shojinBonusDamagePercent * 100)}%` : '';
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			uninteresting: ['f1', 'AHBase', 'TooltipValue', 'StackDuration', 'StackCount', 'CastIDLockout'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					itemPassivesStats.basicHaste += ITEMS_BY_NAME.shojin.dataValues?.AHBase;
					calculatedVariables.shojinBonusDamagePercent = ((self.internalItemData.value as IInternalItemDataOf<'shojin'>).fWill ?? 0) * ITEMS_BY_NAME.shojin?.dataValues.SpellDamageIncrease;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		MAX_STACKS: ITEMS_BY_NAME.riftmaker?.dataValues.SecondsInCombat,
		internalDataProperties: ['corruption'],
		setupData(self) {
			self.internalItemData.value.corruption = clamp(0, self.internalItemData.value.corruption ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.riftmaker].MAX_STACKS);
			return { corruption: 0 };
		},
		imgTextLabel: 'Corruption bonus damage',
		imgText(self): number | undefined {
			return (self.internalItemData.value as IInternalItemDataOf<'riftmaker'>).corruption;
		},
		variables: defineVariables({
			known: {
				f1: [],
				lolcalcChampRange: [],
				BonusDamage: [],
			},
			calculate(self) {
				const { VampAmountRanged, VampAmountMelee } = ITEMS_BY_NAME.riftmaker?.dataValues;
				const voidInfusion = itemVariableValue('{1247259a}', { item: ITEMS_BY_NAME.riftmaker, damageSource: self });

				return {
					/** ap gained from passive */
					f1: self.stats.value.variables.riftmakerVoidInfusion === undefined
						? voidInfusion
						: {
								value: self.stats.value.variables.riftmakerVoidInfusion,
								calculatesFrom: voidInfusion.calculatesFrom,
							},
					lolcalcChampRange: {
						value: [VampAmountMelee, VampAmountRanged],
					},
					BonusDamage: {
						value: self.stats.value.variables.riftmakerBonusDamagePercent ?? 0,
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					displayedName: 'MaxStacksOmnivamp',
					multiplier: 100,
					isPercentage: true,
				},
				f1: {
					displayedName: 'BonusAPFromHP',
				},
				BonusDamage: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['EternityDamageIncreasePerSecond', 'EternityDamageIncreaseMax', 'HealthToAPConversionPercent'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { isRanged, itemBaseStats, itemPassivesStats }, { calculatedVariables, miscDebug }) {
					calculatedVariables.riftmakerBonusDamagePercent = ((self.internalItemData.value as IInternalItemDataOf<'riftmaker'>).corruption ?? 0) * ITEMS_BY_NAME.riftmaker?.dataValues.EternityDamageIncreasePerSecond;

					const bonusHp = (itemBaseStats.hp + itemPassivesStats.hp);
					calculatedVariables.riftmakerVoidInfusion = bonusHp * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.riftmaker].HP_TO_AP;
					itemPassivesStats.abilityPower += calculatedVariables.riftmakerVoidInfusion;
					miscDebug.riftmakerBonusHp = bonusHp;

					const { corruption } = self.internalItemData.value as IInternalItemDataOf<'riftmaker'>;
					if (corruption === ITEM_SPECIFICS[ITEM_NAME_TO_ID.riftmaker].MAX_STACKS) {
						const { VampAmountRanged, VampAmountMelee } = ITEMS_BY_NAME.riftmaker?.dataValues;
						const omnivamp = isRanged ? VampAmountRanged : VampAmountMelee;
						itemPassivesStats.omnivamp += omnivamp;
					}
				},
				priority: HOOK_PRIORITIES.preItemTotal[ITEM_NAME_TO_ID.riftmaker],
			},
			preBonus: {
				handler(_self, { runeShardStats, itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug }) {
					if (runeShardStats.hp) {
						const value = runeShardStats.hp * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.riftmaker].HP_TO_AP;
						calculatedVariables.riftmakerVoidInfusion! += value;
						itemPassivesStats.abilityPower += value;
						itemTotalStats.abilityPower += value;

						calculatedVariables.apMultipliersBase += value;
						miscDebug.riftmakerBonusHp! += runeShardStats.hp;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.tear]: {
		...tearItem.specific,
		calculateHooks: {
			preItemTotal: tearItem.calculateHookPreItemTotal,
		},
		variables: {
			uninteresting: tearItem.uninterestingVariables.concat('BonusMinionDamage'),
		},
	},
	[ITEM_NAME_TO_ID.whisperingCirclet]: {
		...tearItem.specific,
		calculateHooks: {
			preItemTotal: {
				handler(self, args, meta) {
					tearItem.calculateHookPreItemTotal.handler(self, args, meta);
					const bonusHSP = (meta.miscDebug.tearItemBonusMana ?? 0) * ITEMS_BY_NAME.whisperingCirclet?.itemCalculations.BonusHSPCalc.mFormulaParts[0]!.mCoefficient / 100;
					args.itemPassivesStats.healShieldPower += bonusHSP;
					meta.calculatedVariables.whisperingDiademAwe = bonusHSP;
				},
			},
		},
		variables: defineVariables({
			meta: {
				BonusHSPCalc: {
					roundReplaced: true,
				},
			},
			uninteresting: tearItem.uninterestingVariables,
		}),
	},
	[ITEM_NAME_TO_ID.diademOfSongs]: {
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemPassivesStats }, { calculatedVariables, miscDebug }) {
					const bonusHSP = (miscDebug.tearItemBonusMana ?? 0) * ITEMS_BY_NAME.diademOfSongs?.itemCalculations.BonusHSPCalc.mFormulaParts[0]!.mCoefficient / 100;
					itemPassivesStats.healShieldPower += bonusHSP;
					calculatedVariables.whisperingDiademAwe = bonusHSP;
				},
			},
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				BonusHSPCalc: {
					roundReplaced: true,
				},
				ManaToHeal: {
					type: VariableType.heal,
					roundReplaced: true,
				},
			},
			uninteresting: ['f1', 'AllyCombatDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.archangelsStaff]: {
		...tearItem.specific,
		calculateHooks: {
			preItemTotal: tearItem.calculateHookPreItemTotal,
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug }) {
					const bonusAP = (miscDebug.tearItemBonusMana ?? 0) * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.archangelsStaff].AP_FROM_MANA;
					calculatedVariables.apMultipliersBase += bonusAP;
					itemPassivesStats.abilityPower += bonusAP;
					itemTotalStats.abilityPower += bonusAP;
					calculatedVariables.archangelSeraphAwe = bonusAP;
				},
			},
		},
		variables: defineVariables({
			known: {
				f2: [],
			},
			calculate(self) {
				return {
					/** ap gained from passive */
					f2: {
						value: self.stats.value.variables.archangelSeraphAwe
							?? (self.stats.value.bonus.mana * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.archangelsStaff].AP_FROM_MANA),
						calculatesFrom: [{
							stat: 'mana',
							type: 'bonus',
							isPercentage: true,
							value: ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.archangelsStaff].AP_FROM_MANA,
						}],
					},
				};
			},
			meta: {
				f2: {
					displayedName: 'APFromMana',
				},
			},
			uninteresting: ['APFromMana', ...tearItem.uninterestingVariables],
		}),
	},
	[ITEM_NAME_TO_ID.seraphsEmbrace]: {
		calculateHooks: {
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug }) {
					miscDebug.tearItemBonusMana = itemTotalStats.mana;
					calculatedVariables.archangelSeraphAwe = miscDebug.tearItemBonusMana * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.seraphsEmbrace].AP_FROM_MANA;
					calculatedVariables.apMultipliersBase += calculatedVariables.archangelSeraphAwe;
					itemPassivesStats.abilityPower += calculatedVariables.archangelSeraphAwe;
					itemTotalStats.abilityPower += calculatedVariables.archangelSeraphAwe;
				},
			},
		},
		variables: defineVariables({
			known: {
				f5: [],
				BonusAPCalc: [],
			},
			calculate(self) {
				const bonusAP = itemVariableValue('BonusAPCalc', { item: ITEMS_BY_NAME.seraphsEmbrace, damageSource: self });

				return {
					/** damage shielded */
					f5: {
						value: 0,
					},
					/** ap gained from passive */
					BonusAPCalc: self.stats.value.variables.archangelSeraphAwe === undefined
						? bonusAP
						: {
								value: self.stats.value.bonus.mana * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.seraphsEmbrace].AP_FROM_MANA,
								calculatesFrom: bonusAP.calculatesFrom,
							},
				};
			},
			meta: {
				ShieldValue: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['f5', 'ShieldDuration', 'HealthThreshold'],
		}),
	},
	[ITEM_NAME_TO_ID.manamune]: {
		...tearItem.specific,
		calculateHooks: {
			preItemTotal: tearItem.calculateHookPreItemTotal,
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats, baseOnLevelStats }, { calculatedVariables }) {
					const bonusAD = (itemTotalStats.mana + baseOnLevelStats.mana) * ITEMS_BY_NAME.manamune?.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient;
					itemPassivesStats.attackDamage += bonusAD;
					itemTotalStats.attackDamage += bonusAD;
					calculatedVariables.manaMuraAwe = bonusAD;
				},
			},
		},
		variables: defineVariables({
			known: {
				BonusADFromMana: [],
			},
			calculate(self) {
				const bonusAD = itemVariableValue('BonusADFromMana', { item: ITEMS_BY_NAME.manamune, damageSource: self });

				return {
					/** ad gained from passive */
					BonusADFromMana: self.stats.value.variables.manaMuraAwe === undefined
						? bonusAD
						: {
								value: self.stats.value.total.mana * ITEMS_BY_NAME.manamune?.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient,
								calculatesFrom: bonusAD.calculatesFrom,
							},
				};
			},
			uninteresting: tearItem.uninterestingVariables,
		}),
	},
	[ITEM_NAME_TO_ID.muramana]: {
		calculateHooks: {
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats, baseOnLevelStats }, { calculatedVariables }) {
					calculatedVariables.manaMuraAwe = (itemTotalStats.mana + baseOnLevelStats.mana) * ITEMS_BY_NAME.muramana?.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient;
					itemPassivesStats.attackDamage += calculatedVariables.manaMuraAwe;
					itemTotalStats.attackDamage += calculatedVariables.manaMuraAwe;
				},
			},
		},
		variables: defineVariables({
			known: {
				BonusADFromMana: [],
				lolcalcChampRange: [],
				f1: [],
			},
			calculate(self) {
				const bonusAD = itemVariableValue('BonusADFromMana', { item: ITEMS_BY_NAME.muramana, damageSource: self });

				return {
					BonusADFromMana: self.stats.value.variables.manaMuraAwe === undefined
						? bonusAD
						: {
								value: self.stats.value.variables.manaMuraAwe,
								calculatesFrom: bonusAD.calculatesFrom,
							},
					/** passive damaging abilities bonus damage */
					lolcalcChampRange: [
						itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.muramana, damageSource: self, isRanged: false }),
						itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.muramana, damageSource: self, isRanged: true }),
					],
					f1: {
						value: 0,
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					displayedName: 'AdditionalAbilityDamage',
				},
			},
			uninteresting: ['f1'],
		}),
	},
	[ITEM_NAME_TO_ID.wintersApproach]: {
		...tearItem.specific,
		calculateHooks: {
			preItemTotal: {
				handler(self, args, meta) {
					tearItem.calculateHookPreItemTotal.handler(self, args, meta);
					const bonusHP = (meta.miscDebug.tearItemBonusMana ?? 0) * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.wintersApproach].HP_FROM_MANA;
					args.itemPassivesStats.hp += bonusHP;
					meta.calculatedVariables.approachFimbulAwe = bonusHP;
				},
			},
		},
		variables: defineVariables({
			known: {
				BonusHPFromMana: [],
			},
			calculate(self) {
				const bonusHP = itemVariableValue('BonusHPFromMana', { item: ITEMS_BY_NAME.wintersApproach, damageSource: self });

				return {
					BonusHPFromMana: self.stats.value.variables.approachFimbulAwe === undefined
						? bonusHP
						: {
								value: self.stats.value.variables.approachFimbulAwe,
								calculatesFrom: bonusHP.calculatesFrom,
							},
				};
			},
			uninteresting: tearItem.uninterestingVariables,
		}),
	},
	[ITEM_NAME_TO_ID.fimbulwinter]: {
		internalDataProperties: ['enemiesNearby'],
		setupData(self) {
			self.internalItemData.value.enemiesNearby = clamp(0, self.internalItemData.value.enemiesNearby ?? 0, 1);
			return { enemiesNearby: 0 };
		},
		imgActive(internalData: { enemiesNearby: number }) {
			return internalData.enemiesNearby;
		},
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemBaseStats, itemPassivesStats }, { calculatedVariables, miscDebug }) {
					miscDebug.tearItemBonusMana = itemBaseStats.mana;
					const bonusHP = miscDebug.tearItemBonusMana * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.fimbulwinter].HP_FROM_MANA;
					itemPassivesStats.hp += bonusHP;
					calculatedVariables.approachFimbulAwe = bonusHP;
				},
			},
		},
		variables: defineVariables({
			known: {
				BonusHPFromMana: [],
				ShieldBase: [ITEMS_BY_NAME.fimbulwinter?.itemCalculations.ShieldBase.mFormulaParts[0]!.mNumber],
				f2: [],
				ComputedShield: [],
			},
			calculate(self) {
				const bonusHP = itemVariableValue('BonusHPFromMana', { item: ITEMS_BY_NAME.fimbulwinter, damageSource: self });

				return {
					BonusHPFromMana: self.stats.value.variables.approachFimbulAwe === undefined
						? bonusHP
						: {
								value: self.stats.value.variables.approachFimbulAwe,
								calculatesFrom: bonusHP.calculatesFrom,
							},
					ShieldBase: {
						value: ITEMS_BY_NAME.fimbulwinter?.itemCalculations.ShieldBase.mFormulaParts[0]!.mNumber,
					},
					f2: {
						value: 0,
					},
					ComputedShield: {
						value: self.hasMana.value
							? (ITEMS_BY_NAME.fimbulwinter?.itemCalculations.ShieldBase.mFormulaParts[0]!.mNumber + self.currentAbilityResource.value * ITEMS_BY_NAME.fimbulwinter?.dataValues.CurrentManaShieldRatio)
							* (1 + ((self.internalItemData.value).enemiesNearby ? ITEMS_BY_NAME.fimbulwinter?.dataValues.Multiplier : 0))
							: 0,
					},
				};
			},
			meta: {
				ShieldBase: {
					type: VariableType.shield,
				},
				ComputedShield: {
					isCustom: true,
					type: VariableType.shield,
				},
			},
			uninteresting: ['f2', 'CurrentManaShieldRatio', 'ShieldDuration', 'Multiplier', 'ShieldBase'],
		}),
	},
	[ITEM_NAME_TO_ID.trinity]: {
		internalDataProperties: ['quicken'],
		setupData(self) {
			self.internalItemData.value.quicken = clamp(0, self.internalItemData.value.quicken ?? 0, 1);
			return { quicken: 0 };
		},
		imgActive(internalData: { quicken: number }) {
			return internalData.quicken;
		},
		variables: defineVariables({
			known: {
				f4: [],
			},
			calculate() {
				return {
					f4: { value: 0 },
				};
			},
			meta: {
				SpellbladeDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['f4', 'MoveSpeedBonus', 'MSDuration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'trinity'>).quicken) {
						calculatedVariables.trinityForceMoveSpeed = ITEMS_BY_NAME.trinity?.dataValues.MoveSpeedBonus;
						itemPassivesStats.moveSpeed += calculatedVariables.trinityForceMoveSpeed;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		MAX_STACKS: 5,
		internalDataProperties: ['carve', 'fervor'],
		setupData(self) {
			self.internalItemData.value.carve = Math.max(0, Math.min(
				ITEM_SPECIFICS[ITEM_NAME_TO_ID.blackCleaver].MAX_STACKS,
				self.internalItemData.value.carve ?? 0,
			));
			self.internalItemData.value.fervor = clamp(0, self.internalItemData.value.fervor ?? 0, 1);
			return { carve: 0, fervor: 0 };
		},
		imgActive(internalData: { fervor: number }) {
			return internalData.fervor;
		},
		imgTextLabel: 'Carve stacks',
		imgText(self) {
			return self.internalItemData.value.carve;
		},
		variables: defineVariables({
			known: {
				Shred: [],
				ArmorShredded: [],
			},
			calculate(self, target): { Shred: IVariableValueResult; ArmorShredded: IVariableValueResult } {
				return {
					Shred: {
						value: self.effectsOntoTargetVars.value.blackCleaverCarveShred ?? 0,
					},
					ArmorShredded: {
						value: ((self.internalItemData.value as IInternalItemDataOf<'blackCleaver'>).carve && target?.stats.value.debuffs.shreddedArmor) ?? 0,
					},
				};
			},
			meta: {
				Shred: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				ArmorShredded: {
					isCustom: true,
				},
			},
			uninteresting: ['ShredPerStack', 'DebuffDuration', 'MaxStacks', 'MoveSpeedDuration'],
		}),
		effectOntoTargetVars(self, vars) {
			vars.bloodlettersVDecayShred = (self.internalItemData.value as IInternalItemDataOf<'bloodlettersCurse'>).vDecay * ITEMS_BY_NAME.bloodlettersCurse?.dataValues.ShredPerStack;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'blackCleaver'>).fervor) {
						calculatedVariables.blackCleaverMoveSpeed = ITEMS_BY_NAME.blackCleaver?.dataValues.MoveSpeedBonus;
						itemPassivesStats.moveSpeed += calculatedVariables.blackCleaverMoveSpeed;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.celestialOpposition]: {
		internalDataProperties: ['mbReduction', 'mbSlow'],
		setupData(self) {
			self.internalItemData.value.mbReduction = clamp(0, self.internalItemData.value.mbReduction ?? 0, 1);
			self.internalItemData.value.mbSlow = clamp(0, self.internalItemData.value.mbSlow ?? 0, 1);
			return { mbReduction: 0, mbSlow: 0 };
		},
		imgActive(internalData: { mBlessing: number }) {
			return internalData.mBlessing;
		},
		variables: defineVariables({
			known: {
				f3: [],
				f5: [],
				f6: [ITEMS_BY_NAME.celestialOpposition?.dataValues.StealthWardCap],
			},
			calculate() {
				return {
					f3: { value: 0 },
					f5: { value: 0 },
					f6: { value: ITEMS_BY_NAME.celestialOpposition?.dataValues.StealthWardCap },
				};
			},
			meta: {
			},
			uninteresting: ['f3', 'f5', 'f6', 'MeleeShieldDRPercentage', 'RangedShieldDRPercentage', 'ShieldLingerAfterInitiallyPopped', 'SlowAmount', 'SlowDuration', 'StealthWardCap'],
		}),
	},
	[ITEM_NAME_TO_ID.phage]: {
		internalDataProperties: ['rage'],
		setupData(self) {
			self.internalItemData.value.rage = clamp(0, self.internalItemData.value.rage ?? 0, 1);
			return { rage: 0 };
		},
		imgActive(internalData: { rage: number }) {
			return internalData.rage;
		},
		variables: defineVariables({
			uninteresting: ['MoveSpeedDuration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { isRanged, itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'phage'>).rage) {
						const moveSpeed = itemVariableValue('MSBonusSplit', { item: ITEMS_BY_NAME.phage, isRanged: isRanged ?? false });
						if (typeof moveSpeed.value === 'number') {
							calculatedVariables.phageMoveSpeed = moveSpeed.value;
							itemPassivesStats.moveSpeed += calculatedVariables.phageMoveSpeed;
						} else {
							console.warn('[ITEM_SPECIFICS phage] failed to calculate move speed', moveSpeed);
						}
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.shurelya]: {
		internalDataProperties: ['iSpeech'],
		setupData(self) {
			self.internalItemData.value.iSpeech = clamp(0, self.internalItemData.value.iSpeech ?? 0, 1);
			return { iSpeech: 0 };
		},
		imgActive(internalData: { iSpeech: number }) {
			return internalData.iSpeech;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, _args, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'shurelya'>).iSpeech) {
						calculatedVariables.totalBonusPercentMoveSpeed += ITEMS_BY_NAME.shurelya?.dataValues.ActiveMoveSpeed;
					}
				},
			},
		},
		variables: defineVariables({
			uninteresting: ['ActiveMoveSpeed', 'BuffDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.ardentCenser]: {
		internalDataProperties: ['sanctify'],
		setupData(self) {
			self.internalItemData.value.sanctify = clamp(0, self.internalItemData.value.sanctify ?? 0, 1);
			return { sanctify: 0 };
		},
		imgActive(internalData: { sanctify: number }) {
			return internalData.sanctify;
		},
		variables: defineVariables({
			known: {
				f3: [],
			},
			calculate() {
				return {
					f3: { value: 0 },
				};
			},
			meta: {
				OnHitMin: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f3', 'Duration', 'AttackSpeedMin'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'ardentCenser'>).sanctify) {
						ITEM_SPECIFICS[ITEM_NAME_TO_ID.ardentCenser].calculatePassive(itemPassivesStats);
					}
				},
			},
		},
		calculatePassive(itemPassivesStats: IStatsCalculationResult['itemPassive']) {
			itemPassivesStats.bonusAttackSpeedPercent += ITEMS_BY_NAME.ardentCenser?.dataValues.AttackSpeedMin;
		},
	},
	[ITEM_NAME_TO_ID.staffOfFlowingWater]: {
		internalDataProperties: ['rapids'],
		setupData(self) {
			self.internalItemData.value.rapids = clamp(0, self.internalItemData.value.rapids ?? 0, 1);
			return { rapids: 0 };
		},
		imgActive(internalData: { rapids: number }) {
			return internalData.rapids;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'staffOfFlowingWater'>).rapids) {
						ITEM_SPECIFICS[ITEM_NAME_TO_ID.staffOfFlowingWater].calculatePassive(itemPassivesStats, calculatedVariables);
					}
				},
			},
		},
		calculatePassive(itemPassivesStats: IStatsCalculationResult['itemPassive'], calculatedVariables: IStatsCalculationResult['variables']) {
			const { AHMod, APMod } = ITEMS_BY_NAME.staffOfFlowingWater?.dataValues ?? {};
			itemPassivesStats.abilityHaste += AHMod;
			itemPassivesStats.abilityPower += APMod;
			calculatedVariables.apMultipliersBase += APMod;
		},
	},
	[ITEM_NAME_TO_ID.bandlepipes]: {
		FANFARE_MOVE_SPEED: itemVariableValue('MoveSpeed', { item: ITEMS_BY_NAME.bandlepipes }).value as number,
		internalDataProperties: ['fanfare'],
		setupData(self) {
			self.internalItemData.value.fanfare = clamp(0, self.internalItemData.value.fanfare ?? 0, 1);
			return { fanfare: 0 };
		},
		imgActive(internalData: { fanfare: number }) {
			return internalData.fanfare;
		},
		variables: defineVariables({
			uninteresting: ['BuffDuration', 'MoveSpeed', 'AuraAttackSpeed'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { isRanged, itemPassivesStats }) {
					if (!(self.internalItemData.value as IInternalItemDataOf<'bandlepipes'>).fanfare) {
						return;
					}

					itemPassivesStats.moveSpeed += ITEM_SPECIFICS[ITEM_NAME_TO_ID.bandlepipes].FANFARE_MOVE_SPEED;

					const attackSpeed = itemVariableValue('AuraAttackSpeed', { item: ITEMS_BY_NAME.bandlepipes, isRanged: isRanged ?? true });
					if (typeof attackSpeed.value === 'number') {
						itemPassivesStats.bonusAttackSpeedPercent += attackSpeed.value;
					} else {
						console.warn('[ITEM_SPECIFICS Bandlepipes] failed to calculate bonus attack speed');
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.protoplasmHarness]: {
		internalDataProperties: ['pHLifeline'],
		setupData(self) {
			self.internalItemData.value.pHLifeline = clamp(0, self.internalItemData.value.pHLifeline ?? 0, 1);
			return { pHLifeline: 0 };
		},
		imgActive(internalData: { pHLifeline: number }) {
			return internalData.pHLifeline;
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				TotalHealthRegen: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['f1', 'LowHealthThreshold', 'Duration', 'SizeIncrease', 'MSAmount', 'TenacityAmount'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'protoplasmHarness'>).pHLifeline) {
						const { MSAmount, TenacityAmount } = ITEMS_BY_NAME.protoplasmHarness?.dataValues ?? {};
						itemPassivesStats.tenacity = addMultiplicative(itemPassivesStats.tenacity, TenacityAmount);
						calculatedVariables.totalBonusPercentMoveSpeed += MSAmount;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.frozenHeart]: {
		internalDataProperties: ['wCaress'],
		setupData(self) {
			self.internalItemData.value.wCaress = clamp(0, self.internalItemData.value.wCaress ?? 0, 1);
			return { wCaress: 0 };
		},
		imgActive(internalData: { wCaress: number }) {
			return internalData.wCaress;
		},
		variables: defineVariables({
			uninteresting: ['ASPDSlow'],
		}),
	},
	[ITEM_NAME_TO_ID.serpentsFang]: {
		internalDataProperties: ['sVenom'],
		setupData(self) {
			self.internalItemData.value.sVenom = clamp(0, self.internalItemData.value.sVenom ?? 0, 1);
			return { sVenom: 0 };
		},
		imgActive(internalData: { sVenom: number }) {
			return internalData.sVenom;
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			uninteresting: ['f1', 'DebuffDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.rylaisScepter]: {
		internalDataProperties: ['rimefrost'],
		setupData(self) {
			self.internalItemData.value.rimefrost = clamp(0, self.internalItemData.value.rimefrost ?? 0, 1);
			return { rimefrost: 0 };
		},
		imgActive(internalData: { rimefrost: number }) {
			return internalData.rimefrost;
		},
		variables: defineVariables({
			meta: {
				SlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.fiendhunterBolts]: {
		internalDataProperties: ['oBarrage'],
		setupData(self) {
			self.internalItemData.value.oBarrage = clamp(0, self.internalItemData.value.oBarrage ?? 0, 1);
			return { oBarrage: 0 };
		},
		imgActive(internalData: { oBarrage: number }) {
			return internalData.oBarrage;
		},
		variables: defineVariables({
			// TODO figure out if it's possible/makes sense to have these variables here
			// known: {
			// 	BasicAttackDamage: [],
			// 	CriticalAttackDamage: [],
			// },
			uninteresting: ['UltimateHaste', 'NumberOfAttacks', 'Duration', 'BonusAS', 'CritModifier', 'BonusTrueDamage'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'fiendhunterBolts'>).oBarrage) {
						itemPassivesStats.bonusAttackSpeedPercent += ITEMS_BY_NAME.fiendhunterBolts?.dataValues.BonusAS;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.abyssalMask]: {
		internalDataProperties: ['unmake'],
		setupData(self) {
			self.internalItemData.value.unmake = clamp(0, self.internalItemData.value.unmake ?? 0, 1);
			return { unmake: 0 };
		},
		imgActive(internalData: { unmake: number }) {
			return internalData.unmake;
		},
	},
	[ITEM_NAME_TO_ID.horizonFocus]: {
		internalDataProperties: ['hypershot'],
		setupData(self) {
			self.internalItemData.value.hypershot = clamp(0, self.internalItemData.value.hypershot ?? 0, 1);
			return { hypershot: 0 };
		},
		imgActive(internalData: { hypershot: number }) {
			return internalData.hypershot;
		},
	},
	[ITEM_NAME_TO_ID.actualizer]: {
		internalDataProperties: ['empowered'],
		setupData(self) {
			self.internalItemData.value.empowered = clamp(0, self.internalItemData.value.empowered ?? 0, 1);
			return { empowered: 0 };
		},
		imgActive(internalData: { empowered: number }) {
			return internalData.empowered;
		},
		variables: defineVariables({
			meta: {
				ManaCalc: {
					isPercentage: true,
				},
			},
			uninteresting: ['Duration', 'ManaCostIncrease', 'CooldownTick'],
		}),
		calculateHooks: {
			postTotal: {
				// TODO use those values & check if works
				handler(self, { bonusStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'actualizer'>).empowered) {
						const bonusPercent = itemVariableValue('ManaCalc', { item: ITEMS_BY_NAME.actualizer, damageSource: { stats: { value: { bonus: bonusStats } } } as DamageSource });
						if (typeof bonusPercent.value === 'number') {
							calculatedVariables.actualizerBuffPercent = bonusPercent.value;
						} else {
							console.warn('[ITEM_SPECIFICS actualizer] failed to calculate buff bonus percent', bonusPercent);
						}
					}
				},
				priority: HOOK_PRIORITIES.postTotal[ITEM_NAME_TO_ID.actualizer],
			},
		},
	},
	[ITEM_NAME_TO_ID.hexoptics]: {
		MAX_STACKS: ITEMS_BY_NAME.hexoptics?.dataValues.MaxRange,
		internalDataProperties: ['magnification', 'arcaneAim'],
		setupData(self) {
			self.internalItemData.value.magnification = clamp(0, self.internalItemData.value.magnification ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.hexoptics].MAX_STACKS);
			self.internalItemData.value.arcaneAim = clamp(0, self.internalItemData.value.arcaneAim ?? 0, 1);
			return { magnification: 0, arcaneAim: 0 };
		},
		imgTextLabel: 'Magnification % damage increase',
		imgText(self) {
			const { hexopticsBonusDamagePercent } = self.stats.value.variables;
			return hexopticsBonusDamagePercent && `${roundNumber(hexopticsBonusDamagePercent * 100, 1)}%`;
		},
		variables: defineVariables({
			known: {
				DamageAmp: [],
			},
			calculate(self) {
				return {
					DamageAmp: {
						value: self.stats.value.variables.hexopticsBonusDamagePercent,
					},
				};
			},
			meta: {
				DamageAmp: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['MaxDamageAmp', 'MaxRange', 'TakedownWindow', 'ExtraRange', 'Duration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					const { dataValues: { MaxRange, MaxDamageAmp } } = ITEMS_BY_NAME.hexoptics ?? {};
					const { arcaneAim, magnification } = self.internalItemData.value as IInternalItemDataOf<'hexoptics'>;
					calculatedVariables.hexopticsBonusDamagePercent = magnification / MaxRange * MaxDamageAmp;
					if (arcaneAim) {
						itemPassivesStats.attackRange += ITEMS_BY_NAME.hexoptics?.dataValues.ExtraRange;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.youmuu]: {
		internalDataProperties: ['haunt', 'wStep'],
		setupData(self) {
			self.internalItemData.value.haunt = clamp(0, self.internalItemData.value.haunt ?? 0, 1);
			self.internalItemData.value.wStep = clamp(0, self.internalItemData.value.wStep ?? 0, 1);
			return { haunt: 0, wStep: 0 };
		},
		imgActive(internalData: { haunt: number; wStep: number }) {
			return [internalData.haunt, internalData.wStep];
		},
		variables: defineVariables({
			known: {
				lolcalcChampRange: [],
			},
			calculate() {
				const { MeleeItemCalcValueB, RangedItemCalcValueB } = ITEMS_BY_NAME.youmuu?.dataValues ?? {};
				return {
					lolcalcChampRange: {
						value: [MeleeItemCalcValueB, RangedItemCalcValueB],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					isPercentage: true,
					displayedName: 'ActiveMoveSpeed',
				},
			},
			uninteresting: ['OOCMS', 'Duration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { isRanged, itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'youmuu'>).haunt) {
						const oocMS = itemVariableValue('OOCMS', { item: ITEMS_BY_NAME.youmuu, isRanged: isRanged ?? true });

						if (typeof oocMS.value === 'number') {
							itemPassivesStats.moveSpeed += oocMS.value;
						} else {
							console.warn('[ITEM_SPECIFICS youmuu] failed to calculate ooc ms');
						}
					}

					if ((self.internalItemData.value as IInternalItemDataOf<'youmuu'>).wStep) {
						const { MeleeItemCalcValueB, RangedItemCalcValueB } = ITEMS_BY_NAME.youmuu?.dataValues ?? {};

						calculatedVariables.totalBonusPercentMoveSpeed += (isRanged === true ? RangedItemCalcValueB : MeleeItemCalcValueB) / 100;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.forceOfNature]: {
		internalDataProperties: ['steadfast'],
		setupData(self) {
			self.internalItemData.value.steadfast = clamp(0, self.internalItemData.value.steadfast ?? 0, 1);
			return { steadfast: 0 };
		},
		imgActive(internalData: { steadfast: number }) {
			return internalData.steadfast;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'forceOfNature'>).steadfast) {
						itemPassivesStats.magicResist += ITEMS_BY_NAME.forceOfNature?.dataValues.BonusMagicResist;
						calculatedVariables.totalBonusPercentMoveSpeed += ITEMS_BY_NAME.forceOfNature?.dataValues.MoveSpeed;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.deadMansPlate]: {
		MAX_STACKS: ITEMS_BY_NAME.deadMansPlate?.dataValues.MaxStacks,
		internalDataProperties: ['shipwrecker'],
		setupData(self) {
			self.internalItemData.value.shipwrecker = clamp(0, self.internalItemData.value.shipwrecker ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.deadMansPlate].MAX_STACKS);
			return { shipwrecker: 0 };
		},
		imgTextLabel: 'Shipwrecker stacks',
		imgText(self) {
			return (self.internalItemData.value as { shipwrecker: number }).shipwrecker;
		},
		variables: defineVariables({
			known: {
				DamageCalc: [],
			},
			calculate(self): {
				DamageCalc: IVariableValueResult;
			} {
				const { shipwrecker = 0 } = self.internalItemData.value;
				/* according to the [wiki](https://wiki.leagueoflegends.com/en-us/Dead_Man's_Plate) the ad ratio also scales with stacks reaching 100% base at 100 stacks */
				const baseRatio = shipwrecker / ITEM_SPECIFICS[ITEM_NAME_TO_ID.deadMansPlate].MAX_STACKS;

				const base = variableResolveFn(
					ITEMS_BY_NAME.deadMansPlate?.itemCalculations.MaxDamageCalc.mFormulaParts[0],
				)?.(ITEMS_BY_NAME.deadMansPlate?.itemCalculations.MaxDamageCalc.mFormulaParts[0] as any, ITEMS_BY_NAME.deadMansPlate, {
					variableValueFn: itemVariableValue,
					variableValueParams: {
						item: ITEMS_BY_NAME.deadMansPlate,
					},
				})?.value;
				if (typeof base !== 'number') {
					console.warn(`[ITEM_SPECIFICS] dead man's plate failed to calculate base damage`);
				}

				const { BonusDamagePerStack } = ITEMS_BY_NAME.deadMansPlate?.dataValues ?? 0;

				return {
					DamageCalc: {
						value: (base as number) * baseRatio + BonusDamagePerStack * shipwrecker,
					},
				};
			},
			meta: {
				MaxDamageCalc: {
					type: VariableType.physical,
				},
				DamageCalc: {
					type: VariableType.physical,
					isCustom: true,
				},
			},
			uninteresting: ['MaxMovementSpeed', 'SlowResistTooltip'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					const { MaxStacks, MaxMovementSpeed } = ITEMS_BY_NAME.deadMansPlate?.dataValues ?? {};
					/* either the numbers in the game of the current stacks are wrong or the scaling isn't linear but it's not a priority at the moment so keeping it linear */
					calculatedVariables.deadMansMoveSpeed = MaxMovementSpeed * (self.internalItemData.value as IInternalItemDataOf<'deadMansPlate'>).shipwrecker / MaxStacks;
					itemPassivesStats.moveSpeed += calculatedVariables.deadMansMoveSpeed;
					itemPassivesStats.slowResist = addMultiplicative(itemPassivesStats.slowResist, ITEMS_BY_NAME.deadMansPlate?.dataValues.SlowResistTooltip);
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.bloodlettersCurse]: {
		MAX_STACKS: ITEMS_BY_NAME.bloodlettersCurse?.dataValues.MaxStacks,
		internalDataProperties: ['vDecay'],
		setupData(self) {
			self.internalItemData.value.vDecay = Math.max(0, Math.min(
				ITEM_SPECIFICS[ITEM_NAME_TO_ID.bloodlettersCurse].MAX_STACKS,
				self.internalItemData.value.vDecay ?? 0,
			));
			return { vDecay: 0 };
		},
		imgTextLabel: 'Vile Decay stacks',
		imgText(self) {
			return self.internalItemData.value.vDecay;
		},
		variables: defineVariables({
			known: {
				Shred: [],
				MagicResistShredded: [],
			},
			calculate(self, target): { Shred: IVariableValueResult; MagicResistShredded: IVariableValueResult } {
				return {
					Shred: {
						value: self.effectsOntoTargetVars.value.bloodlettersVDecayShred ?? 0,
					},
					MagicResistShredded: {
						value: ((self.internalItemData.value as IInternalItemDataOf<'bloodlettersCurse'>).vDecay && target?.stats.value.debuffs.shreddedMR) ?? 0,
					},
				};
			},
			meta: {
				Shred: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				MagicResistShredded: {
					isCustom: true,
				},
			},
			uninteresting: ['InternalCD', 'DebuffDuration', 'ShredPerStack', 'MaxStacks'],
		}),
		effectOntoTargetVars(self, vars) {
			vars.bloodlettersVDecayShred = (self.internalItemData.value as IInternalItemDataOf<'bloodlettersCurse'>).vDecay * ITEMS_BY_NAME.bloodlettersCurse?.dataValues.ShredPerStack;
		},
	},
	[ITEM_NAME_TO_ID.experimentalHexplate]: {
		internalDataProperties: ['overdrive'],
		setupData(self) {
			self.internalItemData.value.overdrive = clamp(0, self.internalItemData.value.overdrive ?? 0, 1);
			return { overdrive: 0 };
		},
		imgActive(internalData: { overdrive: number }) {
			return internalData.overdrive;
		},
		variables: defineVariables({
			uninteresting: ['UltimateHaste', 'HasteDuration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { isRanged, itemPassivesStats }, { calculatedVariables }) {
					if (!(self.internalItemData.value as IInternalItemDataOf<'experimentalHexplate'>).overdrive) {
						return;
					}

					const bonusAS = itemVariableValue('BonusAS', { item: ITEMS_BY_NAME.experimentalHexplate, isRanged: isRanged ?? true });
					if (typeof bonusAS.value === 'number') {
						itemPassivesStats.bonusAttackSpeedPercent += bonusAS.value / 100;
					} else {
						console.warn('[ITEM_SPECIFICS experimental hexplate] failed to calculate bonus attack speed', bonusAS);
					}

					const bonusMS = itemVariableValue('BonusMS', { item: ITEMS_BY_NAME.experimentalHexplate, isRanged: isRanged ?? true });
					if (typeof bonusMS.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += bonusMS.value / 100;
					} else {
						console.warn('[ITEM_SPECIFICS experimental hexplate] failed to calculate bonus attack speed', bonusMS);
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		internalDataProperties: ['cConsumption'],
		setupData(self) {
			self.internalItemData.value.cConsumption = Math.max(0, self.internalItemData.value.cConsumption ?? 0);
			return { cConsumption: 0 };
		},
		imgTextLabel: 'Colosal Consumption health increase',
		imgText(self) {
			return (self.internalItemData.value as { cConsumption: number }).cConsumption;
		},
		variables: defineVariables({
			known: {
				f4: [],
				f5: [],
			},
			calculate(self) {
				const consumptionDamage = itemVariableValue('DamageProcCalc', { item: ITEMS_BY_NAME.heartsteel, damageSource: self });
				return {
					f4: consumptionDamage,
					f5: {
						value: consumptionDamage.value as number * ITEMS_BY_NAME.heartsteel?.dataValues.DamageToMaxHealthRatio,
					},
				};
			},
			meta: {
				f4: {
					type: VariableType.physical,
					displayedName: 'ConsumptionDamage',
				},
				f5: {
					displayedName: 'ConsumptionHPGain',
				},
			},
			uninteresting: ['TotalDemolishTime', 'BaseDamage', 'MaxHPRatio', 'DamageToMaxHealthRatio', 'HealthSizeThreshold', 'SizeAmount', 'SizeCap'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats, itemStatIncreases }) {
					const { cConsumption } = self.internalItemData.value as IInternalItemDataOf<'heartsteel'>;
					itemPassivesStats.hp += cConsumption ?? 0;

					itemStatIncreases[ITEM_NAME_TO_ID.heartsteel] ??= {};
					itemStatIncreases[ITEM_NAME_TO_ID.heartsteel]!.FlatHPPoolMod = cConsumption;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		MAX_STACKS: ITEMS_BY_NAME.guinsoo?.dataValues.MaxStacks,
		internalDataProperties: ['seething'],
		setupData(self) {
			self.internalItemData.value.seething = clamp(0, self.internalItemData.value.seething ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.guinsoo].MAX_STACKS);
			return { seething: 0 };
		},
		imgTextLabel: 'Seething Strikes stacks',
		imgText(self) {
			return (self.internalItemData.value as { seething: number }).seething;
		},
		variables: defineVariables({
			meta: {
				OnHitDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['AttackSpeedPerStack', 'BuffDuration', 'MaxStacks'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats, baseStats }) {
					const { seething } = self.internalItemData.value;
					const bonusAttackSpeedPercent = seething * ITEMS_BY_NAME.guinsoo?.dataValues.AttackSpeedPerStack;
					itemPassivesStats.bonusAttackSpeedPercent += bonusAttackSpeedPercent;
					itemPassivesStats.attackSpeed += bonusAttackSpeedPercent * baseStats.attackSpeedRatio;
				},
				priority: HOOK_PRIORITIES.preItemTotal[ITEM_NAME_TO_ID.guinsoo],
			},
		},
	},
	[ITEM_NAME_TO_ID.terminus]: {
		MAX_STACKS: Math.round(ITEMS_BY_NAME.terminus?.dataValues.PenMax / ITEMS_BY_NAME.terminus?.dataValues.PenPerHit),
		internalDataProperties: ['jxtpL', 'jxtpD'],
		setupData(self) {
			self.internalItemData.value.jxtpL = clamp(0, self.internalItemData.value.jxtpL ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.terminus].MAX_STACKS);
			self.internalItemData.value.jxtpD = clamp(0, self.internalItemData.value.jxtpD ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.terminus].MAX_STACKS);
			return { jxtpL: 0, jxtpD: 0 };
		},
		imgTextLabel: 'Juxtaposition stacks (light | dark)',
		imgText(self, property?: 'jxtpL' | 'jxtpD') {
			const data = self.internalItemData.value as { jxtpL: number; jxtpD: number };
			return property ? data[property] : (data.jxtpD || data.jxtpL) && `${data.jxtpL} | ${data.jxtpD}`;
		},
		variables: defineVariables({
			known: {
				f1: [],
				TotalPen: [],
				TotalResists: [],
			},
			calculate(self) {
				return {
					f1: { value: 0 },
					TotalPen: { value: self.stats.value.variables.terminusPercentagePen ?? 0 },
					TotalResists: { value: self.stats.value.variables.terminusResists ?? 0 },
				};
			},
			meta: {
				OnHitDamage: {
					type: VariableType.magic,
				},
				TotalPen: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				TotalResists: {
					isCustom: true,
				},
			},
			uninteresting: ['f1', 'ARMRMaxScaling', 'PenPerHit', 'PenMax', 'BuffDuration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					const { jxtpL, jxtpD } = self.internalItemData.value as IInternalItemDataOf<'terminus'>;
					const penPerStack = ITEMS_BY_NAME.terminus?.dataValues.PenPerHit;

					const totalPen = jxtpD * penPerStack;
					itemPassivesStats.percentArmorPen = addMultiplicative(itemPassivesStats.percentArmorPen, totalPen);
					itemPassivesStats.percentMagicPen = addMultiplicative(itemPassivesStats.percentMagicPen, totalPen);
					calculatedVariables.terminusPercentagePen = totalPen;

					const resistPerStack = itemVariableValue('ARMRPerHitScaling', { item: ITEMS_BY_NAME.terminus, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof resistPerStack.value === 'number') {
						const totalResists = resistPerStack.value * jxtpL;
						itemPassivesStats.armor += totalResists;
						itemPassivesStats.magicResist += totalResists;
						calculatedVariables.terminusResists = totalResists;
					} else {
						console.warn('[ITEM_SPECIFICS terminus] failed to calculate resists per stack', resistPerStack);
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.cosmicDrive]: {
		internalDataProperties: ['spelldance'],
		setupData(self) {
			self.internalItemData.value.spelldance = clamp(0, self.internalItemData.value.spelldance ?? 0, 1);
			return { spelldance: 0 };
		},
		imgActive(internalData: { spelldance: number }) {
			return internalData.spelldance;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'cosmicDrive'>).spelldance) {
						const moveSpeed = itemVariableValue('MovespeedAmount', { item: ITEMS_BY_NAME.cosmicDrive });

						if (typeof moveSpeed.value === 'number') {
							itemPassivesStats.moveSpeed += moveSpeed.value;
						} else {
							console.warn('[ITEM_SPECIFICS cosmic drive] failed to calculate move speed', moveSpeed);
						}
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.endlessHunger]: {
		internalDataProperties: ['feast'],
		setupData(self) {
			self.internalItemData.value.feast = clamp(0, self.internalItemData.value.feast ?? 0, 1);
			return { feast: 0 };
		},
		imgActive(internalData: { feast: number }) {
			return internalData.feast;
		},
		variables: defineVariables({
			uninteresting: ['OmnivampDuration', 'OmnivampOnTakedown', 'TakedownWindow'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'endlessHunger'>).feast) {
						calculatedVariables.endlessOmnivamp = ITEMS_BY_NAME.endlessHunger?.dataValues.OmnivampOnTakedown;
						itemPassivesStats.omnivamp += calculatedVariables.endlessOmnivamp;
					}
				},
			},
			postTotal: {
				handler(_self, { isRanged, totalStats, bonusStats, itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug }) {
					const hasteMultiplier = itemVariableValue('HasteFromAD', {
						item: ITEMS_BY_NAME.endlessHunger,
						isRanged: isRanged ?? true,
						damageSource: { stats: { value: { bonus: bonusStats } } } as DamageSource,
					});

					if (typeof hasteMultiplier.value === 'number') {
						miscDebug.endlessBonusAd = bonusStats.attackDamage;
						calculatedVariables.endlessHaste = hasteMultiplier.value;

						totalStats.abilityHaste += calculatedVariables.endlessHaste;
						bonusStats.abilityHaste += calculatedVariables.endlessHaste;
						itemPassivesStats.abilityHaste += calculatedVariables.endlessHaste;
						itemTotalStats.abilityHaste += calculatedVariables.endlessHaste;
					} else {
						console.warn('[ITEM_SPECIFICS endless hunger] failed to calculate haste multiplier', hasteMultiplier);
					}
				},
				priority: HOOK_PRIORITIES.postTotal[ITEM_NAME_TO_ID.endlessHunger],
			},
		},
	},
	[ITEM_NAME_TO_ID.hexdrinker]: {
		variables: defineVariables({
			meta: {
				MeleeRangedSplit: {
					displayedName: 'Shield',
				},
			},
			uninteresting: ['LowHealthThreshold', 'ShieldLifetime'],
		}),
	},
	[ITEM_NAME_TO_ID.mawOfMalmortius]: {
		internalDataProperties: ['mawLifeline'],
		setupData(self) {
			self.internalItemData.value.mawLifeline = clamp(0, self.internalItemData.value.mawLifeline ?? 0, 1);
			return { mawLifeline: 0 };
		},
		imgActive(internalData: { mawLifeline: number }) {
			return internalData.mawLifeline;
		},
		variables: defineVariables({
			known: {
				f4: [],
				lolcalcChampRange: [],
			},
			calculate(self) {
				return {
					f4: { value: 0 },
					lolcalcChampRange: [
						itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.mawOfMalmortius, damageSource: self, isRanged: false }),
						itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.mawOfMalmortius, damageSource: self, isRanged: true }),
					],
				};
			},
			meta: {
				lolcalcChampRange: {
					displayedName: 'Shield',
				},
			},
			uninteresting: ['f4', 'LowHealthThreshold', 'ShieldDuration', 'BuffVamp'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'mawOfMalmortius'>).mawLifeline) {
						itemPassivesStats.omnivamp += ITEMS_BY_NAME.mawOfMalmortius.dataValues.BuffVamp;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.jakSho]: {
		internalDataProperties: ['vbResistance'],
		setupData(self) {
			self.internalItemData.value.vbResistance = clamp(0, self.internalItemData.value.vbResistance ?? 0, 1);
			return { vbResistance: 0 };
		},
		imgActive(internalData: { vbResistance: number }) {
			return internalData.vbResistance;
		},
		variables: defineVariables({
			known: {
				BonusArmor: [],
				BonusMagicResist: [],
			},
			calculate(self) {
				return {
					BonusArmor: {
						value: self.stats.value.variables.jakShoArmor ?? 0,
					},
					BonusMagicResist: {
						value: self.stats.value.variables.jakShoMagicResist ?? 0,
					},
				};
			},
			meta: {
				BonusArmor: {
					isCustom: true,
				},
				BonusMagicResist: {
					isCustom: true,
				},
			},
			uninteresting: ['MaxStacks', 'BonusResistPercentage'],
		}),
		calculateHooks: {
			onTotalPreMultipliers: {
				handler(self, { itemPassivesStats, itemTotalStats, bonusStats, totalMultipliersStats }, { calculatedVariables }) {
					if (!(self.internalItemData.value as IInternalItemDataOf<'jakSho'>).vbResistance) {
						return;
					}
					const resistPercentage = itemVariableValue('BonusResistPercentage', { item: ITEMS_BY_NAME.jakSho });
					if (typeof resistPercentage.value === 'number') {
						calculatedVariables.jakShoBonusResistMultiplier = resistPercentage.value;
						calculatedVariables.jakShoArmor = bonusStats.armor * resistPercentage.value;
						calculatedVariables.jakShoMagicResist = bonusStats.magicResist * resistPercentage.value;
						itemPassivesStats.armor += calculatedVariables.jakShoArmor;
						itemPassivesStats.magicResist += calculatedVariables.jakShoMagicResist;
						itemTotalStats.armor += calculatedVariables.jakShoArmor;
						itemTotalStats.magicResist += calculatedVariables.jakShoMagicResist;
						totalMultipliersStats.armor += calculatedVariables.jakShoArmor;
						totalMultipliersStats.magicResist += calculatedVariables.jakShoMagicResist;
					} else {
						console.warn('[ITEM_SPECIFICS Jak\'Sho] failed to calculate bonus resist percentage');
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.gluttonousGreaves]: gluttonousGreavesSpecific,
	[ITEM_NAME_TO_ID.immortalPath]: {
		...gluttonousGreavesSpecific,
		calculateHooks: {
			preItemTotal: gluttonousGreavesSpecific.calculateHooks.preItemTotal,
			postTotal: {
				handler(self, { totalStats }, { calculatedVariables }) {
					if (self.currentHealth.value < Math.ceil(totalStats.hp / 2)) {
						const value = ITEMS_BY_NAME.immortalPath?.dataValues.HealingMod;
						calculatedVariables.hpRegenMult += value;
						calculatedVariables.lifeStealOmnivampMult = combineRecursive(calculatedVariables.lifeStealOmnivampMult, value);
						calculatedVariables.healMult = combineCompounding(calculatedVariables.healMult, value);
						calculatedVariables.shieldMult = combineCompounding(calculatedVariables.shieldMult, value);
					} else {
						calculatedVariables.immortalPathBonusDamagePercent = ITEMS_BY_NAME.immortalPath?.dataValues.DamageMod;
					}
				},
				priority: HOOK_PRIORITIES.postTotal[ITEM_NAME_TO_ID.immortalPath],
			},
		},
	},
	[ITEM_NAME_TO_ID.rabadon]: {
		AP_MULTIPLIER: ITEMS_BY_NAME.rabadon?.dataValues.APAmp,
		calculateHooks: {
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
					const value = calculatedVariables.apMultipliersBase * ITEM_SPECIFICS[ITEM_NAME_TO_ID.rabadon].AP_MULTIPLIER;
					calculatedVariables.totalItemApMultipliers += ITEM_SPECIFICS[ITEM_NAME_TO_ID.rabadon].AP_MULTIPLIER;
					itemPassivesStats.abilityPower += value;
					itemTotalStats.abilityPower += value;
					calculatedVariables.rabadonMagicalOpus = value;
				},
			},
			onTotalPreMultipliers: {
				handler(_self, { adaptiveForceMeta, itemPassivesStats, totalMultipliersStats, itemTotalStats }, { calculatedVariables }) {
					if (calculatedVariables.swiftmarchAdaptive && adaptiveForceMeta[0] === 'abilityPower') {
						const value = calculatedVariables.swiftmarchAdaptive * ITEM_SPECIFICS[ITEM_NAME_TO_ID.rabadon].AP_MULTIPLIER!;
						calculatedVariables.rabadonMagicalOpus! += value;
						itemPassivesStats.abilityPower += value;
						totalMultipliersStats.abilityPower += value;
						itemTotalStats.abilityPower += value;
					}
				},
				priority: HOOK_PRIORITIES.onTotalPreMultipliers[ITEM_NAME_TO_ID.rabadon],
			},
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate(self) {
				return {
					/** ap gained from passive */
					f1: {
						value: self.stats.value.variables.rabadonMagicalOpus
							?? (self.stats.value.variables.apMultipliersBase * ITEMS_BY_NAME.rabadon?.dataValues.APAmp),
					},
				};
			},
		}),
	},
	[ITEM_NAME_TO_ID.knightsVow]: {
		variables: defineVariables({
			known: {
				f1: [],
				f3: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f3: { value: 0 },
				};
			},
		}),
	},
	[ITEM_NAME_TO_ID.doransShield]: {
		variables: {
			uninteresting: ['FlatHPRegenMod', 'RegenDuration', 'BonusDamageToMinions', 'RangeRegenMult'],
		},
	},
	[ITEM_NAME_TO_ID.lichBane]: {
		internalDataProperties: ['spActive'],
		setupData(self) {
			self.internalItemData.value.spActive = clamp(0, self.internalItemData.value.spActive ?? 0, 1);
			return { spActive: 0 };
		},
		imgActive(internalData: { spActive: number }) {
			return internalData.spActive;
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				SpellbladeDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f1', 'SpellBladeDuration', 'SheenASBuff'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemPassivesStats, baseStats }) {
					const { spActive } = self.internalItemData.value;
					const bonusAttackSpeedPercent = spActive * ITEMS_BY_NAME.lichBane?.dataValues.SheenASBuff;
					itemPassivesStats.bonusAttackSpeedPercent += bonusAttackSpeedPercent;
					itemPassivesStats.attackSpeed += bonusAttackSpeedPercent * baseStats.attackSpeedRatio;
				},
				priority: HOOK_PRIORITIES.preItemTotal[ITEM_NAME_TO_ID.guinsoo],
			},
		},
	},
	[ITEM_NAME_TO_ID.botrk]: {
		internalDataProperties: ['cShadows'],
		setupData(self) {
			self.internalItemData.value.cShadows = clamp(0, self.internalItemData.value.cShadows ?? 0, 1);
			return { cShadows: 0 };
		},
		imgActive(internalData: { cShadows: number }) {
			return internalData.cShadows;
		},
		variables: defineVariables({
			known: {
				f4: [],
				lolcalcChampRange: [],
				CurrentHealthDamage: [],
			},
			calculate(_self, target) {
				const { MeleeValue, RangedValue } = ITEMS_BY_NAME.botrk?.dataValues ?? {};
				const targetHealth = target?.currentHealth.value ?? 0;

				return {
					f4: { value: 0 },
					lolcalcChampRange: {
						value: [MeleeValue, RangedValue],
					},
					CurrentHealthDamage: {
						value: [targetHealth * MeleeValue, targetHealth * RangedValue],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					type: VariableType.physical,
					displayedName: 'CurrentHealthPercent',
					isPercentage: true,
					multiplier: 100,
				},
				CurrentHealthDamage: {
					type: VariableType.physical,
					isCustom: true,
				},
			},
			uninteresting: ['f4', 'MoveSpeedMod', 'MoveSpeedDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.overlordsBloodmail]: {
		BONUS_AD_PERCENTAGE: (damageSource: DamageSource, maxHpOverride?: number) => {
			const maxValueAt = variableResolveFn(ITEMS_BY_NAME.overlordsBloodmail?.itemCalculations.RemainingHealthThreshold)?.(
				ITEMS_BY_NAME.overlordsBloodmail?.itemCalculations.RemainingHealthThreshold,
				ITEMS_BY_NAME.overlordsBloodmail,
				{
					variableValueFn: itemVariableValue,
					variableValueParams: {
						item: ITEMS_BY_NAME.overlordsBloodmail,
						damageSource,
					},
				},
			);
			if (!maxValueAt || typeof maxValueAt.value !== 'number') {
				console.error('[ITEM_SPECIFICS bloodmail] failed to resolve RemainingHealthThreshold variable value');
				return Number.NaN;
			}

			const currentHealthP = Math.min(damageSource.currentHealth.value / (maxHpOverride ?? Math.max(damageSource.stats.value.total.hp, 1)), 1);
			const missingHealthP = 1 - currentHealthP;
			const maxMissingHealthP = 1 - maxValueAt.value;
			return ITEMS_BY_NAME.overlordsBloodmail?.dataValues.MissingHealthAD * Math.min(1, missingHealthP / maxMissingHealthP);
		},
		imgTextLabel: 'Retribution ad increase',
		imgText(damageSource) {
			return damageSource.stats.value.variables.bloodmailRetribution
				? Math.round(damageSource.stats.value.variables.bloodmailRetribution)
				: 0;
		},
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate(self) {
				return {
					f1: {
						value: self.stats.value.variables.bloodmailTyranny
							?? self.stats.value.bonus.hp * ITEMS_BY_NAME.overlordsBloodmail?.dataValues.HPToADPercentage,
						calculatesFrom: [{
							stat: 'hp',
							value: ITEMS_BY_NAME.overlordsBloodmail?.dataValues.HPToADPercentage,
							isPercentage: true,
							type: 'bonus',
						}],
					},
					f2: {
						value: self.stats.value.variables.bloodmailRetribution
							?? self.stats.value.bonus.attackDamage,
					},
				};
			},
			meta: {
				f1: {
					displayedName: 'BonusHPAD',
				},
				f2: {
					displayedName: 'MissingHPAD',
				},
				RemainingHealthThreshold: {
					isPercentage: true,
					multiplier: 100,
				},
			},
			uninteresting: ['HPToADPercentage', 'MissingHealthAD', 'RemainingHealthThreshold'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemBaseStats, itemPassivesStats }, { calculatedVariables, miscDebug }) {
					const value = (itemBaseStats.hp + itemPassivesStats.hp) * ITEMS_BY_NAME.overlordsBloodmail?.dataValues.HPToADPercentage;
					miscDebug.bloodmailBonusHp = (itemBaseStats.hp + itemPassivesStats.hp);
					calculatedVariables.bloodmailTyranny = value;
					itemPassivesStats.attackDamage += value;
				},
				priority: HOOK_PRIORITIES.preItemTotal[ITEM_NAME_TO_ID.overlordsBloodmail],
			},
			preBonus: {
				handler(_self, { runeShardStats, itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug }) {
					if (runeShardStats.hp) {
						const value = runeShardStats.hp * ITEMS_BY_NAME.overlordsBloodmail?.dataValues.HPToADPercentage;
						miscDebug.bloodmailBonusHp! += runeShardStats.hp;
						calculatedVariables.bloodmailTyranny! += value;
						itemPassivesStats.attackDamage += value;
						itemTotalStats.attackDamage += value;
					}
				},
				priority: HOOK_PRIORITIES.preBonus[ITEM_NAME_TO_ID.overlordsBloodmail],
			},
			postTotal: {
				handler(self, { totalStats, bonusStats, totalMultipliersStats, itemPassivesStats, itemTotalStats, dragonStats }, { calculatedVariables, miscDebug }) {
					const retributionBaseTotal = totalStats.attackDamage - (dragonStats.attackDamage ?? 0) - calculatedVariables.bloodmailRetributionExcludedAd;

					miscDebug.bloodmailRetributionPercentage = ITEM_SPECIFICS[ITEM_NAME_TO_ID.overlordsBloodmail].BONUS_AD_PERCENTAGE(self, totalStats.hp);
					calculatedVariables.bloodmailRetribution = retributionBaseTotal * miscDebug.bloodmailRetributionPercentage;

					itemPassivesStats.attackDamage += calculatedVariables.bloodmailRetribution;
					itemTotalStats.attackDamage += calculatedVariables.bloodmailRetribution;
					totalMultipliersStats.attackDamage += calculatedVariables.bloodmailRetribution;
					bonusStats.attackDamage += calculatedVariables.bloodmailRetribution;
					totalStats.attackDamage += calculatedVariables.bloodmailRetribution;
				},
				priority: HOOK_PRIORITIES.postTotal[ITEM_NAME_TO_ID.overlordsBloodmail],
			},
		},
	},
	[ITEM_NAME_TO_ID.steraksGage]: {
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemPassivesStats, baseOnLevelStats }, { calculatedVariables }) {
					const value = variableResolveFn(ITEMS_BY_NAME.steraksGage?.itemCalculations.BonusAD)?.(
						ITEMS_BY_NAME.steraksGage?.itemCalculations.BonusAD,
						ITEMS_BY_NAME.steraksGage,
						{
							variableValueFn: itemVariableValue,
							variableValueParams: {
								item: ITEMS_BY_NAME.steraksGage,
								damageSource: { stats: { value: { baseOnLevel: baseOnLevelStats } } } as DamageSource,
							},
						},
					);
					if (typeof value?.value === 'number') {
						calculatedVariables.sterakAd = value.value;
						itemPassivesStats.attackDamage += calculatedVariables.sterakAd;
					} else {
						console.warn('[ITEM_SPECIFICS sterak\'s gage] failed to resolve BonusAD variable value');
					}
				},
			},
		},
		variables: defineVariables({
			known: {
				f5: [],
			},
			calculate() {
				return {
					f5: {
						value: 0,
					},
				};
			},
			meta: {
				ShieldSize: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['f5', 'LowHealthThreshold', 'ShieldDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.bootsOfSwiftness]: {
		variables: defineVariables({
			uninteresting: ['SlowResistTooltip'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemPassivesStats }) {
					itemPassivesStats.slowResist = addMultiplicative(itemPassivesStats.slowResist, ITEMS_BY_NAME.bootsOfSwiftness?.dataValues.SlowResistTooltip / 100);
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.swiftmarch]: {
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemPassivesStats }) {
					itemPassivesStats.slowResist = addMultiplicative(itemPassivesStats.slowResist, ITEMS_BY_NAME.swiftmarch?.dataValues.SlowResistTooltip);
				},
			},
			onTotalPreMultipliers: {
				handler(_self, { totalPreMultipliersStats, totalMultipliersStats, itemTotalStats, itemPassivesStats, adaptiveForceMeta }, { calculatedVariables, miscDebug }) {
					miscDebug.swiftmarchTotalMs = totalPreMultipliersStats.moveSpeed;
					const adaptiveForce = variableResolveFn(ITEMS_BY_NAME.swiftmarch?.itemCalculations.MSToAdaptiveCalc)?.(
						ITEMS_BY_NAME.swiftmarch?.itemCalculations.MSToAdaptiveCalc,
						ITEMS_BY_NAME.swiftmarch,
						{
							variableValueFn: itemVariableValue,
							variableValueParams: {
								item: ITEMS_BY_NAME.swiftmarch,
								damageSource: { stats: { value: { total: totalPreMultipliersStats } } } as DamageSource,
							},
						},
					);

					if (typeof adaptiveForce?.value === 'number') {
						calculatedVariables.swiftmarchAdaptive = adaptiveForce.value;
						const statValue = calculatedVariables.swiftmarchAdaptive * adaptiveForceMeta[2];

						totalMultipliersStats[adaptiveForceMeta[0]] += statValue;
						itemPassivesStats[adaptiveForceMeta[0]] += statValue;
						itemTotalStats[adaptiveForceMeta[0]] += statValue;

						if (adaptiveForceMeta[0] === 'abilityPower') {
							/** multiplied in blackfire torch's and rabadon's onTotalPreMultipliers hooks */
							calculatedVariables.apMultipliersBase += statValue;
						}
					} else {
						console.warn('[ITEM_SPECIFICS swiftmarch] failed to resolve MSToAdaptiveCalc variable value');
					}
				},
				priority: HOOK_PRIORITIES.onTotalPreMultipliers[ITEM_NAME_TO_ID.swiftmarch],
			},
		},
		variables: defineVariables({
			uninteresting: ['SlowResistTooltip', 'MSAdaptiveRatio'],
		}),
	},
	[ITEM_NAME_TO_ID.duskAndDawn]: {
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
				};
			},
			meta: {
				SpellbladeDamage: {
					type: VariableType.magic,
				},
				SpellbladeHealing: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['f1', 'f2'],
		}),
	},
	[ITEM_NAME_TO_ID.unendingDespair]: {
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				DrainCalc: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f1', 'HealMultiplier', 'Cooldown'],
		}),
	},
	[ITEM_NAME_TO_ID.fatedAshes]: {
		variables: defineVariables({
			known: {
				f2: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
				};
			},
			meta: {
				BurnFlatDamagePerSecond: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f2', 'BurnDuration', 'MonsterDamageBonus'],
		}),
	},
	[ITEM_NAME_TO_ID.bastionBreaker]: {
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			uninteresting: ['f1', 'TakedownWindow', 'BuffDuration', 'DoTDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.worldAtlas]: {
		variables: defineVariables({
			known: {
				f4: [],
				lolcalcChampRange: [],
			},
			calculate(self) {
				return {
					f4: { value: 0 },
					lolcalcChampRange: {
						value: [
							itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.worldAtlas, damageSource: self, isRanged: false }).value as number,
							itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.worldAtlas, damageSource: self, isRanged: true }).value as number,
						],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					displayedName: 'GoldOnEnemyDamage',
				},
			},
			uninteresting: ['f4', 'ChargeCooldown', 'QuestGoldRequirement', 'MaxCharges', 'ExecuteMinionGold'],
		}),
	},
	[ITEM_NAME_TO_ID.runicCompass]: {
		variables: defineVariables({
			known: {
				f4: [],
				f5: [],
				f6: [ITEMS_BY_NAME.runicCompass?.dataValues.StealthWardCap],
				lolcalcChampRange: [],
			},
			calculate(self) {
				return {
					f4: { value: 0 },
					f5: { value: 0 },
					f6: { value: ITEMS_BY_NAME.runicCompass?.dataValues.StealthWardCap },
					lolcalcChampRange: {
						value: [
							itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.runicCompass, damageSource: self, isRanged: false }).value as number,
							itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.runicCompass, damageSource: self, isRanged: true }).value as number,
						],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					displayedName: 'GoldOnEnemyDamage',
				},
			},
			uninteresting: ['f4', 'f5', 'f6', 'QuestGoldRequirement', 'ChargeCooldown', 'QuestGoldRequirement', 'MaxCharges', 'ExecuteMinionGold', 'StealthWardCap'],
		}),
	},
	[ITEM_NAME_TO_ID.zekesConvergence]: {
		internalDataProperties: ['fTempest'],
		setupData(self) {
			self.internalItemData.value.fTempest = clamp(0, self.internalItemData.value.fTempest ?? 0, 1);
			return { fTempest: 0 };
		},
		imgActive(internalData: { fTempest: number }) {
			return internalData.fTempest;
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				DamagePerSecond: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f1', 'UltimateHaste', 'Duration', 'ReadyDuration', 'SlowAmount'],
		}),
	},
	[ITEM_NAME_TO_ID.spiritVisage]: {
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
				};
			},
			uninteresting: ['f1', 'f2', 'HealingIncrease'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(_self, _stats, { calculatedVariables }) {
					const { HealingIncrease, ShieldIncrease } = ITEMS_BY_NAME.spiritVisage?.dataValues ?? {};
					calculatedVariables.hpRegenMult += HealingIncrease;
					calculatedVariables.lifeStealOmnivampMult = combineRecursive(calculatedVariables.lifeStealOmnivampMult, HealingIncrease);
					calculatedVariables.healMultAdditive += HealingIncrease;
					calculatedVariables.shieldMultAdditive += ShieldIncrease;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.sunfireAegis]: {
		imgTextLabel: '',
		imgText(damageSource) {
			const value = damageSource.computed.items.value.find(item => item && item.item.id === ITEM_NAME_TO_ID.sunfireAegis)?.variables.get('DPS')?.value;
			return typeof value === 'number' ? Math.round(value) : '';
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				DPS: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f1', 'AuraDuration', 'MinionMod', 'MonsterMod'],
		}),
	},
	[ITEM_NAME_TO_ID.brambleVest]: {
		...grievousWoundItemSpecific,
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
				f3: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
					f3: { value: 0 },
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: [...grievousWoundItemSpecific.variables.uninteresting, 'f1'],
		}),
	},
	[ITEM_NAME_TO_ID.oblivionOrb]: {
		...grievousWoundItemSpecific,
		variables: defineVariables({
			known: {
				f2: [],
				f3: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
					f3: { value: 0 },
				};
			},
			uninteresting: grievousWoundItemSpecific.variables.uninteresting,
		}),
	},
	[ITEM_NAME_TO_ID.executionersCalling]: {
		...grievousWoundItemSpecific,
		variables: defineVariables({
			known: {
				f2: [],
				f3: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
					f3: { value: 0 },
				};
			},
			uninteresting: grievousWoundItemSpecific.variables.uninteresting,
		}),
	},
	[ITEM_NAME_TO_ID.thornmail]: {
		...grievousWoundItemSpecific,
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
				f3: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
					f3: { value: 0 },
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: [...grievousWoundItemSpecific.variables.uninteresting, 'f1'],
		}),
	},
	[ITEM_NAME_TO_ID.mortalReminder]: {
		...grievousWoundItemSpecific,
		variables: defineVariables({
			known: {
				f2: [],
				f3: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
					f3: { value: 0 },
				};
			},
			uninteresting: grievousWoundItemSpecific.variables.uninteresting,
		}),
	},
	[ITEM_NAME_TO_ID.chempunkChainsword]: {
		...grievousWoundItemSpecific,
		variables: defineVariables({
			known: {
				f2: [],
				f3: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
					f3: { value: 0 },
				};
			},
			uninteresting: grievousWoundItemSpecific.variables.uninteresting,
		}),
	},
	[ITEM_NAME_TO_ID.morellonomicon]: {
		...grievousWoundItemSpecific,
		variables: defineVariables({
			known: {
				f2: [],
				f3: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
					f3: { value: 0 },
				};
			},
			uninteresting: grievousWoundItemSpecific.variables.uninteresting,
		}),
	},
	[ITEM_NAME_TO_ID.ravenousHydra]: {
		variables: defineVariables({
			known: {
				lolcalcChampRange: [],
			},
			calculate(self) {
				return {
					lolcalcChampRange: [
						itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.ravenousHydra, damageSource: self, isRanged: false }),
						itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.ravenousHydra, damageSource: self, isRanged: true }),
					],
				};
			},
			meta: {
				lolcalcChampRange: {
					displayedName: 'CleaveDamage',
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.tiamat]: {
		variables: defineVariables({
			known: {
				lolcalcChampRange: [],
			},
			calculate(self) {
				return {
					lolcalcChampRange: [
						itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.tiamat, damageSource: self, isRanged: false }),
						itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.tiamat, damageSource: self, isRanged: true }),
					],
				};
			},
			meta: {
				lolcalcChampRange: {
					type: VariableType.physical,
					displayedName: 'CleaveDamage',
				},
				PrimaryDamage: {
					type: VariableType.physical,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.wardensMail]: {
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			uninteresting: ['f1', 'BlockBase', 'WardenDamageMax'],
		}),
	},
	[ITEM_NAME_TO_ID.warmogsArmor]: {
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate(self) {
				return {
					f1: { value: 0 },
					f2: {
						value: self.stats.value.variables.warmogsVitality
							?? self.stats.value.itemBase.hp * ITEMS_BY_NAME.warmogsArmor?.dataValues.HPAmp,
					},
				};
			},
			meta: {
				f2: {
					displayedName: 'BonusMaxHP',
				},
			},
			uninteresting: ['f1', 'HealthThreshold', 'OOCTimerChampion', 'HPAmp', 'OOCTimer'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemBaseStats, itemPassivesStats }, { calculatedVariables }) {
					calculatedVariables.warmogsVitality = itemBaseStats.hp * ITEMS_BY_NAME.warmogsArmor?.dataValues.HPAmp;
					itemPassivesStats.hp += calculatedVariables.warmogsVitality;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.runaan]: {
		variables: defineVariables({
			meta: {
				BoltDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['Effect3Amount' as any],
		}),
	},
	[ITEM_NAME_TO_ID.statikkShiv]: {
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
				};
			},
			meta: {
				ChainDamage: {
					type: VariableType.magic,
				},
				NonChampChainDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f1', 'f2', 'BounceCount', 'BonusEnergizedStacks'],
		}),
	},
	[ITEM_NAME_TO_ID.witsEnd]: {
		variables: defineVariables({
			known: {
				f4: [],
			},
			calculate() {
				return {
					f4: { value: 0 },
				};
			},
			meta: {
				OnHitDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f4'],
		}),
	},
	[ITEM_NAME_TO_ID.redemption]: {
		internalDataProperties: ['aLevel'],
		setupData(self) {
			self.internalItemData.value.aLevel = clamp(CHAMPION_LEVEL.min, self.internalItemData.value.aLevel ?? self.level.value, CHAMPION_LEVEL.topQuestMax);
			return { aLevel: 0 };
		},
		variables: defineVariables({
			known: {
				f1: [],
				HealAmount: [],
			},
			calculate(self) {
				return {
					f1: { value: 0 },
					HealAmount: itemVariableValue('HealAmount', { item: ITEMS_BY_NAME.redemption, damageSource: { level: { value: self.internalItemData.value.aLevel } } as DamageSource }),
				};
			},
			meta: {
				HealAmount: {
					type: VariableType.heal,
					isCustom: true,
					/* the in game description has `(ally $i:level%)` so override the default generated 'level' to not have double */
					scalesWithStatIcon: undefined,
				},
			},
			uninteresting: ['f1', 'DamageToChampions', 'DiminishedEffect', 'HealMin', 'HealMax'],
		}),
		preplaceTextInventory(value) {
			return value.replace('@HealMin@ - @HealMax@', '@HealAmount@');
		},
	},
	[ITEM_NAME_TO_ID.ldr]: {
		variables: defineVariables({
			known: {
				f1: [],
				DamageIncrease: [],
			},
			calculate(_self, target) {
				const { MaxBonusDamagePercent, MaxBonusHealth } = ITEMS_BY_NAME.ldr?.dataValues ?? {};
				return {
					f1: { value: 0 },
					DamageIncrease: {
						value: MaxBonusDamagePercent * Math.min(target?.stats.value.bonus.hp ?? 0, MaxBonusHealth) / MaxBonusHealth * 100,
					},
				};
			},
			meta: {
				DamageIncrease: {
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['f1', 'MaxBonusDamagePercent', 'MaxBonusHealth'],
		}),
	},
	[ITEM_NAME_TO_ID.nashorsTooth]: {
		variables: defineVariables({
			known: {
				f2: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
				};
			},
			meta: {
				TotalOnHitDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f2'],
		}),
	},
	[ITEM_NAME_TO_ID.malignance]: {
		internalDataProperties: ['hatefog'],
		setupData(self) {
			self.internalItemData.value.hatefog = clamp(0, self.internalItemData.value.hatefog ?? 0, 1);
			return { hatefog: 0 };
		},
		variables: defineVariables({
			known: {
				f4: [],
			},
			calculate() {
				return {
					f4: { value: 0 },
				};
			},
			meta: {
				GroundBurnDamagePerTickTooltipOnly: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f4', 'UltimateHaste', 'GroundDuration', 'MagicResistanceShred'],
		}),
	},
	[ITEM_NAME_TO_ID.cryptbloom]: {
		variables: defineVariables({
			known: {
				f5: [],
				f6: [],
			},
			calculate() {
				return {
					f5: { value: 0 },
					f6: { value: 0 },
				};
			},
			meta: {
				TotalHealAmount: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['f5', 'f6', 'TakedownWindow'],
		}),
	},
	[ITEM_NAME_TO_ID.randuinsOmen]: {
		internalDataProperties: ['humility'],
		setupData(self) {
			self.internalItemData.value.humility = clamp(0, self.internalItemData.value.humility ?? 0, 1);
			return { humility: 0 };
		},
		variables: defineVariables({
			known: {
				'f2': [],
				'damage reduced from crit': [],
			},
			calculate() {
				return {
					'f2': { value: 0 },
					// TODO
					'damage reduced from crit': {
						value: 123,
					},
				};
			},
			meta: {
				'damage reduced from crit': {
					isCustom: true,
				},
			},
			uninteresting: ['f2', 'PercentCritDamageReduction', 'SlowAmount', 'SlowDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.rocketbelt]: {
		variables: defineVariables({
			known: {
				f5: [],
			},
			calculate() {
				return {
					f5: { value: 0 },
				};
			},
			meta: {
				FireboltDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f5'],
		}),
	},
	[ITEM_NAME_TO_ID.chainlacedCrushers]: {
		variables: defineVariables({
			known: {
				f5: [],
			},
			calculate() {
				return {
					f5: { value: 0 },
				};
			},
			uninteresting: ['f5', 'ShieldDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.imperialMandate]: {
		internalDataProperties: ['command'],
		setupData(self) {
			self.internalItemData.value.command = clamp(0, self.internalItemData.value.command ?? 0, 1);
			return { command: 0 };
		},
		imgActive(internalData: { command: number }) {
			return internalData.command;
		},
		variables: defineVariables({
			known: {
				f2: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
				};
			},
			uninteresting: ['f2', 'ImmobilizingAbilityAH', 'DamageAmp', 'DamageAmpDuration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemPassivesStats }) {
					itemPassivesStats.immobilizingHaste += ITEMS_BY_NAME.imperialMandate?.dataValues.ImmobilizingAbilityAH;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.forbiddenIdol]: {
		variables: defineVariables({
			known: {
				f4: [],
			},
			calculate(self) {
				return {
					f4: {
						value: self.stats.value.total.healShieldPower * 100,
					},
				};
			},
			uninteresting: ['f4'],
		}),
	},
	[ITEM_NAME_TO_ID.armoredAdvance]: {
		variables: defineVariables({
			known: {
				f5: [],
				AttackDamageReduced: [],
			},
			calculate() {
				return {
					f5: { value: 0 },
					AttackDamageReduced: { value: 123 },
				};
			},
			meta: {
				ShieldAmountCalc: {
					// TODO check if is reduced by shield reaver
					type: VariableType.shield,
				},
				AttackDamageReduced: {
					isCustom: true,
				},
			},
			uninteresting: ['f5', 'ShieldDuration', 'DamageReduction'],
		}),
	},
	[ITEM_NAME_TO_ID.umbralGlaive]: {
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			uninteresting: ['f1', 'OutOfVisionDuration', 'Effect2Amount' as any, 'TotalWardDamage'],
		}),
	},
	[ITEM_NAME_TO_ID.hullbreaker]: {
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
				};
			},
			meta: {
				MaxStackDamage: {
					type: VariableType.physical,
				},
				MaxStackDamageVSStructures: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['f1', 'f2'],
		}),
	},
	[ITEM_NAME_TO_ID.solariLocket]: {
		internalDataProperties: ['aLevel'],
		setupData(self) {
			self.internalItemData.value.aLevel = clamp(CHAMPION_LEVEL.min, self.internalItemData.value.aLevel ?? self.level.value, CHAMPION_LEVEL.topQuestMax);
			return { aLevel: 0 };
		},
		variables: defineVariables({
			known: {
				f3: [],
				ShieldAmount: [],
			},
			calculate(self) {
				return {
					f3: { value: 0 },
					ShieldAmount: itemVariableValue('ShieldAmount', { item: ITEMS_BY_NAME.solariLocket, damageSource: { level: { value: self.internalItemData.value.aLevel } } as DamageSource }),
				};
			},
			meta: {
				ShieldAmount: {
					type: VariableType.shield,
					isCustom: true,
					displayedName: 'ShieldAmount',
					/* the in game description has `(ally $i:level%)` so override the default generated 'level' to not have double */
					scalesWithStatIcon: undefined,
				},
			},
			uninteresting: ['f3', 'ShieldDuration', 'DiminishedTimer', 'DiminishedEffectMulitplier', 'ShieldMinTOOLTIP', 'ShieldMaxTOOLTIP'],
		}),
		preplaceTextInventory(value) {
			return value.replace('@ShieldMinTOOLTIP@ - @ShieldMaxTOOLTIP@', '@ShieldAmount@');
		},
	},
	[ITEM_NAME_TO_ID.mikaelsBlessing]: {
		internalDataProperties: ['aLevel'],
		setupData(self) {
			self.internalItemData.value.aLevel = clamp(CHAMPION_LEVEL.min, self.internalItemData.value.aLevel ?? self.level.value, CHAMPION_LEVEL.topQuestMax);
			return { aLevel: 0 };
		},
		variables: defineVariables({
			known: {
				f2: [],
				AmountToHeal: [],
			},
			calculate(self) {
				return {
					f2: { value: 0 },
					AmountToHeal: itemVariableValue('AmountToHeal', { item: ITEMS_BY_NAME.mikaelsBlessing, damageSource: { level: { value: self.internalItemData.value.aLevel } } as DamageSource }),
				};
			},
			meta: {
				AmountToHeal: {
					type: VariableType.heal,
					isCustom: true,
					/* the in game description has `(ally $i:level%)` so override the default generated 'level' to not have double */
					scalesWithStatIcon: undefined,
				},
			},
			uninteresting: ['f2', 'HealAmountMin', 'HealAmountMax'],
		}),
		preplaceTextInventory(value) {
			return value.replace('@HealAmountMin@ - @HealAmountMax@', '@AmountToHeal@');
		},
	},
	[ITEM_NAME_TO_ID.bountyOfWorlds]: {
		variables: defineVariables({
			known: {
				f5: [],
				f6: [],
			},
			calculate() {
				return {
					f5: { value: 0 },
					f6: { value: ITEMS_BY_NAME.worldAtlas?.dataValues.MaxCharges },
				};
			},
			uninteresting: ['f5', 'f6', 'StealthWardCap'],
		}),
	},
	[ITEM_NAME_TO_ID.essenceReaver]: {
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
				};
			},
			meta: {
				SpellbladeDamage: {
					type: VariableType.physical,
				},
				TotalManaRefund: {
					/* deliberately different from the generated one. In game it doesn't have any extended equals and wiki puts it as 50% of the spellblade damage too */
					extendedEquals: `${Math.round(ITEMS_BY_NAME.essenceReaver?.itemCalculations.TotalManaRefund.mMultiplier.mNumber * 100)}% <var>Spellblade damage</var>`,
				},
			},
			uninteresting: ['f1', 'f2'],
		}),
	},
	[ITEM_NAME_TO_ID.zazZakRealmspike]: {
		variables: defineVariables({
			known: {
				f4: [],
				f5: [],
				f6: [ITEMS_BY_NAME.zazZakRealmspike?.dataValues.StealthWardCap],
				TotalDamage: [],
			},
			calculate(self, target) {
				const apDamage = itemVariableValue('TooltipDamage', { item: ITEMS_BY_NAME.zazZakRealmspike, damageSource: self, isRanged: self.stats.value.isRanged });
				const { PercentHPDamage } = ITEMS_BY_NAME?.zazZakRealmspike.dataValues ?? {};
				return {
					f4: { value: 0 },
					f5: { value: 0 },
					f6: { value: ITEMS_BY_NAME.zazZakRealmspike?.dataValues.StealthWardCap },
					TotalDamage: {
						value: apDamage.value as number + (target?.stats.value.total.hp ?? 0) * PercentHPDamage,
					},
				};
			},
			meta: {
				TooltipDamage: {
					type: VariableType.magic,
				},
				TotalDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
			},
			uninteresting: ['f4', 'f5', 'f6', 'StealthWardCap', 'MonsterDamageCap', 'PercentHPDamage'],
		}),
	},
	[ITEM_NAME_TO_ID.stormsurge]: {
		variables: defineVariables({
			known: {
				f5: [],
			},
			calculate() {
				return {
					f5: { value: 0 },
				};
			},
			meta: {
				SquallDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f5', 'DamageThreshold', 'WindowDuration', 'DelayDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.deathsDance]: {
		variables: defineVariables({
			known: {
				lolcalcChampRange: [],
			},
			calculate(self) {
				return {
					lolcalcChampRange: [
						itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.deathsDance, damageSource: self, isRanged: false }),
						itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.deathsDance, damageSource: self, isRanged: true }),
					],
				};
			},
			meta: {
				lolcalcChampRange: {
					displayedName: 'IgnoreDamagePercent',
					isPercentage: true,
					multiplier: 100,
				},
				HealTotal: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['BleedDurationWorst', 'TakedownWindow', 'HealDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.sunderedSky]: {
		variables: defineVariables({
			known: {
				f2: [],
				lolcalcChampRange: [],
				Heal: [],
			},
			calculate(self) {
				const baseMelee = itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.sunderedSky, damageSource: self, isRanged: false });
				const baseRanged = itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.sunderedSky, damageSource: self, isRanged: true });
				const missingHp = self.stats.value.total.hp - self.currentHealth.value;
				const missingHpHeal = missingHp * ITEMS_BY_NAME.sunderedSky?.dataValues.MissingHealthHeal;

				return {
					f2: { value: 0 },
					lolcalcChampRange: [baseMelee, baseRanged],
					Heal: {
						value: [baseMelee.value as number + missingHpHeal, baseRanged.value as number + missingHpHeal],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					type: VariableType.heal,
					displayedName: 'BaseHeal',
				},
				Heal: {
					type: VariableType.heal,
					isCustom: true,
				},
			},
			uninteresting: ['f2', 'CritModifier', 'MissingHealthHeal'],
		}),
	},
	[ITEM_NAME_TO_ID.moonstoneRenewer]: {
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
				};
			},
			uninteresting: ['f1', 'f2', 'ChainHeal', 'ChainShield', 'SingleHeal', 'SingleShield'],
		}),
	},
	[ITEM_NAME_TO_ID.echoesOfHelia]: {
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				MaxCharges: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['f1', 'DamageStorageRate', 'ChargeToHealConversion'],
		}),
	},
	[ITEM_NAME_TO_ID.dawncore]: {
		variables: defineVariables({
			known: {
				f2: [],
				f3: [],
			},
			calculate(self) {
				return {
					f2: {
						value: self.stats.value.variables.dawncoreAp === undefined
							? self.stats.value.variables.baseItemManaRegenPercent * ITEMS_BY_NAME.dawncore?.dataValues.APPerManaRegen
							: self.stats.value.variables.dawncoreAp,
						calculatesFrom: [{
							stat: 'manaRegen',
							type: 'base',
							value: ITEMS_BY_NAME.dawncore?.dataValues.APPerManaRegen / 100,
							isPercentage: true,
						}],
					},
					f3: {
						value: self.stats.value.variables.dawncoreHsp === undefined
							? self.stats.value.variables.baseItemManaRegenPercent * ITEMS_BY_NAME.dawncore?.dataValues.HSPowerPerManaRegen
							: self.stats.value.variables.dawncoreHsp,
						calculatesFrom: [{
							stat: 'manaRegen',
							type: 'base',
							value: ITEMS_BY_NAME.dawncore?.dataValues.HSPowerPerManaRegen,
							isPercentage: true,
						}],
					},
				};
			},
			meta: {
				f2: {
					displayedName: 'TotalAP',
				},
				f3: {
					displayedName: 'TotalHSPower',
				},
			},
			uninteresting: ['HSPowerPerManaRegen', 'APPerManaRegen'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemBaseStats }, { calculatedVariables }) {
					const { APPerManaRegen, HSPowerPerManaRegen } = ITEMS_BY_NAME.dawncore?.dataValues ?? {};
					calculatedVariables.dawncoreAp = APPerManaRegen * calculatedVariables.baseItemManaRegenPercent;
					calculatedVariables.dawncoreHsp = HSPowerPerManaRegen * calculatedVariables.baseItemManaRegenPercent;
					itemBaseStats.abilityPower += calculatedVariables.dawncoreAp;
					itemBaseStats.healShieldPower += calculatedVariables.dawncoreHsp;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.stridebreaker]: {
		PASSIVE_BONUS_MS: ((progress) => {
			const bonusMS = itemVariableValue('ActiveMS', {
				item: ITEMS_BY_NAME.stridebreaker,
			});

			if (typeof bonusMS.value === 'number') {
				return bonusMS.value * progress;
			}

			console.warn('[ITEM_SPECIFICS stridebreaker] failed to calculate bonus MS', bonusMS);
			return Number.NaN;
		}) satisfies IDeriveProgressFn,
		internalDataProperties: ['sBShockwaveHits', 'sBShockwave', 'tBShockwave'],
		setupData(self) {
			self.internalItemData.value.sBShockwaveHits = Math.max(0, self.internalItemData.value.sBShockwaveHits ?? 0);
			self.internalItemData.value.sBShockwave = clamp(0, self.internalItemData.value.sBShockwave ?? 100, 100);
			self.internalItemData.value.tBShockwave = clamp(0, self.internalItemData.value.tBShockwave ?? 0, 1);
			return {
				sBShockwaveHits: 0,
				/** decaying move speed gained from shockwave */
				sBShockwave: 0,
				tBShockwave: 0,
			};
		},
		/* should be 2 part, same as youmuu, when the 2nd part of the passive that applies the move speed bonus on self is implemented */
		imgActive(internalData: { sBShockwaveHits: number; sBShockwave: number; tBShockwave: number }) {
			return [internalData.sBShockwaveHits && internalData.sBShockwave, internalData.tBShockwave];
		},
		variables: defineVariables({
			known: {
				lolcalcChampRange: [],
				TotalBonusMS: [],
			},
			calculate(self) {
				const melee = itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.stridebreaker, damageSource: self, isRanged: false });
				const ranged = itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.stridebreaker, damageSource: self, isRanged: true });

				return {
					lolcalcChampRange: [melee, ranged],
					TotalBonusMS: {
						value: self.stats.value.variables.stridebreakerBonusMS ?? 0,
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					type: VariableType.physical,
					displayedName: 'CleaveDamage',
				},
				TotalBonusMS: {
					isCustom: true,
					resultsMultiplier: 100,
					resultsIsPercentage: true,
				},
				SlashDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['MSSlow', 'ActiveMS', 'Duration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, _stats, { calculatedVariables }) {
					const { sBShockwaveHits, sBShockwave } = self.internalItemData.value as IInternalItemDataOf<'stridebreaker'>;
					const bonusMoveSpeed = ITEM_SPECIFICS[ITEM_NAME_TO_ID.stridebreaker].PASSIVE_BONUS_MS(sBShockwave);
					if (!Number.isNaN(bonusMoveSpeed)) {
						calculatedVariables.stridebreakerBonusMS = bonusMoveSpeed / 100 * sBShockwaveHits;
						calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.stridebreakerBonusMS;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.ludensEcho]: {
		variables: defineVariables({
			known: {
				f2: [],
			},
			calculate() {
				return {
					f2: { value: 0 },
				};
			},
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				SingleTargetMax: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f2', 'MaxCharges', 'RepeatDamageReduction'],
		}),
	},
	[ITEM_NAME_TO_ID.bamisCinder]: {
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				DPS: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f1', 'AuraDuration', 'MinionMod', 'MonsterMod'],
		}),
	},
	[ITEM_NAME_TO_ID.dreamMaker]: {
		variables: defineVariables({
			known: {
				f2: [],
				f3: [],
				f5: [],
				f6: [ITEMS_BY_NAME.dreamMaker?.dataValues.StealthWardCap],
			},
			calculate() {
				return {
					f2: { value: 0 },
					f3: { value: 0 },
					f5: { value: 0 },
					f6: { value: ITEMS_BY_NAME.dreamMaker?.dataValues.StealthWardCap },
				};
			},
			meta: {
				ProcDmg: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f2', 'f3', 'f5', 'f6', 'StealthWardCap', 'PurpleBubbleAoEMod'],
		}),
	},
	[ITEM_NAME_TO_ID.icebornGauntlet]: {
		internalDataProperties: ['frostField'],
		setupData(self) {
			self.internalItemData.value.frostField = clamp(0, self.internalItemData.value.frostField ?? 0, 1);
			return { frostField: 0 };
		},
		imgActive(internalData: { frostField: number }) {
			return internalData.frostField;
		},
		variables: defineVariables({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				SpellbladeDamage: {
					type: VariableType.physical,
				},
				SlowAmountMeleeRangedSplit: {
					isPercentage: true,
					multiplier: 100,
				},
			},
			uninteresting: ['f1', 'SlowFieldDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.hollowRadiance]: {
		variables: defineVariables({
			known: {
				f1: [],
				f2: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
				};
			},
			meta: {
				DPS: {
					type: VariableType.magic,
				},
				ProcDamageTOOLTIPONLY: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f1', 'f2', 'AuraDuration', 'MinionMod', 'MonsterMod'],
		}),
	},
	[ITEM_NAME_TO_ID.krakenSlayer]: {
		variables: defineVariables({
			known: {
				f2: [],
				Damage: [],
			},
			calculate(self, target) {
				const damage = itemVariableValue('DamageAmount', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: self, isRanged: self.stats.value.isRanged });
				const maxMultiplier = (ITEMS_BY_NAME.krakenSlayer?.dataValues as any)[ITEMS_BY_NAME.krakenSlayer?.itemCalculations.MaximumDamage.mMultiplier.mDataValue!] ?? 1;
				const targetMissingHpPercent = target
					? target.currentHealth.value ? (target.stats.value.total.hp - target.currentHealth.value) / Math.max(target.stats.value.total.hp, 1) : 1
					: 1;
				const damageMultiplier = 1 + (maxMultiplier - 1) * targetMissingHpPercent;

				return {
					f2: { value: 0 },
					Damage: {
						value: Array.isArray(damage.value)
							? [(damage.value as number[])[0]! * damageMultiplier, (damage.value as number[])[1]! * damageMultiplier]
							: (damage.value as number * damageMultiplier),
					},
				};
			},
			meta: {
				DamageAmount: {
					type: VariableType.physical,
					roundReplaced: true,
				},
				MaximumDamage: {
					type: VariableType.physical,
					roundReplaced: true,
				},
				Damage: {
					type: VariableType.physical,
					isCustom: true,
				},
			},
			uninteresting: ['f2'],
		}),
	},
	[ITEM_NAME_TO_ID.immortalShieldbow]: {
		variables: defineVariables({
			known: {
				f3: [],
			},
			calculate() {
				return {
					f3: { value: 0 },
				};
			},
			meta: {
				ShieldAmount: {
					type: VariableType.shield,
					additionalInfo: `while the calculated value is affected by [${simpleFormattingGameAbilityImage(AbilityType.item, ITEM_NAME_TO_ID.serpentsFang)} Serpent's Fang's](https://wiki.leagueoflegends.com/en-us/Serpent%27s_Fang) Shield Reave, the actual shield in game will probably be bigger because of how the Lifeline triggers. See the [${simpleFormattingGameAbilityImage(AbilityType.item, ITEM_NAME_TO_ID.immortalShieldbow)} Shieldbow's wiki notes](https://wiki.leagueoflegends.com/en-us/Immortal_Shieldbow#Notes)`,
				},
			},
			uninteresting: ['f3', 'HealthThreshold', 'ShieldDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.eclipse]: {
		variables: defineVariables({
			known: {
				f3: [],
				lolcalcChampRange: [],
				MaxHealthDamage: [],
			},
			calculate(self, target) {
				const meleeHpPercent = itemVariableValue('MaxHealthDamageCalc', { item: ITEMS_BY_NAME.eclipse, isRanged: false }).value as number;
				const rangedHpPercent = itemVariableValue('MaxHealthDamageCalc', { item: ITEMS_BY_NAME.eclipse, isRanged: true }).value as number;

				return {
					f3: { value: 0 },
					lolcalcChampRange: [
						itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.eclipse, damageSource: self, isRanged: false }),
						itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.eclipse, damageSource: self, isRanged: true }),
					],
					MaxHealthDamage: {
						value: [meleeHpPercent / 100 * (target?.stats.value.total.hp ?? 0), rangedHpPercent / 100 * (target?.stats.value.total.hp ?? 0)],
					},
				};
			},
			meta: {
				MaxHealthDamageCalc: {
					type: VariableType.physical,
				},
				lolcalcChampRange: {
					displayedName: 'Shield',
					type: VariableType.shield,
				},
				MaxHealthDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['f3', 'WindowDuration', 'ShieldDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.seryldasGrudge]: {
		internalDataProperties: ['bitterCold'],
		setupData(self) {
			self.internalItemData.value.bitterCold = clamp(0, self.internalItemData.value.bitterCold ?? 0, 1);
			return { bitterCold: 0 };
		},
		imgActive(internalData: { bitterCold: number }) {
			return internalData.bitterCold;
		},
	},
	[ITEM_NAME_TO_ID.bloodsong]: {
		internalDataProperties: ['bloodsonged'],
		setupData(self) {
			self.internalItemData.value.bloodsonged = clamp(0, self.internalItemData.value.bloodsonged ?? 0, 1);
			return { bloodsonged: 0 };
		},
		imgActive(internalData: { bloodsonged: number }) {
			return internalData.bloodsonged;
		},
		variables: defineVariables({
			known: {
				f3: [],
				f4: [],
				f5: [],
				f6: [ITEMS_BY_NAME.bloodsong?.dataValues.StealthWardCap],
				lolcalcChampRange: [],
			},
			calculate() {
				return {
					f3: { value: 0 },
					f4: { value: 0 },
					f5: { value: 0 },
					f6: { value: ITEMS_BY_NAME.bloodsong?.dataValues.StealthWardCap },
					lolcalcChampRange: {
						value: [
							ITEMS_BY_NAME.bloodsong?.dataValues.MeleeDamageAmp,
							ITEMS_BY_NAME.bloodsong?.dataValues.RangedDamageAmp,
						],
					},
				};
			},
			meta: {
				SpellbladeDamage: {
					type: VariableType.physical,
				},
				lolcalcChampRange: {
					displayedName: 'DamageIncrease',
					isCustom: true,
					isPercentage: true,
					multiplier: 100,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['f3', 'f4', 'f5', 'f6', 'StealthWardCap', 'MeleeDamageAmp', 'RangedDamageAmp', 'DebuffDuration'],
		}),
		preplaceTextInventory(value) {
			return value.replace('%i:meleeActive% @MeleeDamageAmp*100@ % / %i:rangedActive% @RangedDamageAmp*100@%', '@lolcalcChampRange@');
		},
	},
	[ITEM_NAME_TO_ID.voltaicCyclosword]: {
		internalDataProperties: ['firmanent'],
		setupData(self) {
			self.internalItemData.value.firmanent = clamp(0, self.internalItemData.value.firmanent ?? 0, 1);
			return { firmanent: 0 };
		},
		imgActive(internalData: { firmanent: number }) {
			return internalData.firmanent;
		},
		variables: defineVariables({
			known: {
				f1: [],
				PercentHPDamage: [],
			},
			calculate(_self, target) {
				const { PercentCurrentHPMelee, PercentCurrentHPRanged } = ITEMS_BY_NAME.voltaicCyclosword?.dataValues ?? {};
				const currentHealth = target?.currentHealth.value ?? 0;
				return {
					f1: { value: 0 },
					PercentHPDamage: {
						value: [currentHealth * PercentCurrentHPMelee / 100, currentHealth * PercentCurrentHPRanged / 100],
					},
				};
			},
			meta: {
				PercentHPDamage: {
					isCustom: true,
				},
			},
			uninteresting: ['f1', 'LethalityBonusDuration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { isRanged, itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'voltaicCyclosword'>).firmanent) {
						const value = itemVariableValue('LethalityBonusModMeleeRangedSplit', { item: ITEMS_BY_NAME.voltaicCyclosword, isRanged: isRanged ?? false });
						if (value.value === undefined) {
							console.warn('[ITEM_SPECIFICS voltaicCyclosword] failed to calculate firmanent lethality', value);
						} else {
							calculatedVariables.voltaicLethality = value.value as number;
							itemPassivesStats.lethality += calculatedVariables.voltaicLethality;
						}
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.solsticeSleigh]: {
		PASSIVE_BONUS_MS: ((progress) => {
			const bonusMS = itemVariableValue('MoveSpeedBuff', {
				item: ITEMS_BY_NAME.solsticeSleigh,
			});

			if (typeof bonusMS.value === 'number') {
				return bonusMS.value * progress;
			}

			console.warn('[ITEM_SPECIFICS solstice sleigh] failed to calculate bonus MS', bonusMS);
			return Number.NaN;
		}) satisfies IDeriveProgressFn,
		internalDataProperties: ['sledding'],
		setupData(self) {
			self.internalItemData.value.sledding = clamp(0, self.internalItemData.value.sledding ?? 0, 100);
			return {
				sledding: 0,
			};
		},
		imgActive(internalData: { sledding: number }) {
			return internalData.sledding;
		},
		variables: defineVariables({
			known: {
				f3: [],
				f5: [],
				f6: [ITEMS_BY_NAME.solsticeSleigh?.dataValues.StealthWardCap],
				BonusMS: [],
			},
			calculate(self) {
				return {
					f3: { value: 0 },
					f5: { value: 0 },
					f6: { value: ITEMS_BY_NAME.solsticeSleigh?.dataValues.StealthWardCap },
					BonusMS: {
						value: self.stats.value.variables.solsticeSleighBonusMS ?? 0,
					},
				};
			},
			meta: {
				BonusHealthBuff: {
					type: VariableType.heal,
				},
				BonusMS: {
					isCustom: true,
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['f3', 'f5', 'f6', 'StealthWardCap', 'BuffDuration', 'MoveSpeedBuff'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, _stats, { calculatedVariables }) {
					calculatedVariables.solsticeSleighBonusMS = ITEM_SPECIFICS[ITEM_NAME_TO_ID.solsticeSleigh].PASSIVE_BONUS_MS((self.internalItemData.value as IInternalItemDataOf<'solsticeSleigh'>).sledding);
					calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.solsticeSleighBonusMS / 100;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.scoutsSlingshot]: {
		variables: defineVariables({
			meta: {
				DamageAmount: {
					type: VariableType.magic,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.recurveBow]: {
		variables: defineVariables({
			meta: {
				OnHitDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.sheen]: {
		variables: defineVariables({
			meta: {
				SpellbladeDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.hextechAlternator]: {
		variables: defineVariables({
			meta: {
				DamageAmount: {
					type: VariableType.magic,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.crimsonLucidity]: {
		internalDataProperties: ['noxianHaste'],
		setupData(self) {
			self.internalItemData.value.noxianHaste = clamp(0, self.internalItemData.value.noxianHaste ?? 0, 1);
			return { noxianHaste: 0 };
		},
		variables: defineVariables({
			uninteresting: ['Duration', 'SummonerHaste'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, { isRanged }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'crimsonLucidity'>).noxianHaste) {
						const moveSpeedPercent = itemVariableValue('MSAmount', { item: ITEMS_BY_NAME.crimsonLucidity, isRanged: isRanged ?? false });
						if (typeof moveSpeedPercent.value === 'number') {
							calculatedVariables.crimsonLucidityMSPercent = moveSpeedPercent.value;
							calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.crimsonLucidityMSPercent;
						} else {
							console.warn('[ITEM_SPECIFICS crimson lucidty] failed to calculate move speed', moveSpeedPercent);
						}
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.rfc]: {
		internalDataProperties: ['sharpshooter'],
		setupData(self) {
			self.internalItemData.value.sharpshooter = clamp(0, self.internalItemData.value.sharpshooter ?? 0, 1);
			return { sharpshooter: 0 };
		},
		variables: defineVariables({
			meta: {
				BonusDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['RangePercentIncrease'],
		}),
		calculateHooks: {
			onTotalPreMultipliers: {
				handler(self, { totalPreMultipliersStats, totalMultipliersStats, itemPassivesStats }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'rfc'>).sharpshooter) {
						totalMultipliersStats.attackRange = Math.min(ITEMS_BY_NAME.rfc.dataValues.MaxRangeIncrease, totalPreMultipliersStats.attackRange * ITEMS_BY_NAME.rfc?.dataValues.RangePercentIncrease);
						itemPassivesStats.attackRange ??= 0;
						itemPassivesStats.attackRange += totalMultipliersStats.attackRange;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.kaenicRookern]: {
		variables: defineVariables({
			uninteresting: ['OutOfCombatDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.hextechGunblade]: {
		internalDataProperties: ['lBolt'],
		setupData(self) {
			self.internalItemData.value.lBolt = clamp(0, self.internalItemData.value.lBolt ?? 0, 1);
			return { lBolt: 0 };
		},
		variables: defineVariables({
			meta: {
				ActiveDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['SlowAmount', 'SlowDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.stormrazor]: {
		internalDataProperties: ['bolt'],
		setupData(self) {
			self.internalItemData.value.bolt = clamp(0, self.internalItemData.value.bolt ?? 0, 1);
			return { bolt: 0 };
		},
		variables: defineVariables({
			meta: {
				TotalProcDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['BuffStrength', 'BuffDuration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, _args, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'stormrazor'>).bolt) {
						const moveSpeedPercent = ITEMS_BY_NAME.stormrazor?.dataValues.BuffStrength;
						if (typeof moveSpeedPercent === 'number') {
							calculatedVariables.stormrazorMSPercent = moveSpeedPercent;
							calculatedVariables.totalBonusPercentMoveSpeed += calculatedVariables.stormrazorMSPercent;
						} else {
							console.warn('[ITEM_SPECIFICS stormrazor] failed to calculate move speed', moveSpeedPercent);
						}
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.mercurialScimitar]: {
		internalDataProperties: ['quicksilver'],
		setupData(self) {
			self.internalItemData.value.quicksilver = clamp(0, self.internalItemData.value.quicksilver, 1);
			return { quicksilver: 0 };
		},
		variables: defineVariables({
			uninteresting: ['MSDuration'],
		}),
		calculateHooks: {
			preItemTotal: {
				handler(self, _args, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'mercurialScimitar'>).quicksilver) {
						const moveSpeedPercent = ITEMS_BY_NAME.mercurialScimitar?.dataValues.MoveSpeed;
						if (typeof moveSpeedPercent === 'number') {
							calculatedVariables.mercurialMSPercent = moveSpeedPercent;
							calculatedVariables.totalMultiplicativeMoveSpeed = combineCompounding(
								calculatedVariables.totalMultiplicativeMoveSpeed ?? 0,
								calculatedVariables.mercurialMSPercent,
							);
						} else {
							console.warn('[ITEM_SPECIFICS mercurial scimitar] failed to calculate move speed', moveSpeedPercent);
						}
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.titanicHydra]: {
		variables: defineVariables({
			meta: {
				OnHitDamageCalc: {
					type: VariableType.physical,
				},
				ConeDamageCalc: {
					type: VariableType.physical,
				},
				CalcValueC: {
					type: VariableType.physical,
				},
				CalcValueD: {
					type: VariableType.physical,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.bloodthirster]: {
		variables: defineVariables({
			meta: {
				OvershieldCalc: {
					type: VariableType.shield,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.axiomArc]: {
		variables: defineVariables({
			uninteresting: ['ResetWindow'],
		}),
	},
	[ITEM_NAME_TO_ID.profaneHydra]: {
		variables: defineVariables({
			meta: {
				CleaveDamage: {
					type: VariableType.physical,
				},
				SlashDamageBase: {
					type: VariableType.physical,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.collector]: {
		variables: defineVariables({
			uninteresting: ['ExecuteThreshold', 'GoldAmount'],
		}),
	},
} satisfies IHypotheticalItemSpecifics;

export type TItemSpecifics = typeof ITEM_SPECIFICS;
export type IHypotheticalItemSpecifics = {
	[K in keyof TItems]?: IItemSpecific<K>
};

export type IItemSpecific<T extends keyof TItems = keyof TItems> = IProviderGroupImageText & IProviderGroupInternalItemData & {
	/**
	 * whether to show the green dot that the item is active in the top right corner of the image
	 * when array, the indicator dot will be split in half and colored based on the array 1/2 being trueish, useful for youmuu
	 */
	imgActive?: (internalData: any) => [(number | boolean), (number | boolean)] | number | boolean;
	calculateHooks?: ICalculateChampionStatsHookSource;
	variables?: ISpecificVariables<Exclude<DetectItemVariables<TItems[T]>, 'Cooldown'>, any, IChampionId, 'item'>;
	effectOntoTargetVars?: IEffectOntoTargetVarsHook;
	/**
	 * called in `scripts/updateData`, if present the inventory text will be added/replaced based on the returned by this `textShop` (that's passed as the `value`)
	 * ATM done only for textShop and textInventory, used for redemption, which by default shows `\@HealMin\@ - \@HealMax\@` that depends on ally level. Calculator gives an option to set ally's level to a concrete value so we should display the heal for selected ally level
	 */
	preplaceTextInventory?: (value: string) => string;
	[key: string]: any;
};

export function calculateItemDiscount(
	itemId: string,
	inventory: (IItem | undefined)[],
	inComponent = false,
	consumedInventoryIndexes: number[] = [],
): number {
	if (inComponent) {
		const inventoryIndex = inventory.findIndex((item, i) => item?.id === itemId && !consumedInventoryIndexes.includes(i));
		if (~inventoryIndex) {
			consumedInventoryIndexes.push(inventoryIndex);
			return ITEMS[itemId]!.gold.total;
		}
	}

	return (ITEMS[itemId]!.from || []).reduce((discount, componentId) =>
		discount + calculateItemDiscount(componentId, inventory, true, consumedInventoryIndexes), 0);
}

export function consumeItemComponents(
	itemId: string,
	inventory: (IItem | undefined)[],
	consumedInventoryIndexes: number[] = [],
	inComponent = false,
): number[] {
	if (inComponent) {
		const inventoryIndex = inventory.findIndex((item, i) => item?.id === itemId && !consumedInventoryIndexes.includes(i));
		if (~inventoryIndex) {
			consumedInventoryIndexes.push(inventoryIndex);
			return consumedInventoryIndexes;
		}
	}

	for (const componentId of ITEMS[itemId]!.from || []) {
		consumeItemComponents(componentId, inventory, consumedInventoryIndexes, true);
	}

	return consumedInventoryIndexes;
}

export function itemBuyability(
	item: IItem,
	target: DamageSource | undefined,
	consumeComponents = true,
	transformBoots = false,
	isMove = false,
): IShopItem['buyability'] {
	let buyability: IShopItem['buyability'] = 1;

	if (!target) {
		return buyability;
	}

	let inventoryAfterBuying = target.items.value;

	if (consumeComponents) {
		const inventoryIndexesConsumedOnBuy = consumeItemComponents(item.id, target.items.value);
		inventoryAfterBuying = target.items.value.map((item, index) => inventoryIndexesConsumedOnBuy.includes(index) ? undefined : item);
	}

	if (
		(target.champion.value && !target.stats.value.isRanged && (RANGED_ONLY_ITEMS as string[]).includes(item.id))
		|| (!(transformBoots && isMove && item.isBoots) && inventoryAfterBuying.some(boughtItem => boughtItem && boughtItem.itemGroups?.some(group => item.itemGroups?.includes(group))))
		|| (!transformBoots && target && target.roleQuest.value !== 'mid' && item.isBoots && item.epicness === 7)
		|| (target.roleQuest.value !== 'support' && UPGRADED_SUPPORT_ITEMS.includes(item.id))
	) {
		buyability = -1;
	} else if (!isMove && inventoryAfterBuying.slice(0, 6).filter(Boolean).length > 5 && (target.roleQuest.value !== 'bot' || inventoryAfterBuying[6])) {
		buyability = 0;
	}

	return buyability;
}
