import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IBard from '@lolcalc/data/files/champion/Bard.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
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
				let MeepDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self };
				const baseMeepDmg = championAbilityVariableValue('MeepDamageNoChime', passiveParams);
				const checkpointDmg = championAbilityVariableValue('DamagePerCheckpoint', passiveParams);
				const chimesPerCheckpoint = championAbilityVariableValue('TooltipChimeDamageCheckpoint', passiveParams);
				if (typeof baseMeepDmg.value === 'number' && typeof checkpointDmg.value === 'number' && typeof chimesPerCheckpoint.value === 'number') {
					MeepDamage = baseMeepDmg.value + Math.floor(self.internalData.value.passiveStacks / chimesPerCheckpoint.value) * checkpointDmg.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS bard] failed to calculate chime damage vars', baseMeepDmg, checkpointDmg, chimesPerCheckpoint);
				}

				return {
					MeepDamage: {
						value: MeepDamage,
					},
					f1: {
						value: 0,
					},
					f2: {
						value: 0,
					},
					f4: {
						value: 0,
					},
					f5: {
						value: 0,
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
					f2: championAbilityVariableValue('MaxPacks', { abilityKey: 'w', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, damageSource: self }),
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
} satisfies IChampionSpecific<'Bard'>;
