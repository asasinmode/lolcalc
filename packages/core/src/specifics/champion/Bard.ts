import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IBard from '@lolcalc/data/files/champion/Bard.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMaxChimeMS(self: DamageSource<'Bard'>): number {
	return (self.champion.value! as typeof IBard).abilities.passive.variants[0]!.dataValues.MaxSpeedStacks[1]!;
}

export default {
	setupData(self) {
		const maxChimes: number = passiveMaxChimeMS(self);
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
			chimeMoveSpeed: clamp(0, Math.round(self.internalData.value.chimeMoveSpeed ?? 0), maxChimes),
		};
	},
	passive: {
		maxChimeMS: passiveMaxChimeMS,
		variables: defineChampionVariables<'Bard', typeof IBard, 'passive'>()({
			known: {
				MeepDamage: [],
				f1: [],
				f2: [],
				f4: [],
				f5: [],
			},
			calculate(self) {
				const { passiveStacks } = self.internalData.value;
				let MeepDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const baseMeepDmg = championAbilityVariableValue('MeepDamageNoChime', passiveParams);
				const checkpointDmg = championAbilityVariableValue('DamagePerCheckpoint', passiveParams);
				const chimesPerCheckpoint = championAbilityVariableValue('TooltipChimeDamageCheckpoint', passiveParams);
				if (typeof baseMeepDmg.value === 'number' && typeof checkpointDmg.value === 'number' && typeof chimesPerCheckpoint.value === 'number') {
					MeepDamage = baseMeepDmg.value + Math.floor(passiveStacks / chimesPerCheckpoint.value) * checkpointDmg.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS bard] failed to calculate chime damage vars', baseMeepDmg, checkpointDmg, chimesPerCheckpoint);
				}

				let MeepRechargeCD = 8;
				if (passiveStacks >= 70) {
					MeepRechargeCD = 4;
				} else if (passiveStacks >= 55) {
					MeepRechargeCD = 5;
				} else if (passiveStacks >= 40) {
					MeepRechargeCD = 6;
				} else if (passiveStacks >= 20) {
					MeepRechargeCD = 7;
				}

				let MeepCap = 1;
				if (passiveStacks >= 100) {
					MeepCap = 9;
				} else if (passiveStacks >= 95) {
					MeepCap = 8;
				} else if (passiveStacks >= 90) {
					MeepCap = 7;
				} else if (passiveStacks >= 80) {
					MeepCap = 6;
				} else if (passiveStacks >= 65) {
					MeepCap = 5;
				} else if (passiveStacks >= 50) {
					MeepCap = 4;
				} else if (passiveStacks >= 30) {
					MeepCap = 3;
				} else if (passiveStacks >= 10) {
					MeepCap = 2;
				}

				let SplashSlow = 0;
				if (passiveStacks >= 85) {
					SplashSlow = 75;
				} else if (passiveStacks >= 75) {
					SplashSlow = 65;
				} else if (passiveStacks >= 60) {
					SplashSlow = 55;
				} else if (passiveStacks >= 45) {
					SplashSlow = 45;
				} else if (passiveStacks >= 25) {
					SplashSlow = 35;
				} else if (passiveStacks >= 5) {
					SplashSlow = 25;
				}

				return {
					MeepDamage: {
						value: MeepDamage,
					},
					f1: {
						/* doesn't seem to be in a var */
						value: 20,
					},
					f2: {
						value: SplashSlow,
					},
					f4: {
						value: MeepCap,
					},
					f5: {
						value: MeepRechargeCD,
					},
				};
			},
			meta: {
				MeepDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
				MeepDamageNoChime: {
					type: VariableType.magic,
				},
				DamagePerCheckpoint: {
					type: VariableType.magic,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				f1: {
					displayedName: 'ChimeExperience',
					additionalInfo: 'Not accurate 100%. It starts at <const>20</const> but scales with game time',
				},
				f5: {
					displayedName: 'MeepRechargeCD',
					additionalInfo: 'Based on information from the wiki',
				},
				f4: {
					displayedName: 'MeepCap',
					additionalInfo: 'Based on information from the wiki',
				},
				f2: {
					displayedName: 'SplashSlow',
					type: VariableType.affectedBySlowResist,
					additionalInfo: 'Based on information from the wiki',
				},
			},
			uninteresting: ['TooltipMSPerStack', 'MaxSpeedStacks', 'SpeedStackDuration', 'TooltipManaRestore', 'TooltipChimeDamageCheckpoint', 'ChimesForSlowUpgrade', 'ChimesForSplashDamageUpgrade', 'ChimesForSplashAreaUpgrade', 'TooltipMSMax'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Bard', typeof IBard, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				SlowAmountPercentage: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Bard', typeof IBard, 'w'>()({
			known: {
				f1: [],
				f2: [],
			},
			calculate(self) {
				return {
					f1: { value: 0 },
					f2: championAbilityVariableValue('MaxPacks', {
						abilityKey: 'w',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						damageSource: self,
					}),
				};
			},
			meta: {
				InitialHeal: {
					type: VariableType.heal,
				},
				MaxHeal: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['f1', 'f2', 'MoveSpeed_Duration', 'ChargeupTime', 'MaxPacks', 'Ammo_Limit'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Bard', typeof IBard, 'e'>()({
			uninteresting: ['DoorDuration', 'FriendlyMovementBonusPercentage'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Bard', typeof IBard, 'r'>()({
			uninteresting: ['RStasisDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (!self.internalData.value.chimeMoveSpeed) {
					return;
				}

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
				};

				const msPerChime = championAbilityVariableValue('TooltipMSPerStack', passiveParams);
				const maxMS = championAbilityVariableValue('TooltipMSMax', passiveParams);
				const maxStacks = championAbilityVariableValue('MaxSpeedStacks', passiveParams);
				if (typeof msPerChime.value === 'number' && typeof maxMS.value === 'number' && typeof maxStacks.value === 'number') {
					const perStackAfterFirst = (maxMS.value - msPerChime.value) / (maxStacks.value - 1);
					calculatedVariables.totalBonusPercentMoveSpeed += (msPerChime.value + (self.internalData.value.chimeMoveSpeed - 1) * perStackAfterFirst) / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS bard] failed to calculate chime move speed', msPerChime, maxMS, maxStacks);
				}
			},
		},
	},
} satisfies IChampionSpecific<'Bard'>;
