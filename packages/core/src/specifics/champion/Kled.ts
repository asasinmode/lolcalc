import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IKled from '@lolcalc/data/files/champion/Kled.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import { watch } from 'vue';

import type { IChampionSpecific } from '../champion.ts';
import type { IExtraInactiveFn } from '../index.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		const initSkaarlMaxHP = self.stats.value.bonus.hp + (self.stats.value.variables.kledSkaarlHP ?? 0);
		return {
			kledCurrentHP: clamp(0, Math.round(self.internalData.value.kledCurrentHP ?? self.stats.value.baseOnLevel.hp), self.stats.value.baseOnLevel.hp),
			skaarlCurrentHP: clamp(0, Math.round(self.internalData.value.skaarlCurrentHP ?? initSkaarlMaxHP), initSkaarlMaxHP),
			runningTowardsEnemy: clamp(0, Math.round(self.internalData.value.runningTowardsEnemy ?? 0), 1),
			enemiesNearby: Math.max(0, Math.round(self.internalData.value.enemiesNearby ?? 0)),
			_watchHandles: [
				watch(
					() => self.internalData.value.kledCurrentHP + self.internalData.value.skaarlCurrentHP,
					(value) => {
						self.currentHealth.value = Math.min(value, self.stats.value.total.hp);
					},
				),
				watch(
					() => `${Math.ceil(self.stats.value.baseOnLevel.hp)}:${Math.floor((self.stats.value.variables.kledSkaarlHP ?? 0) + self.stats.value.bonus.hp)}:${self.maxHealth.value}`,
					(_value, previousValue) => {
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
					},
				),
				watch(
					() => self.stats.value.variables.kledIsDismounted,
					(value) => {
						self.abilityVariantsIndexes.value.q = value ? 1 : 0;
					},
					{ immediate: true },
				),
			],
		};
	},
	dismountedComponentsInactive: ((self) => !self.stats.value.variables.kledIsDismounted) satisfies IExtraInactiveFn,
	passive: {
		variables: defineChampionVariables<'Kled', typeof IKled, 'passive'>()({
			uninteresting: ['ResistBonusPerEnemy', 'CourageVsChamps', 'CourageVsOther', 'CourageLastHit', 'MountCooldown'],
		}),
	},
	q: {
		additionalVariantsObjectNames: ['KledRiderQ'],
	},
	e: {
		isDisabled: (self) => self.stats.value.variables.kledIsDismounted,
	},
	r: {
		isDisabled: (self) => self.stats.value.variables.kledIsDismounted,
	},
	calculateHooks: {
		postInit: {
			handler(self, { baseStats, championPassiveStats }, { calculatedVariables }) {
				calculatedVariables.kledIsDismounted = self.internalData.value.skaarlCurrentHP === 0;

				if (!calculatedVariables.kledIsDismounted) {
					return;
				}
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

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
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: {
						level: { value: self.level.value },
						stats: { value: { bonus: { hp: bonusStats.hp } } },
					} as DamageSource,
				};

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
} satisfies IChampionSpecific<'Kled'>;
