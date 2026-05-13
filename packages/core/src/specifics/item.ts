import type { TItems } from '@lolcalc/data';
import type { IItem, IShopItem } from '@lolcalc/data/types';
import type { IInternalItemDataOf, ISpecificVariables } from '.';
import type { DamageSource, ICalculateChampionStatsHookSource, IProviderGroupImageText, IProviderGroupInternalItemData } from '../DamageSource';
import { ITEMS, ITEMS_BY_NAME } from '@lolcalc/data';
import { ITEM_NAME_TO_ID, RANGED_ONLY_ITEMS, SUPPORT_ITEMS, UNTRANSFORMED_TEAR_ITEM_IDS, VARIABLE_TYPE } from '@lolcalc/shared';
import { clamp, roundVariable } from '@lolcalc/shared/utils.ts';
import { defineVariables } from './index.ts';

const tearItemSpecifics = {
	MAX_STACKS: ITEMS_BY_NAME.tear.dataValues.MaxMana,
	internalDataProperties: ['manaflow'],
	setupData(self: DamageSource) {
		self.internalItemData.value.manaflow = clamp(0, self.internalItemData.value.manaflow ?? 0, tearItemSpecifics.MAX_STACKS);
		return { manaflow: 0 };
	},
	imgTextLabel: 'Manaflow stacks',
	imgText(self) {
		return (self.internalItemData.value as { manaflow: number }).manaflow;
	},
} satisfies IItemSpecific;

const tearItemCalculateHookPreItemTotal = {
	handler(self, { itemBaseStats, itemPassivesStats, itemStatIncreases }, { miscDebug }) {
		const { manaflow } = self.internalItemData.value as IInternalItemDataOf<'tear'>;
		itemPassivesStats.mana += manaflow ?? 0;
		miscDebug.tearItemBonusMana = itemBaseStats.mana + manaflow;

		const tearItemId = self.items.value.find(item => item && (UNTRANSFORMED_TEAR_ITEM_IDS as string[]).includes(item.id))?.id;
		if (tearItemId) {
			itemStatIncreases[tearItemId] ??= {};
			itemStatIncreases[tearItemId]!.FlatMPPoolMod = manaflow;
		}
	},
} satisfies ICalculateChampionStatsHookSource['preItemTotal'];

const gluttonousGreavesSpecific = {
	MAX_STACKS: ITEMS_BY_NAME.gluttonousGreaves.dataValues.MaxStacks,
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
			handler(self, { itemPassivesStats, itemStatIncreases }) {
				const { slay } = self.internalItemData.value as IInternalItemDataOf<'gluttonousGreaves'>;
				itemPassivesStats.omnivamp += (slay ?? 0) / 100;

				const bootsId = self.items.value.find(item => item && (item.id === ITEM_NAME_TO_ID.gluttonousGreaves || item.id === ITEM_NAME_TO_ID.immortalPath))?.id;
				if (bootsId) {
					itemStatIncreases[bootsId] ??= {};
					itemStatIncreases[bootsId]!.PercentOmnivampMod = slay;
				}
			},
		},
	},
} satisfies IItemSpecific;

/** specific items' helpers, utils and calculations */
export const ITEM_SPECIFICS = {
	[ITEM_NAME_TO_ID.hubris]: {
		calculateBonusAd: (self: DamageSource): number => {
			const { eminence } = self.internalItemData.value;
			if (eminence) {
				return ITEMS_BY_NAME.hubris.dataValues.BaseADBonus + eminence * ITEMS_BY_NAME.hubris.dataValues.ADPerStatue;
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
		MAX_STACKS: ITEMS_BY_NAME.darkSeal.dataValues.MaxGloryStacks,
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
					itemPassivesStats.abilityPower += self.internalItemData.value.glory * ITEMS_BY_NAME.darkSeal.dataValues.APPerGlory;
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.mejai]: {
		MAX_STACKS: ITEMS_BY_NAME.mejai.dataValues.MaxGloryStacks,
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
				handler(self, { itemPassivesStats, baseWithFlatItemMoveSpeed }) {
					const { glory } = self.internalItemData.value as IInternalItemDataOf<'mejai'>;
					itemPassivesStats.abilityPower += glory * ITEMS_BY_NAME.mejai.dataValues.APPerGlory;
					if (glory >= ITEMS_BY_NAME.mejai.dataValues.GloryThreshold) {
						const bonusMs = baseWithFlatItemMoveSpeed * ITEMS_BY_NAME.mejai.dataValues.MoveSpeedMod;
						itemPassivesStats.moveSpeed += bonusMs;
					}
				},
			},
		},
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		MAX_STACKS: ITEMS_BY_NAME.hauntingGuise.dataValues.SecondsInCombat,
		internalDataProperties: ['madness'],
		setupData(self) {
			self.internalItemData.value.madness = clamp(0, self.internalItemData.value.madness ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.hauntingGuise].MAX_STACKS);
			return { madness: 0 };
		},
		imgTextLabel: 'Madness bonus damage',
		imgText(self) {
			const { madness } = self.internalItemData.value as { madness: number };
			return madness && `${Math.round(madness * ITEMS_BY_NAME.hauntingGuise.dataValues.DamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.roa]: {
		MAX_STACKS: ITEMS_BY_NAME.roa.dataValues.MaxStacks,
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
				handler(self, { itemPassivesStats }) {
					const { eternity } = self.internalItemData.value;
					const { APPerStack, HealthPerStack, ManaPerStack } = ITEMS_BY_NAME.roa.dataValues;
					itemPassivesStats.abilityPower += eternity * APPerStack;
					itemPassivesStats.hp += eternity * HealthPerStack;
					itemPassivesStats.mana += eternity * ManaPerStack;
				},
			},
		},
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
			return bBlaze && `${Math.round(bBlaze * ITEMS_BY_NAME.blackfireTorch.dataValues.APPerStack * 100)}%`;
		},
		calculateHooks: {
			preBonus: {
				handler(self, { itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
					const value = calculatedVariables.apMultipliersBase * self.internalItemData.value.bBlaze * ITEMS_BY_NAME.blackfireTorch.dataValues.APPerStack;
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
		}),
	},
	[ITEM_NAME_TO_ID.liandry]: {
		MAX_STACKS: ITEMS_BY_NAME.liandry.dataValues.MaxStackNumber,
		internalDataProperties: ['madness'],
		setupData(self) {
			self.internalItemData.value.madness = clamp(0, self.internalItemData.value.madness ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.liandry].MAX_STACKS);
			return { madness: 0 };
		},
		imgTextLabel: 'Madness bonus damage',
		imgText(self) {
			const { madness } = self.internalItemData.value as { madness: number };
			return madness && `${Math.round(madness * ITEMS_BY_NAME.liandry.dataValues.DamageIncreasePerSecond * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		MAX_STACKS: ITEMS_BY_NAME.yunTal.dataValues.CritMax,
		internalDataProperties: ['practice'],
		setupData(self) {
			self.internalItemData.value.practice = clamp(0, self.internalItemData.value.practice ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].MAX_STACKS);
			return { practice: 0 };
		},
		imgTextLabel: 'Practice Makes Lethal critical strike chance',
		imgText(self) {
			const { practice } = self.internalItemData.value as { practice: number };
			return practice && `${practice}%`;
		},
	},
	[ITEM_NAME_TO_ID.shojin]: {
		MAX_STACKS: ITEMS_BY_NAME.shojin.dataValues.StackCount,
		internalDataProperties: ['fWill'],
		setupData(self) {
			self.internalItemData.value.fWill = clamp(0, self.internalItemData.value.fWill ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.shojin].MAX_STACKS);
			return { fWill: 0 };
		},
		imgTextLabel: 'Focused Will ability damage increase',
		imgText(self) {
			const { fWill } = self.internalItemData.value as { fWill: number };
			return fWill && `${Math.round(fWill * ITEMS_BY_NAME.shojin.dataValues.SpellDamageIncrease * 100)}%`;
		},
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		MAX_STACKS: ITEMS_BY_NAME.riftmaker.dataValues.SecondsInCombat,
		internalDataProperties: ['corruption'],
		setupData(self) {
			self.internalItemData.value.corruption = clamp(0, self.internalItemData.value.corruption ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.riftmaker].MAX_STACKS);
			return { corruption: 0 };
		},
		imgTextLabel: 'Corruption bonus damage',
		imgText(self) {
			const { corruption } = self.internalItemData.value as { corruption: number };
			return corruption && `${Math.round(corruption * ITEMS_BY_NAME.riftmaker.dataValues.EternityDamageIncreasePerSecond * 100)}%`;
		},
		calculateHooks: {
			preItemTotal: {
				handler(self, { itemBaseStats, itemPassivesStats }, { calculatedVariables, miscDebug }) {
					const { corruption } = self.internalItemData.value as IInternalItemDataOf<'riftmaker'>;
					const abilityPower = itemBaseStats.hp * ITEMS_BY_NAME.riftmaker.dataValues.HealthToAPConversionPercent;
					itemPassivesStats.abilityPower += abilityPower;
					calculatedVariables.riftmakerVoidInfusion = abilityPower;
					miscDebug.riftmakerBonusHp = itemBaseStats.hp;

					if (corruption === ITEM_SPECIFICS[ITEM_NAME_TO_ID.riftmaker].MAX_STACKS) {
						const { VampAmountRanged, VampAmountMelee } = ITEMS_BY_NAME.riftmaker.dataValues;
						const omnivamp = self.isRanged.value ? VampAmountRanged : VampAmountMelee;
						itemPassivesStats.omnivamp += omnivamp;
					}
				},
			},
			preBonus: {
				handler(_self, { runeShardStats, itemPassivesStats, itemTotalStats }, { calculatedVariables, miscDebug }) {
					if (runeShardStats.hp) {
						const value = runeShardStats.hp * ITEMS_BY_NAME.riftmaker.dataValues.HealthToAPConversionPercent;
						itemPassivesStats.abilityPower += value;
						itemTotalStats.abilityPower += value;

						calculatedVariables.riftmakerVoidInfusion! += value;
						calculatedVariables.apMultipliersBase += value;
						miscDebug.riftmakerBonusHp! += runeShardStats.hp;
					}
				},
			},
		},
		variables: defineVariables({
			known: {
				f1: [],
				lolcalcChampRange: [],
			},
			calculate(self) {
				const { VampAmountRanged, VampAmountMelee } = ITEMS_BY_NAME.riftmaker.dataValues;

				return {
					/** ap gained from passive */
					f1: {
						value: self.stats.value.variables.riftmakerVoidInfusion!,
					},
					lolcalcChampRange: {
						value: self.champion.value
							? self.isRanged.value ? VampAmountRanged : VampAmountMelee
							: [VampAmountMelee, VampAmountRanged],
					},
				};
			},
			meta: {
				lolcalcChampRange: {
					multiplier: 100,
					isPercentage: true,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.tear]: {
		...tearItemSpecifics,
		calculateHooks: {
			preItemTotal: tearItemCalculateHookPreItemTotal,
		},
	},
	[ITEM_NAME_TO_ID.whisperingCirclet]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.archangelsStaff]: {
		...tearItemSpecifics,
		calculateHooks: {
			preItemTotal: tearItemCalculateHookPreItemTotal,
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
					const bonusAP = itemTotalStats.mana * ITEMS_BY_NAME.archangelsStaff.dataValues.APFromMana;
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
						value: self.stats.value.variables.archangelSeraphAwe!,
					},
				};
			},
		}),
	},
	[ITEM_NAME_TO_ID.seraphsEmbrace]: {
		calculateHooks: {
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
					const bonusAP = itemTotalStats.mana * ITEMS_BY_NAME.seraphsEmbrace.dataValues.APFromMana;
					calculatedVariables.apMultipliersBase += bonusAP;
					itemPassivesStats.abilityPower += bonusAP;
					itemTotalStats.abilityPower += bonusAP;
					calculatedVariables.archangelSeraphAwe = bonusAP;
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
						value: self.stats.value.variables.archangelSeraphAwe!,
					},
					ShieldValue: {
						value: self.stats.value.total.mana * ITEMS_BY_NAME.seraphsEmbrace.itemCalculations.ShieldValue.mFormulaParts[0]!.mCoefficient,
					},
				};
			},
			meta: {
				BonusAPCalc: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEMS_BY_NAME.seraphsEmbrace.dataValues.APFromMana * 100)}% bonus</scalemana>`,
				},
				ShieldValue: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEMS_BY_NAME.seraphsEmbrace.itemCalculations.ShieldValue.mFormulaParts[0]!.mCoefficient * 100)}%</scalemana>`,
					type: VARIABLE_TYPE.shield,
				},
			},
			uninteresting: ['f5', 'ShieldDuration', 'HealthThreshold'],
		}),
	},
	[ITEM_NAME_TO_ID.manamune]: {
		...tearItemSpecifics,
		ADFromMana: ITEMS_BY_NAME.manamune.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient,
		calculateHooks: {
			preItemTotal: tearItemCalculateHookPreItemTotal,
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats, baseOnLevelStats }, { calculatedVariables }) {
					const bonusAD = (itemTotalStats.mana + baseOnLevelStats.mana) * ITEM_SPECIFICS[ITEM_NAME_TO_ID.manamune].ADFromMana;
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
						value: self.stats.value.variables.manaMuraAwe!,
					},
				};
			},
			meta: {
				BonusADFromMana: {
					statIconKey: 'mana',
					extendedEquals: `<scalemana>${Math.round(ITEMS_BY_NAME.manamune.itemCalculations.BonusADFromMana.mFormulaParts[0]!.mCoefficient * 100)}%</scalemana>`,
				},
			},
		}),
	},
	[ITEM_NAME_TO_ID.wintersApproach]: tearItemSpecifics,
	[ITEM_NAME_TO_ID.trinity]: {
		internalDataProperties: ['quicken'],
		setupData(self) {
			self.internalItemData.value.quicken = clamp(0, self.internalItemData.value.quicken ?? 0, 1);
			return { quicken: 0 };
		},
		imgActive(internalData: { quicken: number }) {
			return internalData.quicken;
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
		internalDataProperties: ['mBlessing'],
		setupData(self) {
			self.internalItemData.value.mBlessing = clamp(0, self.internalItemData.value.mBlessing ?? 0, 1);
			return { mBlessing: 0 };
		},
		imgActive(internalData: { mBlessing: number }) {
			return internalData.mBlessing;
		},
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
	[ITEM_NAME_TO_ID.ardentCensor]: {
		internalDataProperties: ['sanctify'],
		setupData(self) {
			self.internalItemData.value.sanctify = clamp(0, self.internalItemData.value.sanctify ?? 0, 1);
			return { sanctify: 0 };
		},
		imgActive(internalData: { sanctify: number }) {
			return internalData.sanctify;
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
	},
	[ITEM_NAME_TO_ID.hexoptics]: {
		MAX_STACKS: ITEMS_BY_NAME.hexoptics.dataValues.MaxRange,
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
		MAX_STACKS: ITEMS_BY_NAME.deadMansPlate.dataValues.MaxMovementSpeed,
		internalDataProperties: ['shipwrecker'],
		setupData(self) {
			self.internalItemData.value.shipwrecker = clamp(0, self.internalItemData.value.shipwrecker ?? 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.deadMansPlate].MAX_STACKS);
			return { shipwrecker: 0 };
		},
		imgTextLabel: 'Shipwrecker built up movement speed',
		imgText(self) {
			return (self.internalItemData.value as { shipwrecker: number }).shipwrecker;
		},
	},
	[ITEM_NAME_TO_ID.bloodlettersCurse]: {
		MAX_STACKS: ITEMS_BY_NAME.bloodlettersCurse.dataValues.MaxStacks,
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
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		MAX_STACKS: ITEMS_BY_NAME.guinsoo.dataValues.MaxStacks,
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
					const bonusAttackSpeedPercent = seething * ITEMS_BY_NAME.guinsoo.dataValues.AttackSpeedPerStack;
					itemPassivesStats.bonusAttackSpeedPercent += bonusAttackSpeedPercent;
					itemPassivesStats.attackSpeed += bonusAttackSpeedPercent * baseStats.attackSpeedRatio;
				},
				priority: 10,
			},
		},
	},
	[ITEM_NAME_TO_ID.terminus]: {
		MAX_STACKS: Math.round(ITEMS_BY_NAME.terminus.dataValues.PenPerHit / ITEMS_BY_NAME.terminus.dataValues.PenMax),
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
	[ITEM_NAME_TO_ID.immortalPath]: gluttonousGreavesSpecific,
	[ITEM_NAME_TO_ID.rabadon]: {
		calculateHooks: {
			preBonus: {
				handler(_self, { itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
					const value = calculatedVariables.apMultipliersBase * ITEMS_BY_NAME.rabadon.dataValues.APAmp;
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
						value: self.stats.value.variables.rabadonMagicalOpus!,
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
	variables?: ISpecificVariables<Exclude<DetectItemVariables<TItems[T]>, 'Cooldown'>, string>;
	[key: string]: any;
};

/** creates a union of all variable properties detected on an item */
type DetectItemVariables<T>
	= | (T extends { dataValues: object } ? keyof T['dataValues'] : never)
		| (T extends { stringCalculations: object } ? keyof T['stringCalculations'] : never)
		| (T extends { itemCalculations: object } ? keyof T['itemCalculations'] : never)
		| (T extends { effectAmount: any[] } ? `Effect${number}Amount` : never);

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
		|| (target?.roleQuest.value && target.roleQuest.value !== 'support' && SUPPORT_ITEMS.includes(item.id))
	) {
		buyability = -1;
	} else if (!isMove && inventoryAfterBuying.slice(0, 6).filter(Boolean).length > 5 && (target.roleQuest.value !== 'bot' || inventoryAfterBuying[6])) {
		buyability = 0;
	}

	return buyability;
}
