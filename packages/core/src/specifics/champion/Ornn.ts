import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IOrnn from '@lolcalc/data/files/champion/Ornn.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { clamp } from '@lolcalc/shared/utils.ts';
import { watch } from 'vue';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMasterworkLevel(self: DamageSource<'Ornn'>): number {
	return (self.champion.value! as typeof IOrnn).abilities.passive.variants[0]!.dataValues.MasterworkLevel[1]!;
}

const passiveMaxUpgradedAllies = 4;

function passiveCalculateMaxUpgradedAllies(self: DamageSource<'Ornn'>): number {
	return Math.min(passiveMaxUpgradedAllies, Math.max(0, self.level.value - passiveMasterworkLevel(self)));
}

export default {
	setupData(self) {
		const _masterworkLevel = passiveMasterworkLevel(self);
		return {
			masterworkItemSlot: self.level.value >= _masterworkLevel
				? clamp(-1, Math.round(self.internalData.value.masterworkItemSlot ?? 1), 6)
				: 1,
			passiveUpgradedAllies: clamp(0, Math.round(self.internalData.value.passiveUpgradedAllies ?? 0), passiveCalculateMaxUpgradedAllies(self)),
			_masterworkLevel,
			_watchHandles: [watch(self.level, () => {
				self.internalData.value.passiveUpgradedAllies = Math.min(self.internalData.value.passiveUpgradedAllies, passiveCalculateMaxUpgradedAllies(self));
			})],
		};
	},
	passive: {
		masterworkLevel: passiveMasterworkLevel,
		calculateMaxUpgradedAllies: passiveCalculateMaxUpgradedAllies,
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
							+ (~self.internalData.value.masterworkItemSlot && (self.level.value >= passiveMasterworkLevel(self)) ? 1 : 0));
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
} satisfies IChampionSpecific<'Ornn'>;
