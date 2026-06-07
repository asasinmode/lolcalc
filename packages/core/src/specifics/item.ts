/*
 * `ITEMS_BY_NAME.item` or `ITEMS_BY_NAME.itemId.` access is behind `?` because when developing, sometimes I resolve only singular items/their variables and they might not be present which would result in `undefined.propertyAccess` error
 */

import type { TItems } from '@lolcalc/data';
import type { IChampionId, IItem, IShopItem } from '@lolcalc/data/types';
import type { ICalculatedDynamicVariable, IInternalItemDataOf, ISpecificVariables } from '.';
import type { DamageSource, ICalculateChampionStatsHookSource, IProviderGroupImageText, IProviderGroupInternalItemData } from '../DamageSource';
import type { DetectItemVariables } from '../types';
import { ITEMS, ITEMS_BY_NAME, STAT_ICON } from '@lolcalc/data';
import { CHAMPION_LEVEL, GRIEVOUS_WOUND_ITEMS, ITEM_NAME_TO_ID, RANGED_ONLY_ITEMS, UNTRANSFORMED_TEAR_ITEM_IDS, UPGRADED_SUPPORT_ITEMS, VariableType } from '@lolcalc/shared';
import { clamp, roundVariable } from '@lolcalc/shared/utils.ts';
import { itemVariableValue, VARIABLE_CALCULATION_FNS } from '../variables/game.ts';
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
			self.internalItemData.value.manaflow = clamp(0, self.internalItemData.value.manaflow ?? 0, tearItem.specific.MAX_STACKS);
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
	calculateHooks: {
		preItemTotal: {
			handler(self, { itemPassivesStats, itemStatIncreases }, { calculatedVariables }) {
				const { slay } = self.internalItemData.value as IInternalItemDataOf<'gluttonousGreaves'>;
				calculatedVariables.gluttonousImmortalOmnivamp = (slay ?? 0) * ITEMS_BY_NAME.gluttonousGreaves?.dataValues.OmnivampOnTakedown;
				itemPassivesStats.omnivamp += calculatedVariables.gluttonousImmortalOmnivamp;

				const bootsId = self.items.value.find(item => item && (item.id === ITEM_NAME_TO_ID.gluttonousGreaves || item.id === ITEM_NAME_TO_ID.immortalPath))?.id;
				if (bootsId) {
					itemStatIncreases[bootsId] ??= {};
					itemStatIncreases[bootsId]!.PercentOmnivampMod = calculatedVariables.gluttonousImmortalOmnivamp;
				}
			},
		},
	},
} satisfies IItemSpecific;

const bastionBreakerSpecifics = {
	abilityDamageCalcBase: ITEMS_BY_NAME.bastionBreaker?.itemCalculations.AbilityDamageCalc.mFormulaParts[0]!.mNumber,
	abilityDamageCalcRangeCoefficient: ITEMS_BY_NAME.bastionBreaker?.itemCalculations.AbilityDamageCalc.mFormulaParts[1]!.mCoefficient,
	abilityDamageCalcRangeModifier: (ITEMS_BY_NAME.bastionBreaker?.dataValues as any)[ITEMS_BY_NAME.bastionBreaker.itemCalculations.AbilityDamageCalc.mRangedMultiplier.mDataValue],
	damageCalcBase: ITEMS_BY_NAME.bastionBreaker?.itemCalculations.DamageCalc.mFormulaParts[0]!.mNumber,
	damageCalcRangeCoefficient: ITEMS_BY_NAME.bastionBreaker?.itemCalculations.DamageCalc.mFormulaParts[1]!.mCoefficient,
	damageCalcRangeModifier: (ITEMS_BY_NAME.bastionBreaker?.dataValues as any)[ITEMS_BY_NAME.bastionBreaker.itemCalculations.DamageCalc.mRangedMultiplier.mDataValue],
};

const mawOfMalmortiusSpecific = {
	meleeShield: (ITEMS_BY_NAME.mawOfMalmortius?.dataValues as any)[ITEMS_BY_NAME.mawOfMalmortius?.itemCalculations.MeleeItemCalcValue.mFormulaParts[0]!.mDataValue!],
	meleeAdScaling: (ITEMS_BY_NAME.mawOfMalmortius?.dataValues as any)[ITEMS_BY_NAME.mawOfMalmortius?.itemCalculations.MeleeItemCalcValue.mFormulaParts[1]!.mDataValue!],
	rangedModifier: (ITEMS_BY_NAME.mawOfMalmortius?.dataValues as any)[ITEMS_BY_NAME.mawOfMalmortius?.itemCalculations.RangedItemCalcValue.mMultiplier.mDataValue!],
};

const hullbreakerSpecifics = {
	nonStructureAdRatio: (ITEMS_BY_NAME.hullbreaker?.dataValues as any)[ITEMS_BY_NAME.hullbreaker?.itemCalculations.MaxStackDamage.mFormulaParts[0]!.mDataValue!],
	nonStructureHpRatio: (ITEMS_BY_NAME.hullbreaker?.dataValues as any)[ITEMS_BY_NAME.hullbreaker?.itemCalculations.MaxStackDamage.mFormulaParts[1]!.mDataValue!],
	nonStructureRangedModifier: ITEMS_BY_NAME.hullbreaker?.itemCalculations.MaxStackDamage.mRangedMultiplier.mNumber,
	structureAdRatio: (ITEMS_BY_NAME.hullbreaker?.dataValues as any)[ITEMS_BY_NAME.hullbreaker?.itemCalculations.MaxStackDamageVSStructures.mFormulaParts[0]!.mDataValue!],
	structureHpRatio: (ITEMS_BY_NAME.hullbreaker?.dataValues as any)[ITEMS_BY_NAME.hullbreaker?.itemCalculations.MaxStackDamageVSStructures.mFormulaParts[1]!.mDataValue!],
	structureRangedModifier: ITEMS_BY_NAME.hullbreaker?.itemCalculations.MaxStackDamageVSStructures.mRangedMultiplier.mNumber,
	meleeBonusMinionResistsLvl1: ITEMS_BY_NAME.hullbreaker?.itemCalculations.BonusMinionResists.mFormulaParts[0]!.mLevel1Value,
	meleeBonusMinionResistsLvl18: ITEMS_BY_NAME.hullbreaker?.itemCalculations.BonusMinionResists.mFormulaParts[0]!.mLevel1Value + ITEMS_BY_NAME.hullbreaker?.itemCalculations.BonusMinionResists.mFormulaParts[0]!.mBreakpoints[0]?.mBonusPerLevelAtAndAfter! * 18 + 1 - (ITEMS_BY_NAME.hullbreaker?.itemCalculations.BonusMinionResists.mFormulaParts[0]!.mBreakpoints[0]?.mLevel!),
	bonusMinionResistsRangedModifier: ITEMS_BY_NAME.hullbreaker?.itemCalculations.BonusMinionResists.mRangedMultiplier.mNumber,
};

const sunderedSkySpecifics = {
	meleeAdRatio: (ITEMS_BY_NAME.sunderedSky?.dataValues as any)[ITEMS_BY_NAME.sunderedSky?.itemCalculations.MeleeItemCalcValue.mFormulaParts[0]!.mDataValue!],
	rangedModifier: (ITEMS_BY_NAME.sunderedSky?.dataValues as any)[ITEMS_BY_NAME.sunderedSky?.itemCalculations.RangedItemCalcValue.mMultiplier.mDataValue!],
};

const ludensEchoSpecifics = {
	const: (ITEMS_BY_NAME.ludensEcho?.dataValues as any)[ITEMS_BY_NAME.ludensEcho.itemCalculations.Damage.mFormulaParts[0]!.mDataValue!],
	apRatio: (ITEMS_BY_NAME.ludensEcho?.dataValues as any)[ITEMS_BY_NAME.ludensEcho.itemCalculations.Damage.mFormulaParts[1]!.mDataValue!],
	singleTargetMaxMultiplier: ITEMS_BY_NAME.ludensEcho?.itemCalculations.SingleTargetMax.mMultiplier.mNumber,
};

const hollowRadianceSpecifics = {
	const: ITEMS_BY_NAME.hollowRadiance?.itemCalculations.DamagePerTick.mFormulaParts[0]!.mNumber,
	hpRatio: ITEMS_BY_NAME.hollowRadiance?.itemCalculations.DamagePerTick.mFormulaParts[1]!.mCoefficient!,
	procMultiplier: (ITEMS_BY_NAME.hollowRadiance?.dataValues as any)[ITEMS_BY_NAME.hollowRadiance.itemCalculations.ProcDamageTOOLTIPONLY.mMultiplier.mDataValue],
};

const eclipseSpecifics = {
	meleeConst: (ITEMS_BY_NAME.eclipse?.dataValues as any)[ITEMS_BY_NAME.eclipse?.itemCalculations.MeleeItemCalcValue.mFormulaParts[0]!.mDataValue],
	meleeAdRatio: (ITEMS_BY_NAME.eclipse?.dataValues as any)[ITEMS_BY_NAME.eclipse?.itemCalculations.MeleeItemCalcValue.mFormulaParts[1]!.mDataValue],
	rangedConst: (ITEMS_BY_NAME.eclipse?.dataValues as any)[ITEMS_BY_NAME.eclipse?.itemCalculations.RangedItemCalcValue.mFormulaParts[0]!.mDataValue],
	rangedAdRatio: (ITEMS_BY_NAME.eclipse?.dataValues as any)[ITEMS_BY_NAME.eclipse?.itemCalculations.RangedItemCalcValue.mFormulaParts[1]!.mDataValue],
};

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
		imgText(self) {
			const { hauntingGuiseBonusDamagePercent } = self.stats.value.variables;
			return hauntingGuiseBonusDamagePercent ? `${Math.round(hauntingGuiseBonusDamagePercent * 100)}%` : '';
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
			postTotal: {
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
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					const { eternity } = self.internalItemData.value;
					const { APPerStack, HealthPerStack, ManaPerStack } = ITEMS_BY_NAME.roa?.dataValues;
					itemPassivesStats.abilityPower += (calculatedVariables.roaAp = eternity * APPerStack);
					itemPassivesStats.hp += (calculatedVariables.roaHp = eternity * HealthPerStack);
					itemPassivesStats.mana += (calculatedVariables.roaMana = eternity * ManaPerStack);
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
					const value = calculatedVariables.apMultipliersBase * multiplier;
					calculatedVariables.totalItemApMultipliers += multiplier;
					itemPassivesStats.abilityPower += value;
					itemTotalStats.abilityPower += value;
				},
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
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${ITEMS_BY_NAME.blackfireTorch?.dataValues.BurnFlatDamagePerSecond}</const><scalemana> + ${Math.round(ITEMS_BY_NAME.blackfireTorch?.dataValues.APRatio * 100)}%</scalemana>`,
					type: VariableType.magic,
				},
				MinionBurnCalc: {
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${ITEMS_BY_NAME.blackfireTorch?.dataValues.MinionDPS}</const><scalemana> + ${Math.round(ITEMS_BY_NAME.blackfireTorch?.dataValues.MinionAP * 100)}%</scalemana>`,
				},
				MonsterBurnCalc: {
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${ITEMS_BY_NAME.blackfireTorch?.dataValues.MonsterDPS}</const><scalemana> + ${Math.round(ITEMS_BY_NAME.blackfireTorch?.dataValues.MonsterAP * 100)}%</scalemana>`,
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
		imgText(self) {
			const { liandryBonusDamagePercent } = self.stats.value.variables;
			return liandryBonusDamagePercent ? `${Math.round(liandryBonusDamagePercent * 100)}%` : '';
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
			postTotal: {
				handler(self, _args, { calculatedVariables }) {
					calculatedVariables.liandryBonusDamagePercent = ((self.internalItemData.value as IInternalItemDataOf<'liandry'>).madness ?? 0) * ITEMS_BY_NAME.liandry?.dataValues.DamageIncreasePerSecond;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		MAX_STACKS: ITEMS_BY_NAME.yunTal?.dataValues.CritMax,
		internalDataProperties: ['practice', 'flurry'],
		setupData(self) {
			self.internalItemData.value.practice = clamp(0, self.internalItemData.value.practice ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].MAX_STACKS);
			self.internalItemData.value.flurry = clamp(0, self.internalItemData.value.flurry ?? 0, 1);
			return { practice: 0, flurry: 0 };
		},
		imgTextLabel: 'Practice Makes Lethal critical strike chance',
		imgText(self) {
			const { practice } = self.internalItemData.value as { practice: number };
			return practice && `${practice}%`;
		},
		imgActive(internalData: { flurry: number }) {
			return internalData.flurry;
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
			const { fWill } = self.internalItemData.value as { fWill: number };
			return fWill && `${Math.round(fWill * ITEMS_BY_NAME.shojin?.dataValues.SpellDamageIncrease * 100)}%`;
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
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		MAX_STACKS: ITEMS_BY_NAME.riftmaker?.dataValues.SecondsInCombat,
		internalDataProperties: ['corruption'],
		setupData(self) {
			self.internalItemData.value.corruption = clamp(0, self.internalItemData.value.corruption ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.riftmaker].MAX_STACKS);
			return { corruption: 0 };
		},
		imgTextLabel: 'Corruption bonus damage',
		imgText(self) {
			const { riftmakerBonusDamagePercent } = self.stats.value.variables;
			return riftmakerBonusDamagePercent ? `${Math.round(riftmakerBonusDamagePercent * 100)}%` : '';
		},
		variables: defineVariables({
			known: {
				f1: [],
				lolcalcChampRange: [],
				BonusDamage: [],
			},
			calculate(self) {
				const { VampAmountRanged, VampAmountMelee } = ITEMS_BY_NAME.riftmaker?.dataValues;

				return {
					/** ap gained from passive */
					f1: {
						value: self.stats.value.variables.riftmakerVoidInfusion
							?? (self.stats.value.bonus.hp * ITEMS_BY_NAME.riftmaker?.dataValues.HealthToAPConversionPercent),
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
					resultsIsPercentage: true,
				},
				f1: {
					displayedName: 'BonusAPFromHP',
					statIconKey: 'hp',
					extendedEquals: `<scalehealth>${Math.round(ITEMS_BY_NAME.riftmaker?.dataValues.HealthToAPConversionPercent * 100)}%</scalehealth>`,
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
				handler(self, { itemBaseStats, itemPassivesStats }, { calculatedVariables, miscDebug }) {
					const bonusHp = (itemBaseStats.hp + itemPassivesStats.hp);
					calculatedVariables.riftmakerVoidInfusion = bonusHp * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.riftmaker].HP_TO_AP;
					itemPassivesStats.abilityPower += calculatedVariables.riftmakerVoidInfusion;
					miscDebug.riftmakerBonusHp = bonusHp;

					const { corruption } = self.internalItemData.value as IInternalItemDataOf<'riftmaker'>;
					if (corruption === ITEM_SPECIFICS[ITEM_NAME_TO_ID.riftmaker].MAX_STACKS) {
						const { VampAmountRanged, VampAmountMelee } = ITEMS_BY_NAME.riftmaker?.dataValues;
						const omnivamp = self.isRanged.value ? VampAmountRanged : VampAmountMelee;
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
			postTotal: {
				handler(self, _args, { calculatedVariables }) {
					calculatedVariables.riftmakerBonusDamagePercent = ((self.internalItemData.value as IInternalItemDataOf<'riftmaker'>).corruption ?? 0) * ITEMS_BY_NAME.riftmaker?.dataValues.EternityDamageIncreasePerSecond;
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
			known: {
				BonusHSPCalc: [],
			},
			calculate(self) {
				return {
					BonusHSPCalc: {
						value: self.stats.value.variables.whisperingDiademAwe
							? self.stats.value.variables.whisperingDiademAwe * 100
							: (self.stats.value.bonus.mana * ITEMS_BY_NAME.whisperingCirclet?.itemCalculations.BonusHSPCalc.mFormulaParts[0]!.mCoefficient),
					},
				};
			},
			meta: {
				BonusHSPCalc: {
					statIconKey: 'mana',
					resultsIsPercentage: true,
					extendedEquals: `<scalemana>${ITEMS_BY_NAME.whisperingCirclet?.itemCalculations.BonusHSPCalc.mFormulaParts[0]!.mCoefficient * 100}% bonus</scalemana> `,
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
				BonusHSPCalc: [],
				ManaToHeal: [],
				f1: [],
			},
			calculate(self) {
				return {
					BonusHSPCalc: {
						value: self.stats.value.variables.whisperingDiademAwe
							? self.stats.value.variables.whisperingDiademAwe * 100
							: (self.stats.value.bonus.mana * ITEMS_BY_NAME.diademOfSongs?.itemCalculations.BonusHSPCalc.mFormulaParts[0]!.mCoefficient),
					},
					ManaToHeal: {
						value: self.stats.value.total.mana * ITEMS_BY_NAME.diademOfSongs?.itemCalculations.ManaToHeal.mFormulaParts[0]!.mCoefficient,
					},
					f1: {
						value: 0,
					},
				};
			},
			meta: {
				BonusHSPCalc: {
					statIconKey: 'mana',
					resultsIsPercentage: true,
					extendedEquals: `<scalemana>${ITEMS_BY_NAME.diademOfSongs?.itemCalculations.BonusHSPCalc.mFormulaParts[0]!.mCoefficient * 100}% bonus</scalemana> `,
				},
				ManaToHeal: {
					statIconKey: 'mana',
					resultsIsPercentage: true,
					extendedEquals: `<scalemana>${ITEMS_BY_NAME.diademOfSongs?.itemCalculations.ManaToHeal.mFormulaParts[0]!.mCoefficient * 100}%</scalemana>`,
					type: VariableType.heal,
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
					},
				};
			},
			meta: {
				f2: {
					displayedName: 'APFromMana',
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.archangelsStaff].AP_FROM_MANA * 100)}% bonus</scalemana> `,
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
				ShieldValue: [],
			},
			calculate(self) {
				return {
					/** damage shielded */
					f5: {
						value: 0,
					},
					/** ap gained from passive */
					BonusAPCalc: {
						value: self.stats.value.variables.archangelSeraphAwe
							?? (self.stats.value.bonus.mana * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.seraphsEmbrace].AP_FROM_MANA),
					},
					ShieldValue: {
						value: self.stats.value.total.mana * ITEMS_BY_NAME.seraphsEmbrace?.itemCalculations.ShieldValue.mFormulaParts[0]!.mCoefficient,
					},
				};
			},
			meta: {
				BonusAPCalc: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.seraphsEmbrace].AP_FROM_MANA * 100)}% bonus</scalemana> `,
				},
				ShieldValue: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEMS_BY_NAME.seraphsEmbrace?.itemCalculations.ShieldValue.mFormulaParts[0]!.mCoefficient * 100)}%</scalemana>`,
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
				return {
					/** ad gained from passive */
					BonusADFromMana: {
						value: self.stats.value.variables.manaMuraAwe
							?? (self.stats.value.total.mana * ITEMS_BY_NAME.manamune?.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient),
					},
				};
			},
			meta: {
				BonusADFromMana: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEMS_BY_NAME.manamune?.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient * 100)}%</scalemana>`,
				},
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
				OnHitDamage: [],
				lolcalcChampRange: [],
				f1: [],
			},
			calculate(self) {
				const totalMana = self.stats.value.total.mana;
				const meleeAbilitiesBonusModifier = ITEMS_BY_NAME.muramana?.itemCalculations.MeleeItemCalcValue.mFormulaParts[0]!.mCoefficient;
				const rangedAbilitiesBonusModifier = ITEMS_BY_NAME.muramana?.itemCalculations.RangedItemCalcValue.mFormulaParts[0]!.mCoefficient;

				return {
					/** ad gained from passive */
					BonusADFromMana: {
						value: self.stats.value.variables.manaMuraAwe
							?? (totalMana * ITEMS_BY_NAME.muramana?.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient),
					},
					OnHitDamage: {
						value: totalMana * ITEMS_BY_NAME.muramana?.itemCalculations.OnHitDamage.mFormulaParts[0]!.mCoefficient,
					},
					/** passive damaging abilities bonus damage */
					lolcalcChampRange: {
						value: [
							totalMana * meleeAbilitiesBonusModifier,
							totalMana * rangedAbilitiesBonusModifier,
						],
					},
					f1: {
						value: 0,
					},
				};
			},
			meta: {
				BonusADFromMana: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEMS_BY_NAME.muramana?.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient * 100)}%</scalemana>`,
				},
				OnHitDamage: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${roundVariable(ITEMS_BY_NAME.muramana?.itemCalculations.OnHitDamage.mFormulaParts[0]!.mCoefficient * 100)}%</scalemana>`,
				},
				lolcalcChampRange: {
					displayedName: 'AdditionalAbilityDamage',
					statIconKey: 'mana',
					extendedEquals: {
						prefix: '<scalemana>',
						meleeValue: roundVariable(ITEMS_BY_NAME.muramana?.itemCalculations.MeleeItemCalcValue.mFormulaParts[0]!.mCoefficient * 100),
						rangedValue: roundVariable(ITEMS_BY_NAME.muramana?.itemCalculations.RangedItemCalcValue.mFormulaParts[0]!.mCoefficient * 100),
						valueSuffix: '%',
						suffix: '</scalemana>',
					},
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
				return {
					BonusHPFromMana: {
						value: self.stats.value.variables.approachFimbulAwe
							?? (self.stats.value.bonus.mana * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.wintersApproach].HP_FROM_MANA),
					},
				};
			},
			meta: {
				BonusHPFromMana: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.wintersApproach].HP_FROM_MANA * 100)}% bonus</scalemana> `,
				},
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
				return {
					/* TODO this should be calculable from item.json since the variable seems to be just bonus mana % with __type `AbilityResourceByCoefficientCalculationPart` but atm Ryze's passive is unimplemented and making trouble so try to revisit it later */
					BonusHPFromMana: {
						value: self.stats.value.variables.approachFimbulAwe
							?? (self.stats.value.bonus.mana * ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.fimbulwinter].HP_FROM_MANA),
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
				BonusHPFromMana: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEM_SPECIFICS_SHARED[ITEM_NAME_TO_ID.fimbulwinter].HP_FROM_MANA * 100)}% bonus</scalemana> `,
				},
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
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round(ITEMS_BY_NAME.trinity?.dataValues.SpellbladeMultiplier * 100)}% bonus</scalead> `,
				},
			},
			uninteresting: ['f4', 'MoveSpeedBonus', 'MSDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		MAX_STACKS: 5,
		internalDataProperties: ['carve', 'fervor'],
		setupData(self) {
			self.internalItemData.value.carve = Math.max(0, Math.min(
				ITEM_SPECIFICS[ITEM_NAME_TO_ID.blackCleaver].MAX_STACKS,
				self.internalItemData.value.carve ?? 0,
			));
			self.internalItemData.value.fervor = clamp(0, self.internalItemData.value.carve ?? 0, 1);
			return { carve: 0, fervor: 0 };
		},
		imgActive(internalData: { fervor: number }) {
			return internalData.fervor;
		},
		imgTextLabel: 'Carve stacks',
		imgText(self) {
			return self.internalItemData.value.carve;
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
	},
	[ITEM_NAME_TO_ID.bandlepipes]: {
		internalDataProperties: ['fanfare'],
		setupData(self) {
			self.internalItemData.value.fanfare = clamp(0, self.internalItemData.value.fanfare ?? 0, 1);
			return { fanfare: 0 };
		},
		imgActive(internalData: { fanfare: number }) {
			return internalData.fanfare;
		},
		variables: defineVariables({
			meta: {
				AuraAttackSpeed: {
					resultsIsPercentage: true,
					roundReplaced: true,
				}
			}
		})
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
				MaxHealthGain: {
					statIconKey: 'level',
					extendedEquals: `<const>${ITEMS_BY_NAME.protoplasmHarness?.itemCalculations.MaxHealthGain.mFormulaParts[0]?.mStartValue} - ${ITEMS_BY_NAME.protoplasmHarness?.itemCalculations.MaxHealthGain.mFormulaParts[0]?.mEndValue}</const>`,
				},
				TotalHealthRegen: {
					statIconKey: ['level', 'armor', 'magicResist'],
					extendedEquals: `<const>${ITEMS_BY_NAME.protoplasmHarness?.itemCalculations.TotalHealthRegen.mFormulaParts[0]?.mStartValue} - ${ITEMS_BY_NAME.protoplasmHarness?.itemCalculations.TotalHealthRegen.mFormulaParts[0]?.mEndValue}%i:${STAT_ICON.level}%</const> <scalearmor>+ ${Math.round(ITEMS_BY_NAME.protoplasmHarness?.itemCalculations.TotalHealthRegen.mFormulaParts[1]!.mCoefficient! * 100)}%%i:${STAT_ICON.armor}%</scalearmor> <scalemr>+ ${Math.round(ITEMS_BY_NAME.protoplasmHarness?.itemCalculations.TotalHealthRegen.mFormulaParts[2]!.mCoefficient! * 100)}%%i:${STAT_ICON.magicResist}%</scalemr>`,
					type: VariableType.heal,
				},
			},
			uninteresting: ['f1', 'LowHealthThreshold', 'Duration', 'SizeIncrease', 'MSAmount', 'TenacityAmount'],
		}),
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
					statIconKey: 'mana',
					extendedEquals: `<const>${ITEMS_BY_NAME.actualizer?.itemCalculations.ManaCalc.mFormulaParts[0]!.mNumber}</const><scalemana> + ${ITEMS_BY_NAME.actualizer?.itemCalculations.ManaCalc.mFormulaParts[1]!.mCoefficient}% bonus</scalemana> `,
				},
			},
			uninteresting: ['Duration', 'ManaCostIncrease', 'CooldownTick'],
		}),
	},
	[ITEM_NAME_TO_ID.hexoptics]: {
		MAX_STACKS: ITEMS_BY_NAME.hexoptics?.dataValues.MaxRange,
		internalDataProperties: ['magnification'],
		setupData(self) {
			self.internalItemData.value.magnification = clamp(0, self.internalItemData.value.magnification ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.hexoptics].MAX_STACKS);
			return { magnification: 0 };
		},
		imgTextLabel: 'Magnification % damage increase',
		imgText(self) {
			const { magnification } = self.internalItemData.value as { magnification: number };
			const { dataValues: { MaxRange, MaxDamageAmp } } = ITEMS_BY_NAME.hexoptics;
			return magnification && `${roundVariable(Math.round((magnification / MaxRange * 100 * MaxDamageAmp) * 10) / 10)}%`;
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
					resultsIsPercentage: true,
				},
			},
			uninteresting: ['OOCMS', 'Duration'],
		}),
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
				DamageCalc: ICalculatedDynamicVariable;
			} {
				const { shipwrecker = 0 } = self.internalItemData.value;
				/* according to the [wiki](https://wiki.leagueoflegends.com/en-us/Dead_Man's_Plate) the ad ratio also scales with stacks reaching 100% base at 100 stacks */
				const baseRatio = shipwrecker / ITEM_SPECIFICS[ITEM_NAME_TO_ID.deadMansPlate].MAX_STACKS;

				const base = VARIABLE_CALCULATION_FNS.StatByNamedDataValueCalculationPart(ITEMS_BY_NAME.deadMansPlate?.itemCalculations.MaxDamageCalc.mFormulaParts[0] as any, ITEMS_BY_NAME.deadMansPlate, self)?.value;
				const { BonusDamagePerStack } = ITEMS_BY_NAME.deadMansPlate?.dataValues ?? 0;

				return {
					DamageCalc: {
						value: base * baseRatio + BonusDamagePerStack * shipwrecker,
					},
				};
			},
			meta: {
				MaxDamageCalc: {
					type: VariableType.physical,
					statIconKey: ['attackDamage'],
					extendedEquals: `<scalead>${Math.round((ITEMS_BY_NAME.deadMansPlate?.dataValues as any)[ITEMS_BY_NAME.deadMansPlate?.itemCalculations.MaxDamageCalc.mFormulaParts[0]?.mDataValue!] * 100)}% base %i:${STAT_ICON.attackDamage}%</scalead> <const>+ ${ITEMS_BY_NAME.deadMansPlate?.dataValues.MaxStacks * ITEMS_BY_NAME.deadMansPlate?.dataValues.BonusDamagePerStack}</const>`,
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
				handler(self, { itemPassivesStats }) {
					const { MaxStacks, MaxMovementSpeed } = ITEMS_BY_NAME.deadMansPlate?.dataValues ?? {};
					// TODO verify with the game
					itemPassivesStats.moveSpeed += MaxMovementSpeed * (self.internalItemData.value as IInternalItemDataOf<'deadMansPlate'>).shipwrecker / MaxStacks;
					itemPassivesStats.slowResist += ITEMS_BY_NAME.deadMansPlate?.dataValues.SlowResistTooltip;
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
		variables: defineVariables({
			known: {
				f4: [],
				f5: [],
			},
			calculate(self) {
				const consumptionDamage = ITEMS_BY_NAME.heartsteel?.dataValues.BaseDamage + self.stats.value.total.hp * ITEMS_BY_NAME.heartsteel?.dataValues.HPRatio;
				return {
					f4: {
						value: consumptionDamage,
					},
					f5: {
						value: consumptionDamage * ITEMS_BY_NAME.heartsteel?.dataValues.DamageToMaxHealthRatio,
					},
				};
			},
			meta: {
				f4: {
					type: VariableType.physical,
					statIconKey: 'hp',
					displayedName: 'ConsumptionDamage',
					extendedEquals: `<const>${ITEMS_BY_NAME.heartsteel?.dataValues.BaseDamage}</const> <scalehealth>+ ${Math.round(ITEMS_BY_NAME.heartsteel?.dataValues.HPRatio * 100)}%</scalehealth>`,
				},
				f5: {
					displayedName: 'ConsumptionHPGain',
				},
			},
			uninteresting: ['TotalDemolishTime', 'BaseDamage', 'MaxHPRatio', 'DamageToMaxHealthRatio', 'HealthSizeThreshold', 'SizeAmount', 'SizeCap'],
		}),
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
		MAX_STACKS: Math.round(ITEMS_BY_NAME.terminus?.dataValues.PenPerHit / ITEMS_BY_NAME.terminus?.dataValues.PenMax),
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
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
			meta: {
				OnHitDamage: {
					type: VariableType.magic,
				},
				ARMRPerHitScaling: {
					statIconKey: ['level'],
					extendedEquals: `<const>${itemVariableValue(
						'ARMRPerHitScaling',
						{ item: ITEMS_BY_NAME.terminus, damageSource: { level: { value: CHAMPION_LEVEL.min } } as DamageSource },
					).value} - ${itemVariableValue(
						'ARMRPerHitScaling',
						{ item: ITEMS_BY_NAME.terminus, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax } } as DamageSource },
					).value}%i:${STAT_ICON.level}%</const>`,
				},
				ARMRMaxScaling: {
					statIconKey: ['level'],
					extendedEquals: `<const>${itemVariableValue(
						'ARMRMaxScaling',
						{ item: ITEMS_BY_NAME.terminus, damageSource: { level: { value: CHAMPION_LEVEL.min }, isRanged: {} } as DamageSource },
					).value} - ${itemVariableValue(
						'ARMRMaxScaling',
						{ item: ITEMS_BY_NAME.terminus, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax }, isRanged: {} } as DamageSource },
					).value}%i:${STAT_ICON.level}%</const>`,
				},
			},
			uninteresting: ['f1', 'ARMRMaxScaling', 'PenPerHit', 'PenMax', 'BuffDuration'],
		}),
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
				handler(self, { totalStats, bonusStats, itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug }) {
					const variable = itemVariableValue('HasteFromAD', {
						item: ITEMS_BY_NAME.endlessHunger,
						isRanged: self.isRanged.value,
						damageSource: {
							stats: {
								value: {
									bonus: bonusStats,
								},
							},
						} as DamageSource,
					});
					const value = Array.isArray(variable.value) ? variable.value[0] : variable.value;
					if (typeof value === 'number') {
						miscDebug.endlessBonusAd = bonusStats.attackDamage;
						calculatedVariables.endlessHaste = value;

						totalStats.abilityHaste += calculatedVariables.endlessHaste;
						bonusStats.abilityHaste += calculatedVariables.endlessHaste;
						itemPassivesStats.abilityHaste += calculatedVariables.endlessHaste;
						itemTotalStats.abilityHaste += calculatedVariables.endlessHaste;
					} else {
						console.warn('[ITEM_SPECIFICS endless hunger] failed to calculate haste', variable);
					}
				},
				priority: HOOK_PRIORITIES.onTotalPreMultipliers[ITEM_NAME_TO_ID.endlessHunger],
			},
		},
		variables: defineVariables({
			meta: {
				HasteFromAD: {
					statIconKey: 'attackDamage',
					extendedEquals: {
						prefix: `<const>${ITEMS_BY_NAME.endlessHunger?.itemCalculations.HasteFromADMelee?.mFormulaParts[0]!.mNumber}</const> + <scalead>`,
						meleeValue: Math.round(ITEMS_BY_NAME.endlessHunger?.itemCalculations.HasteFromADMelee?.mFormulaParts[1]!.mCoefficient! * 100),
						rangedValue: Math.round(ITEMS_BY_NAME.endlessHunger?.itemCalculations.HasteFromADRanged?.mFormulaParts[1]!.mCoefficient! * 100),
						valueSuffix: '%',
						suffix: ' bonus</scalead> ',
					},
				},
			},
			uninteresting: ['OmnivampDuration', 'OmnivampOnTakedown', 'TakedownWindow'],
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
					lolcalcChampRange: {
						value: [
							itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.mawOfMalmortius, damageSource: self, isRanged: false }).value as number,
							itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.mawOfMalmortius, damageSource: self, isRanged: true }).value as number,
						],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					/* array `statIconKey` usually used for when the variable scales with multiple stats, but it also makes it so when description is extended, no icon is appended after `extendedEquals`. Used here so the ad icon can be inserted at appropriate points in melee/ranged values since they have a <const> */
					statIconKey: ['attackDamage'],
					displayedName: 'Shield',
					extendedEquals: {
						prefix: '',
						meleeValue: `<const>${mawOfMalmortiusSpecific.meleeShield}</const> <scalead>+ ${Math.round((mawOfMalmortiusSpecific.meleeAdScaling) * 100)}% bonus %i:${STAT_ICON.attackDamage}%</scalead>`,
						rangedValue: `<const>${mawOfMalmortiusSpecific.meleeShield * mawOfMalmortiusSpecific.rangedModifier}</const> <scalead>+ ${roundVariable(mawOfMalmortiusSpecific.meleeAdScaling * mawOfMalmortiusSpecific.rangedModifier * 100, 1)}% bonus %i:${STAT_ICON.attackDamage}%</scalead>`,
						suffix: '',
					},
				},
			},
			uninteresting: ['f4', 'LowHealthThreshold', 'ShieldDuration', 'BuffVamp'],
		}),
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
	},
	[ITEM_NAME_TO_ID.gluttonousGreaves]: gluttonousGreavesSpecific,
	[ITEM_NAME_TO_ID.immortalPath]: gluttonousGreavesSpecific, // TODO calculate passive
	[ITEM_NAME_TO_ID.rabadon]: {
		calculateHooks: {
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
					const value = calculatedVariables.apMultipliersBase * ITEMS_BY_NAME.rabadon?.dataValues.APAmp;
					calculatedVariables.totalItemApMultipliers += ITEMS_BY_NAME.rabadon?.dataValues.APAmp;
					itemPassivesStats.abilityPower += value;
					itemTotalStats.abilityPower += value;
					calculatedVariables.rabadonMagicalOpus = value;
				},
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
					statIconKey: ['attackDamage', 'abilityPower'],
					extendedEquals: `<scalead>${Math.round((ITEMS_BY_NAME.lichBane?.dataValues as any)[ITEMS_BY_NAME.lichBane?.itemCalculations.SpellbladeDamage.mFormulaParts[0]?.mDataValue!] * 100)}% base %i:${STAT_ICON.attackDamage}%</scalead> <scaleap>+ ${Math.round((ITEMS_BY_NAME.lichBane?.dataValues as any)[ITEMS_BY_NAME.lichBane?.itemCalculations.SpellbladeDamage.mFormulaParts[1]?.mDataValue!] * 100)}%%i:${STAT_ICON.abilityPower}%</scaleap>`,
				},
			},
			uninteresting: ['f1', 'SpellBladeDuration', 'SheenASBuff'],
		}),
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
					resultsIsPercentage: true,
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
			const maxValueAt = VARIABLE_CALCULATION_FNS.mFormulaParts(ITEMS_BY_NAME.overlordsBloodmail?.itemCalculations.RemainingHealthThreshold, ITEMS_BY_NAME.overlordsBloodmail, damageSource);
			if (!maxValueAt || typeof maxValueAt.value !== 'number') {
				console.warn('[ITEM_SPECIFICS bloodmail] failed to resolve RemainingHealthThreshold variable value');
				return 0;
			}

			const currentHealthP = Math.min(damageSource.currentHealth.value / (maxHpOverride ?? Math.max(damageSource.stats.value.total.hp, 1)), 1);
			const missingHealthP = 1 - currentHealthP;
			const maxMissingHealthP = 1 - maxValueAt.value;
			return ITEMS_BY_NAME.overlordsBloodmail?.dataValues.MissingHealthAD * Math.min(1, missingHealthP / maxMissingHealthP);
		},
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
			onTotalPreMultipliers: {
				handler(self, { totalPreMultipliersStats, totalMultipliersStats, itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug }) {
					miscDebug.bloodmailRetributionPercentage = ITEM_SPECIFICS[ITEM_NAME_TO_ID.overlordsBloodmail].BONUS_AD_PERCENTAGE(self, totalPreMultipliersStats.hp);
					calculatedVariables.bloodmailRetribution = totalPreMultipliersStats.attackDamage * miscDebug.bloodmailRetributionPercentage;

					totalMultipliersStats.attackDamage += calculatedVariables.bloodmailRetribution;
					itemPassivesStats.attackDamage += calculatedVariables.bloodmailRetribution;
					itemTotalStats.attackDamage += calculatedVariables.bloodmailRetribution;
				},
				priority: HOOK_PRIORITIES.onTotalPreMultipliers[ITEM_NAME_TO_ID.overlordsBloodmail],
			},
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
							?? self.stats.value.bonus.attackDamage * ITEMS_BY_NAME.overlordsBloodmail?.dataValues.HPToADPercentage,
					},
					f2: {
						value: self.stats.value.variables.bloodmailRetribution
							?? self.stats.value.bonus.attackDamage,
					},
				};
			},
			meta: {
				f1: {
					extendedEquals: `<scalehealth>${ITEMS_BY_NAME.overlordsBloodmail?.dataValues.HPToADPercentage * 100}% bonus</scalehealth> `,
					displayedName: 'BonusHPAD',
				},
				f2: {
					displayedName: 'MissingHPAD',
				},
			},
			uninteresting: ['HPToADPercentage', 'MissingHealthAD', 'RemainingHealthThreshold'],
		}),
		imgTextLabel: 'Retribution ad increase',
		imgText(damageSource) {
			return damageSource.stats.value.variables.bloodmailRetribution
				? Math.round(damageSource.stats.value.variables.bloodmailRetribution)
				: 0;
		},
	},
	[ITEM_NAME_TO_ID.steraksGage]: {
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemPassivesStats, baseOnLevelStats }, { calculatedVariables }) {
					const value = VARIABLE_CALCULATION_FNS.mFormulaParts(ITEMS_BY_NAME.steraksGage?.itemCalculations.BonusAD, ITEMS_BY_NAME.steraksGage, { stats: { value: { baseOnLevel: baseOnLevelStats } } } as DamageSource);
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
				BonusAD: {
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round(ITEMS_BY_NAME.steraksGage?.dataValues.ADtoAD * 100)}% base</scalead> `,
				},
				ShieldSize: {
					statIconKey: 'hp',
					extendedEquals: `<scalehealth>${Math.round(ITEMS_BY_NAME.steraksGage?.dataValues.BaseShieldRatio * 100)}% bonus</scalehealth> `,
					type: VariableType.shield,
				},
			},
			uninteresting: ['f5', 'LowHealthThreshold', 'ShieldDuration'],
		}),
	},
	[ITEM_NAME_TO_ID.swiftmarch]: {
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemPassivesStats }) {
					itemPassivesStats.slowResist += ITEMS_BY_NAME.swiftmarch?.dataValues.SlowResistTooltip;
				},
			},
			onTotalPreMultipliers: {
				handler(_self, { totalPreMultipliersStats, totalMultipliersStats, itemTotalStats, itemPassivesStats, adaptiveForceMeta }, { calculatedVariables, miscDebug }) {
					miscDebug.swiftmarchTotalMs = totalPreMultipliersStats.moveSpeed;
					const adaptiveForce = VARIABLE_CALCULATION_FNS.mFormulaParts(ITEMS_BY_NAME.swiftmarch?.itemCalculations.MSToAdaptiveCalc, ITEMS_BY_NAME.swiftmarch, { stats: { value: { total: totalPreMultipliersStats } } } as DamageSource);
					if (typeof adaptiveForce?.value === 'number') {
						calculatedVariables.swiftmarchAdaptive = adaptiveForce.value;
						const statValue = calculatedVariables.swiftmarchAdaptive * adaptiveForceMeta[2];

						totalMultipliersStats[adaptiveForceMeta[0]] += statValue;
						itemPassivesStats[adaptiveForceMeta[0]] += statValue;
						itemTotalStats[adaptiveForceMeta[0]] += statValue;

						if (adaptiveForceMeta[0] === 'abilityPower') {
							calculatedVariables.apMultipliersBase += statValue;
						}
					} else {
						console.warn('[ITEM_SPECIFICS swiftmarch] failed to resolve MSToAdaptiveCalc variable value');
					}
				},
			},
		},
		variables: defineVariables({
			meta: {
				MSToAdaptiveCalc: {
					statIconKey: 'moveSpeed',
					extendedEquals: `<speed>${Math.round(ITEMS_BY_NAME.swiftmarch?.dataValues.MSAdaptiveRatio * 100)}%</speed>`,
				},
			},
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
					statIconKey: ['attackDamage', 'abilityPower'],
					extendedEquals: `<scalead>${Math.round(ITEMS_BY_NAME.duskAndDawn?.itemCalculations.SpellbladeDamage.mFormulaParts[0]!.mCoefficient * 100)}% base %i:${STAT_ICON.attackDamage}%</scalead> <scaleap>+ ${Math.round(ITEMS_BY_NAME.duskAndDawn?.itemCalculations.SpellbladeDamage.mFormulaParts[1]!.mCoefficient * 100)}%%i:${STAT_ICON.abilityPower}%</scaleap>`,
				},
				SpellbladeHealing: {
					type: VariableType.heal,
					statIconKey: ['abilityPower', 'hp'],
					extendedEquals: `<scaleap>${Math.round(ITEMS_BY_NAME.duskAndDawn?.itemCalculations.SpellbladeHealing.mFormulaParts[0]!.mCoefficient * 100)}%%i:${STAT_ICON.abilityPower}%</scaleap> <scalehealth>+ ${Math.round(ITEMS_BY_NAME.duskAndDawn?.itemCalculations.SpellbladeHealing.mFormulaParts[1]!.mCoefficient * 100)}% bonus %i:${STAT_ICON.hp}%</scalehealth>`,
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
					statIconKey: 'hp',
					extendedEquals: `<scalehealth>${Math.round(ITEMS_BY_NAME.unendingDespair?.dataValues.BonusHealthDrainPercentage * 100)}% bonus</scalehealth> `,
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
			meta: {
				AbilityDamageCalc: {
					/* statIconKey array for same reason as maw of malmortius */
					statIconKey: ['lethality'],
					extendedEquals: {
						prefix: '',
						meleeValue: `<const>${bastionBreakerSpecifics.abilityDamageCalcBase}</const> <scalelethality>+ ${Math.round(bastionBreakerSpecifics.abilityDamageCalcRangeCoefficient! * 100)}%%i:${STAT_ICON.lethality}%</scalelethality>`,
						rangedValue: `${bastionBreakerSpecifics.abilityDamageCalcBase! * bastionBreakerSpecifics.abilityDamageCalcRangeModifier}</const> <scalelethality>+ ${Math.round(bastionBreakerSpecifics.abilityDamageCalcRangeCoefficient! * bastionBreakerSpecifics.abilityDamageCalcRangeModifier * 100)}%%i:${STAT_ICON.lethality}%</scalelethality>`,
						suffix: '',
					},
				},
				DamageCalc: {
					/* statIconKey array for same reason as maw of malmortius */
					statIconKey: ['lethality'],
					extendedEquals: {
						prefix: '',
						meleeValue: `<const>${bastionBreakerSpecifics.damageCalcBase}</const><scalelethality> + ${Math.round(bastionBreakerSpecifics.damageCalcRangeCoefficient! * 100)}%%i:${STAT_ICON.lethality}%</scalelethality>`,
						rangedValue: `${bastionBreakerSpecifics.damageCalcBase! * bastionBreakerSpecifics.damageCalcRangeModifier}</const><scalelethality> + ${Math.round(bastionBreakerSpecifics.damageCalcRangeCoefficient! * bastionBreakerSpecifics.damageCalcRangeModifier * 100)}%%i:${STAT_ICON.lethality}%</scalelethality>`,
						suffix: '',
					},
				},
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
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemPassivesStats }) {
					itemPassivesStats.ultimateHaste += ITEMS_BY_NAME.zekesConvergence?.dataValues.UltimateHaste ?? 0;
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
				DamagePerSecond: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['f1', 'UltimateHaste', 'Duration', 'SlowAmount'],
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
					statIconKey: 'hp',
					extendedEquals: `<const>${ITEMS_BY_NAME.sunfireAegis?.itemCalculations.DamagePerTick.mFormulaParts[0]!.mNumber}</const> <scalehealth>+ ${Math.round(ITEMS_BY_NAME.sunfireAegis?.itemCalculations.DamagePerTick.mFormulaParts[1]!.mCoefficient! * 100)}% bonus</scalehealth> `,
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
					statIconKey: 'armor',
					extendedEquals: `<const>${ITEMS_BY_NAME.thornmail?.dataValues.BaseDamage}</const><scalearmor> + ${Math.round(ITEMS_BY_NAME.thornmail?.dataValues.BonusArmorDamageRatio * 100)}% bonus</scalearmor> `,
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
					lolcalcChampRange: {
						value: [
							itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.ravenousHydra, damageSource: self, isRanged: false }).value as number,
							itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.ravenousHydra, damageSource: self, isRanged: true }).value as number,
						],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					statIconKey: 'attackDamage',
					displayedName: 'CleaveDamage',
					extendedEquals: {
						prefix: '<scalead>',
						meleeValue: Math.round(ITEMS_BY_NAME.ravenousHydra?.itemCalculations.MeleeItemCalcValue.mFormulaParts[0]?.mCoefficient! * 100),
						rangedValue: Math.round(ITEMS_BY_NAME.ravenousHydra?.itemCalculations.RangedItemCalcValue.mFormulaParts[0]?.mCoefficient! * 100),
						valueSuffix: '%',
						suffix: '</scalead>',
					},
				},
				PrimaryDamage: {
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round(ITEMS_BY_NAME.ravenousHydra?.dataValues.ActiveADRatio * 100)}%</scalead>`,
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
					lolcalcChampRange: {
						value: [
							itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.tiamat, damageSource: self, isRanged: false }).value as number,
							itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.tiamat, damageSource: self, isRanged: true }).value as number,
						],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					type: VariableType.physical,
					statIconKey: 'attackDamage',
					displayedName: 'CleaveDamage',
					extendedEquals: {
						prefix: '<scalead>',
						meleeValue: Math.round(ITEMS_BY_NAME.tiamat?.itemCalculations.MeleeItemCalcValue.mFormulaParts[0]?.mCoefficient! * 100),
						rangedValue: Math.round(ITEMS_BY_NAME.tiamat?.itemCalculations.RangedItemCalcValue.mFormulaParts[0]?.mCoefficient! * 100),
						valueSuffix: '%',
						suffix: '</scalead>',
					},
				},
				PrimaryDamage: {
					type: VariableType.physical,
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round(ITEMS_BY_NAME.tiamat?.dataValues.ActiveADRatio * 100)}%</scalead>`,
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
		calculateHooks: {
			preItemTotal: {
				handler(_self, { itemBaseStats, itemPassivesStats }, { calculatedVariables }) {
					calculatedVariables.warmogsVitality = itemBaseStats.hp * ITEMS_BY_NAME.warmogsArmor?.dataValues.HPAmp;
					itemPassivesStats.hp += calculatedVariables.warmogsVitality;
				},
			},
		},
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
				TotalHealingTooltip: {
					statIconKey: 'hp',
					extendedEquals: `<scalehealth>${Math.round(ITEMS_BY_NAME.warmogsArmor?.dataValues.MaxHealthRatio * ITEMS_BY_NAME.warmogsArmor?.itemCalculations.TotalHealingTooltip.mMultiplier.mNumber * 100)}%</scalehealth>`,
				},
				f2: {
					displayedName: 'BonusMaxHP',
				},
			},
			uninteresting: ['f1', 'HealthThreshold', 'OOCTimerChampion', 'HPAmp', 'OOCTimer'],
		}),
	},
	[ITEM_NAME_TO_ID.runaan]: {
		variables: defineVariables({
			meta: {
				BoltDamage: {
					type: VariableType.physical,
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round(ITEMS_BY_NAME.runaan?.itemCalculations.BoltDamage.mFormulaParts[0]?.mSubpart.mNumber! * 100)}%</scalead>`,
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
				BounceCount: {
					statIconKey: 'level',
					extendedEquals: `<const>${ITEMS_BY_NAME.statikkShiv?.itemCalculations.BounceCount.mFormulaParts[0]?.mLevel1Value} - ${ITEMS_BY_NAME.statikkShiv ? VARIABLE_CALCULATION_FNS.ByCharLevelBreakpointsCalculationPart(ITEMS_BY_NAME.statikkShiv.itemCalculations.BounceCount.mFormulaParts[0]!, {}, { level: { value: 18 } } as DamageSource)?.value : 0}</const>`,
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
			self.internalItemData.value.aLevel = clamp(CHAMPION_LEVEL.min, self.internalItemData.value.aLevel ?? 1, CHAMPION_LEVEL.vanillaMax);
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
					HealAmount: {
						value: itemVariableValue('HealAmount', { item: ITEMS_BY_NAME.redemption, damageSource: { level: { value: self.internalItemData.value.aLevel } } as DamageSource }).value as number,
					},
				};
			},
			meta: {
				/* 99% sure this goes above the declared `350` for toplaners with lvl 19/20 */
				HealAmount: {
					type: VariableType.heal,
					isCustom: true,
					extendedEquals: `<const>${Math.round(itemVariableValue('HealAmount', { item: ITEMS_BY_NAME.redemption, damageSource: { level: { value: CHAMPION_LEVEL.min } } as DamageSource }).value as number)} - ${Math.round(itemVariableValue('HealAmount', { item: ITEMS_BY_NAME.redemption, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax } } as DamageSource }).value as number)}</const>`,
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
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${ITEMS_BY_NAME.nashorsTooth?.dataValues.NashorsBaseValue}</const> <scaleap>+ ${Math.round(ITEMS_BY_NAME.nashorsTooth?.dataValues.NashorsAPValue * 100)}%</scaleap>`,
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
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${(ITEMS_BY_NAME.malignance?.dataValues as any)[ITEMS_BY_NAME.malignance?.itemCalculations.GroundBurnDamagePerTickTooltipOnly.mFormulaParts[0]!.mDataValue!]}</const> <scaleap>+ ${Math.round((ITEMS_BY_NAME.malignance?.dataValues as any)[ITEMS_BY_NAME.malignance?.itemCalculations.GroundBurnDamagePerTickTooltipOnly.mFormulaParts[1]!.mDataValue!] * 100)}%</scaleap>`,
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
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${(ITEMS_BY_NAME.cryptbloom?.dataValues as any)[ITEMS_BY_NAME.cryptbloom?.itemCalculations.TotalHealAmount.mFormulaParts[0]!.mDataValue!]}</const> <scaleap>+ ${Math.round((ITEMS_BY_NAME.cryptbloom?.dataValues as any)[ITEMS_BY_NAME.cryptbloom?.itemCalculations.TotalHealAmount.mFormulaParts[1]!.mDataValue!] * 100)}%</scaleap>`,
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
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${(ITEMS_BY_NAME.rocketbelt?.dataValues as any)[ITEMS_BY_NAME.rocketbelt?.itemCalculations.FireboltDamage.mFormulaParts[0]!.mDataValue!]}</const> <scaleap>+ ${Math.round((ITEMS_BY_NAME.rocketbelt?.dataValues as any)[ITEMS_BY_NAME.rocketbelt?.itemCalculations.FireboltDamage.mFormulaParts[1]!.mDataValue!] * 100)}%</scaleap>`,
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
			meta: {
				ShieldAmountCalc: {
					statIconKey: ['level', 'hp'],
					extendedEquals: `<const>${ITEMS_BY_NAME.chainlacedCrushers?.itemCalculations.ShieldAmountCalc.mFormulaParts[0]?.mLevel1Value} - ${
						ITEMS_BY_NAME.chainlacedCrushers?.itemCalculations.ShieldAmountCalc.mFormulaParts[0]!.mLevel1Value!
						+ (
							ITEMS_BY_NAME.chainlacedCrushers?.itemCalculations.ShieldAmountCalc.mFormulaParts[0]!.mBreakpoints![0]!.mBonusPerLevelAtAndAfter
							* (18 + 1 - ITEMS_BY_NAME.chainlacedCrushers?.itemCalculations.ShieldAmountCalc.mFormulaParts[0]!.mBreakpoints![0]!.mLevel)
						)
					}%i:${STAT_ICON.level}%</const> <scalehealth>+ ${Math.round((ITEMS_BY_NAME.chainlacedCrushers?.dataValues as any)[ITEMS_BY_NAME.chainlacedCrushers?.itemCalculations.ShieldAmountCalc.mFormulaParts[1]!.mDataValue!] * 100)}% bonus %i:${STAT_ICON.hp}%</scalehealth>`,
				},
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
					// TODO
					AttackDamageReduced: { value: 123 },
				};
			},
			meta: {
				ShieldAmountCalc: {
					// TODO check if is reduced by shield reaver
					type: VariableType.shield,
					statIconKey: ['level', 'hp'],
					extendedEquals: `<const>${ITEMS_BY_NAME.armoredAdvance?.itemCalculations.ShieldAmountCalc.mFormulaParts[0]?.mLevel1Value} - ${
						ITEMS_BY_NAME.armoredAdvance?.itemCalculations.ShieldAmountCalc.mFormulaParts[0]!.mLevel1Value!
						+ (
							ITEMS_BY_NAME.armoredAdvance?.itemCalculations.ShieldAmountCalc.mFormulaParts[0]!.mBreakpoints![0]!.mBonusPerLevelAtAndAfter
							* (18 + 1 - ITEMS_BY_NAME.armoredAdvance?.itemCalculations.ShieldAmountCalc.mFormulaParts[0]!.mBreakpoints![0]!.mLevel)
						)
					}%i:${STAT_ICON.level}%</const> <scalehealth>+ ${Math.round((ITEMS_BY_NAME.armoredAdvance?.dataValues as any)[ITEMS_BY_NAME.armoredAdvance?.itemCalculations.ShieldAmountCalc.mFormulaParts[1]!.mDataValue!] * 100)}% bonus %i:${STAT_ICON.hp}%</scalehealth>`,
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
			meta: {
				ProcDamage: {
					statIconKey: 'lethality',
					extendedEquals: `<const>${ITEMS_BY_NAME.umbralGlaive?.itemCalculations.ProcDamage.mFormulaParts[0]!.mNumber}</const> <scalelethality>+ ${Math.round(ITEMS_BY_NAME.umbralGlaive?.itemCalculations.ProcDamage.mFormulaParts[1]!.mCoefficient! * 100)}%</scalelethality>`,
				},
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
					statIconKey: ['attackDamage', 'hp'],
					extendedEquals: {
						prefix: '',
						meleeValue: `<scalead>${Math.round(hullbreakerSpecifics.nonStructureAdRatio * 100)}% base %i:${STAT_ICON.attackDamage}%</scalead> <scalehealth>+ ${Math.round(hullbreakerSpecifics.nonStructureHpRatio * 100)}%%i:${STAT_ICON.hp}%</scalehealth>`,
						rangedValue: `<scalead>${Math.round(hullbreakerSpecifics.nonStructureAdRatio * 100 * hullbreakerSpecifics.structureRangedModifier)}% base %i:${STAT_ICON.attackDamage}%</scalead> <scalehealth>+ ${roundVariable(hullbreakerSpecifics.nonStructureHpRatio * 100 * hullbreakerSpecifics.structureRangedModifier, 1)}%%i:${STAT_ICON.hp}%</scalehealth>`,
						suffix: '',
					},
				},
				MaxStackDamageVSStructures: {
					type: VariableType.physical,
					statIconKey: ['attackDamage', 'hp'],
					extendedEquals: {
						prefix: '',
						meleeValue: `<scalead>${Math.round(hullbreakerSpecifics.structureAdRatio * 100)}% base %i:${STAT_ICON.attackDamage}%</scalead> <scalehealth>+ ${Math.round(hullbreakerSpecifics.structureHpRatio * 100)}%%i:${STAT_ICON.hp}%</scalehealth>`,
						rangedValue: `<scalead>${Math.round(hullbreakerSpecifics.structureAdRatio * 100 * hullbreakerSpecifics.structureRangedModifier)}% base %i:${STAT_ICON.attackDamage}%</scalead> <scalehealth>+ ${roundVariable(hullbreakerSpecifics.structureHpRatio * 100 * hullbreakerSpecifics.structureRangedModifier, 1)}%%i:${STAT_ICON.hp}%</scalehealth>`,
						suffix: '',
					},
				},
				BonusMinionResists: {
					statIconKey: ['level'],
					extendedEquals: {
						prefix: '',
						meleeValue: `<const>${hullbreakerSpecifics.meleeBonusMinionResistsLvl1} - ${hullbreakerSpecifics.meleeBonusMinionResistsLvl18}%i:${STAT_ICON.level}%</const>`,
						rangedValue: `<const>${Math.round(hullbreakerSpecifics.meleeBonusMinionResistsLvl1 * hullbreakerSpecifics.bonusMinionResistsRangedModifier)} - ${Math.round(hullbreakerSpecifics.meleeBonusMinionResistsLvl18 * hullbreakerSpecifics.bonusMinionResistsRangedModifier)}%i:${STAT_ICON.level}%</const>`,
						suffix: '',
					},
				},
			},
			uninteresting: ['f1', 'f2'],
		}),
	},
	[ITEM_NAME_TO_ID.solariLocket]: {
		internalDataProperties: ['aLevel'],
		setupData(self) {
			self.internalItemData.value.aLevel = clamp(CHAMPION_LEVEL.min, self.internalItemData.value.aLevel ?? 1, CHAMPION_LEVEL.max);
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
					ShieldAmount: {
						value: itemVariableValue('ShieldAmount', { item: ITEMS_BY_NAME.solariLocket, damageSource: { level: { value: self.internalItemData.value.aLevel } } as DamageSource }).value as number,
					},
				};
			},
			meta: {
				ShieldAmount: {
					type: VariableType.shield,
					isCustom: true,
					displayedName: 'ShieldAmount',
					extendedEquals: `<const>${itemVariableValue('ShieldAmount', { item: ITEMS_BY_NAME.solariLocket, damageSource: { level: { value: CHAMPION_LEVEL.min } } as DamageSource }).value} - ${itemVariableValue('ShieldAmount', { item: ITEMS_BY_NAME.solariLocket, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax } } as DamageSource }).value}</const>`,
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
			self.internalItemData.value.aLevel = clamp(CHAMPION_LEVEL.min, self.internalItemData.value.aLevel ?? 1, CHAMPION_LEVEL.vanillaMax);
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
					AmountToHeal: {
						value: itemVariableValue('AmountToHeal', { item: ITEMS_BY_NAME.mikaelsBlessing, damageSource: { level: { value: self.internalItemData.value.aLevel } } as DamageSource }).value as number,
					},
				};
			},
			meta: {
				AmountToHeal: {
					type: VariableType.heal,
					isCustom: true,
					extendedEquals: `<const>${itemVariableValue('AmountToHeal', { item: ITEMS_BY_NAME.mikaelsBlessing, damageSource: { level: { value: CHAMPION_LEVEL.min } } as DamageSource }).value} - ${Math.round(itemVariableValue('AmountToHeal', { item: ITEMS_BY_NAME.mikaelsBlessing, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax } } as DamageSource }).value as number)}</const>`,
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
					statIconKey: ['attackDamage', 'critChance'],
					extendedEquals: `<scalead>${Math.round((ITEMS_BY_NAME.essenceReaver?.dataValues as any)[ITEMS_BY_NAME.essenceReaver?.itemCalculations.SpellbladeDamage.mFormulaParts[0]!.mDataValue!] * 100)}% base %i:${STAT_ICON.attackDamage}%</scalead> + ${(ITEMS_BY_NAME.essenceReaver?.dataValues as any)[ITEMS_BY_NAME.essenceReaver?.itemCalculations.SpellbladeDamage.mFormulaParts[1]!.mDataValue!]}%%i:${STAT_ICON.critChance}%`,
				},
				TotalManaRefund: {
					statIconKey: ['attackDamage', 'critChance'],
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
				const apDamage = itemVariableValue('TooltipDamage', { item: ITEMS_BY_NAME.zazZakRealmspike, damageSource: self, isRanged: self.isRanged.value });
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
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${(ITEMS_BY_NAME.zazZakRealmspike?.dataValues as any)[ITEMS_BY_NAME.zazZakRealmspike?.itemCalculations.TooltipDamage.mFormulaParts[0]!.mDataValue!]}</const> <scaleap>+ ${Math.round((ITEMS_BY_NAME.zazZakRealmspike?.dataValues as any)[ITEMS_BY_NAME.zazZakRealmspike?.itemCalculations.TooltipDamage.mFormulaParts[1]!.mDataValue!] * 100)}%</scaleap>`,
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
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${(ITEMS_BY_NAME.stormsurge?.dataValues as any)[ITEMS_BY_NAME.stormsurge.itemCalculations.SquallDamage.mFormulaParts[0]!.mDataValue!]}</const> <scaleap>+ ${Math.round((ITEMS_BY_NAME.stormsurge?.dataValues as any)[ITEMS_BY_NAME.stormsurge.itemCalculations.SquallDamage.mFormulaParts[1]!.mDataValue!] * 100)}%</scaleap>`,
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
					lolcalcChampRange: {
						value: [
							itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.deathsDance, damageSource: self, isRanged: false }).value as number,
							itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.deathsDance, damageSource: self, isRanged: true }).value as number,
						],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					displayedName: 'IgnoreDamagePercent',
					isPercentage: true,
					multiplier: 100,
					resultsIsPercentage: true,
				},
				HealTotal: {
					type: VariableType.heal,
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round((ITEMS_BY_NAME.deathsDance?.dataValues as any)[ITEMS_BY_NAME.deathsDance?.itemCalculations.HealTotal.mFormulaParts[0]!.mDataValue!] * 100)}% bonus</scalead> `,
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
				const baseMelee = itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.sunderedSky, damageSource: self, isRanged: false }).value as number;
				const baseRanged = itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.sunderedSky, damageSource: self, isRanged: true }).value as number;
				const missingHp = self.stats.value.total.hp - self.currentHealth.value;
				const missingHpHeal = missingHp * ITEMS_BY_NAME.sunderedSky?.dataValues.MissingHealthHeal;

				return {
					f2: { value: 0 },
					lolcalcChampRange: {
						value: [baseMelee, baseRanged],
					},
					Heal: {
						value: [baseMelee + missingHpHeal, baseRanged + missingHpHeal],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					type: VariableType.heal,
					displayedName: 'BaseHeal',
					statIconKey: ['attackDamage'],
					extendedEquals: {
						prefix: '',
						meleeValue: `<scalead>${Math.round(sunderedSkySpecifics.meleeAdRatio * 100)}% base %i:${STAT_ICON.attackDamage}%</scalead>`,
						rangedValue: `<scalead>${Math.round(sunderedSkySpecifics.meleeAdRatio * sunderedSkySpecifics.rangedModifier * 100)}% base %i:${STAT_ICON.attackDamage}%</scalead>`,
						suffix: ' ',
					},
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
					// TODO check if affected by grievous, wording bit weird "restore as Health"
					type: 'heal',
					statIconKey: 'level',
					extendedEquals: `<const>${itemVariableValue('MaxCharges', { item: ITEMS_BY_NAME.echoesOfHelia, damageSource: { level: { value: CHAMPION_LEVEL.min } } as DamageSource }).value} - ${itemVariableValue('MaxCharges', { item: ITEMS_BY_NAME.echoesOfHelia, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax } } as DamageSource }).value}</const>`,
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
					},
					f3: {
						value: self.stats.value.variables.dawncoreHsp === undefined
							? self.stats.value.variables.baseItemManaRegenPercent * ITEMS_BY_NAME.dawncore?.dataValues.HSPowerPerManaRegen
							: self.stats.value.variables.dawncoreHsp,
					},
				};
			},
			meta: {
				f2: {
					displayedName: 'TotalAP',
					statIconKey: 'manaRegen',
					extendedEquals: `<scalemana>${ITEMS_BY_NAME.dawncore?.dataValues.APPerManaRegen}% base</scalemana> `,
				},
				f3: {
					displayedName: 'TotalHSPower',
					statIconKey: 'manaRegen',
					extendedEquals: `<scalemana>${Math.round(ITEMS_BY_NAME.dawncore?.dataValues.HSPowerPerManaRegen * 100)}% base</scalemana> `,
					resultsIsPercentage: true,
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
		internalDataProperties: ['tBShockwave'],
		setupData(self) {
			self.internalItemData.value.tBShockwave = clamp(0, self.internalItemData.value.tBShockwave ?? 0, 1);
			return {
				/** _target_ breaking shockwave, since there's also "self" breaking shockwave giving move speed, not implemented atm */
				tBShockwave: 0,
			};
		},
		/* should be 2 part, same as youmuu, when the 2nd part of the passive that applies the move speed bonus on self is implemented */
		imgActive(internalData: { tBShockwave: number }) {
			return internalData.tBShockwave;
		},
		variables: defineVariables({
			known: {
				lolcalcChampRange: [],
			},
			calculate(self) {
				return {
					lolcalcChampRange: {
						value: [
							itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.stridebreaker, damageSource: self, isRanged: false }).value as number,
							itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.stridebreaker, damageSource: self, isRanged: true }).value as number,
						],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					type: VariableType.physical,
					displayedName: 'CleaveDamage',
					statIconKey: 'attackDamage',
					extendedEquals: {
						prefix: '<scalead>',
						meleeValue: Math.round(ITEMS_BY_NAME.stridebreaker?.itemCalculations.MeleeItemCalcValue.mFormulaParts[0]!.mCoefficient * 100),
						rangedValue: Math.round(ITEMS_BY_NAME.stridebreaker?.itemCalculations.RangedItemCalcValue.mFormulaParts[0]!.mCoefficient * 100),
						valueSuffix: '%',
						suffix: '</scalead>',
					},
				},
				SlashDamage: {
					type: VariableType.physical,
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round((ITEMS_BY_NAME.stridebreaker?.dataValues as any)[ITEMS_BY_NAME.stridebreaker?.itemCalculations.SlashDamage.mFormulaParts[0]!.mDataValue!] * 100)}%</scalead>`,
				},
			},
			uninteresting: ['MSSlow', 'ActiveMS', 'Duration'],
		}),
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
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${ludensEchoSpecifics.const}</const> <scaleap>+ ${Math.round(ludensEchoSpecifics.apRatio * 100)}%</scaleap>`,
				},
				SingleTargetMax: {
					type: VariableType.magic,
					statIconKey: 'abilityPower',
					extendedEquals: `<const>${ludensEchoSpecifics.const * ludensEchoSpecifics.singleTargetMaxMultiplier}</const> <scaleap>+ ${Math.round(ludensEchoSpecifics.apRatio * ludensEchoSpecifics.singleTargetMaxMultiplier * 100)}%</scaleap>`,
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
					statIconKey: 'level',
					extendedEquals: `<const>${itemVariableValue('ProcDmg', { item: ITEMS_BY_NAME.dreamMaker, damageSource: { level: { value: CHAMPION_LEVEL.min } } as DamageSource }).value} - ${itemVariableValue('ProcDmg', { item: ITEMS_BY_NAME.dreamMaker, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax } } as DamageSource }).value}</const>`,
				},
				FlatDR: {
					statIconKey: 'level',
					extendedEquals: `<const>${itemVariableValue('FlatDR', { item: ITEMS_BY_NAME.dreamMaker, damageSource: { level: { value: CHAMPION_LEVEL.min } } as DamageSource }).value} - ${itemVariableValue('FlatDR', { item: ITEMS_BY_NAME.dreamMaker, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax } } as DamageSource }).value}</const>`,
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
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round((ITEMS_BY_NAME.icebornGauntlet?.dataValues as any)[ITEMS_BY_NAME.icebornGauntlet?.itemCalculations.SpellbladeDamage.mFormulaParts[0]!.mDataValue!] * 100)}% base</scalead> `,
				},
				/* technically game rounds this to 13% for ranged but showing `12.5` should be fine */
				SlowAmountMeleeRangedSplit: {
					isPercentage: true,
					multiplier: 100,
					resultsIsPercentage: true,
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
					statIconKey: 'hp',
					extendedEquals: `<const>${hollowRadianceSpecifics.const}</const> <scalehealth>+ ${Math.round(hollowRadianceSpecifics.hpRatio * 100)}% bonus</scalehealth> `,
				},
				ProcDamageTOOLTIPONLY: {
					type: VariableType.magic,
					statIconKey: 'hp',
					extendedEquals: `<const>${hollowRadianceSpecifics.const! * hollowRadianceSpecifics.procMultiplier}</const> <scalehealth>+ ${Math.round(hollowRadianceSpecifics.hpRatio * hollowRadianceSpecifics.procMultiplier * 100)}% bonus</scalehealth> `,
				},
			},
			uninteresting: ['f1', 'f2', 'AuraDuration', 'MinionMod', 'MonsterMod'],
		}),
	},
	[ITEM_NAME_TO_ID.krakenSlayer]: {
		variables: defineVariables({
			known: {
				f2: [],
				CalculatedDamage: [],
			},
			calculate(self, target) {
				const damage = itemVariableValue('DamageAmount', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: self, isRanged: self.isRanged.value });
				const maxMultiplier = (ITEMS_BY_NAME.krakenSlayer?.dataValues as any)[ITEMS_BY_NAME.krakenSlayer?.itemCalculations.MaximumDamage.mMultiplier.mDataValue!] ?? 1;
				const targetMissingHpPercent = target
					? target.currentHealth.value ? (target.stats.value.total.hp - target.currentHealth.value) / Math.max(target.stats.value.total.hp, 1) : 1
					: 1;
				const damageMultiplier = 1 + (maxMultiplier - 1) * targetMissingHpPercent;

				return {
					f2: { value: 0 },
					CalculatedDamage: {
						value: Array.isArray(damage.value)
							? [damage.value[0]! * damageMultiplier, damage.value[1]! * damageMultiplier]
							: ((damage.value as number) * damageMultiplier),
					},
				};
			},
			meta: {
				DamageAmount: {
					type: VariableType.physical,
					statIconKey: 'level',
					roundReplaced: true,
					extendedEquals: {
						prefix: '<const>',
						meleeValue: `${itemVariableValue('DamageAmount', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: { level: { value: CHAMPION_LEVEL.min }, isRanged: { value: false } } as DamageSource }).value} - ${itemVariableValue('DamageAmount', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax }, isRanged: { value: false } } as DamageSource }).value}`,
						rangedValue: `${itemVariableValue('DamageAmount', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: { level: { value: CHAMPION_LEVEL.min }, isRanged: { value: true } } as DamageSource }).value} - ${itemVariableValue('DamageAmount', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax }, isRanged: { value: true } } as DamageSource }).value}`,
						suffix: '</const>',
					},
				},
				MaximumDamage: {
					type: VariableType.physical,
					statIconKey: 'level',
					roundReplaced: true,
					extendedEquals: {
						prefix: '<const>',
						meleeValue: `${Math.round(itemVariableValue('MaximumDamage', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: { level: { value: CHAMPION_LEVEL.min }, isRanged: { value: false } } as DamageSource }).value as number)} - ${Math.round(itemVariableValue('MaximumDamage', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax }, isRanged: { value: false } } as DamageSource }).value as number)}`,
						rangedValue: `${Math.round(itemVariableValue('MaximumDamage', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: { level: { value: CHAMPION_LEVEL.min }, isRanged: { value: true } } as DamageSource }).value as number)} - ${Math.round(itemVariableValue('MaximumDamage', { item: ITEMS_BY_NAME.krakenSlayer, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax }, isRanged: { value: true } } as DamageSource }).value as number)}`,
						suffix: '</const>',
					},
				},
				CalculatedDamage: {
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
					statIconKey: 'level',
					extendedEquals: {
						prefix: '<const>',
						meleeValue: `${itemVariableValue('ShieldAmount', { item: ITEMS_BY_NAME.immortalShieldbow, damageSource: { level: { value: CHAMPION_LEVEL.min }, isRanged: { value: false } } as DamageSource }).value} - ${itemVariableValue('ShieldAmount', { item: ITEMS_BY_NAME.immortalShieldbow, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax }, isRanged: { value: false } } as DamageSource }).value}`,
						rangedValue: `${itemVariableValue('ShieldAmount', { item: ITEMS_BY_NAME.immortalShieldbow, damageSource: { level: { value: CHAMPION_LEVEL.min }, isRanged: { value: true } } as DamageSource }).value} - ${itemVariableValue('ShieldAmount', { item: ITEMS_BY_NAME.immortalShieldbow, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax }, isRanged: { value: true } } as DamageSource }).value}`,
						suffix: `</const>`,
					},
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
				const meleeHpPercent = itemVariableValue('MaxHealthDamageCalc', { item: ITEMS_BY_NAME.eclipse, damageSource: { isRanged: { value: false } } as DamageSource, isRanged: false }).value as number;
				const rangedHpPercent = itemVariableValue('MaxHealthDamageCalc', { item: ITEMS_BY_NAME.eclipse, damageSource: { isRanged: { value: true } } as DamageSource, isRanged: true }).value as number;

				return {
					f3: { value: 0 },
					lolcalcChampRange: {
						value: [
							itemVariableValue('MeleeItemCalcValue', { item: ITEMS_BY_NAME.eclipse, damageSource: self, isRanged: false }).value as number,
							itemVariableValue('RangedItemCalcValue', { item: ITEMS_BY_NAME.eclipse, damageSource: self, isRanged: true }).value as number,
						],
					},
					MaxHealthDamage: {
						value: [meleeHpPercent / 100 * (target?.stats.value.total.hp ?? 0), rangedHpPercent / 100 * (target?.stats.value.total.hp ?? 0)],
					},
				};
			},
			meta: {
				MaxHealthDamageCalc: {
					type: VariableType.physical,
					resultsIsPercentage: true,
				},
				lolcalcChampRange: {
					displayedName: 'Shield',
					type: VariableType.shield,
					statIconKey: ['attackDamage'],
					extendedEquals: {
						prefix: '',
						meleeValue: `<const>${eclipseSpecifics.meleeConst}</const> <scalead>+ ${Math.round(eclipseSpecifics.meleeAdRatio * 100)}% bonus %i:${STAT_ICON.attackDamage}%</scalead>`,
						rangedValue: `<const>${eclipseSpecifics.rangedConst}</const> <scalead>+ ${Math.round(eclipseSpecifics.rangedAdRatio * 100)}% bonus %i:${STAT_ICON.attackDamage}%</scalead>`,
						suffix: '',
					},
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
					statIconKey: 'attackDamage',
					extendedEquals: `<scalead>${Math.round((ITEMS_BY_NAME.bloodsong?.dataValues as any)[ITEMS_BY_NAME.bloodsong?.itemCalculations.SpellbladeDamage.mFormulaParts[0]!.mDataValue!] * 100)}% base</scalead> `,
				},
				lolcalcChampRange: {
					displayedName: 'DamageIncrease',
					isCustom: true,
					isPercentage: true,
					multiplier: 100,
					resultsIsPercentage: true,
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
				handler(self, { itemPassivesStats }, { calculatedVariables }) {
					if ((self.internalItemData.value as IInternalItemDataOf<'voltaicCyclosword'>).firmanent && self.isRanged.value !== undefined) {
						const value = itemVariableValue('LethalityBonusModMeleeRangedSplit', { item: ITEMS_BY_NAME.voltaicCyclosword, isRanged: self.isRanged.value });
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
		variables: defineVariables({
			known: {
				f3: [],
				f5: [],
				f6: [ITEMS_BY_NAME.solsticeSleigh?.dataValues.StealthWardCap],
			},
			calculate() {
				return {
					f3: { value: 0 },
					f5: { value: 0 },
					f6: { value: ITEMS_BY_NAME.solsticeSleigh?.dataValues.StealthWardCap },
				};
			},
			meta: {
				BonusHealthBuff: {
					type: VariableType.heal,
					statIconKey: 'level',
					extendedEquals: `<const>${itemVariableValue('BonusHealthBuff', { item: ITEMS_BY_NAME.solsticeSleigh, damageSource: { level: { value: CHAMPION_LEVEL.min } } as DamageSource }).value} - ${itemVariableValue('BonusHealthBuff', { item: ITEMS_BY_NAME.solsticeSleigh, damageSource: { level: { value: CHAMPION_LEVEL.vanillaMax } } as DamageSource }).value}</const>`,
				},
			},
			uninteresting: ['f3', 'f5', 'f6', 'StealthWardCap', 'BuffDuration', 'MoveSpeedBuff'],
		}),
	},
} satisfies IHypotheticalItemSpecifics;

// slingshot magic damage
// recurve bow physical damage
// sheen physical damage
// phage grant ms
// hextech alternator magic dmg
// crimson lucidity move speed effect
// rfc magic dmg
// kaenic rookern extended equals
// guinsoo magic dmg
// gunblade variables
// check yuntal description
// stormrazor magic dmg & move speed effect
// mercurial scimitar move speed effect
// titanic hydra variables
// bloodthirster extended equals

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
	variables?: ISpecificVariables<Exclude<DetectItemVariables<TItems[T]>, 'Cooldown'>, string, IChampionId, 'item'>;
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
		(target.champion.value && !target.isRanged.value && (RANGED_ONLY_ITEMS as string[]).includes(item.id))
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
