import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IAurelionSol from '@lolcalc/data/files/champion/AurelionSol.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
	passive: {
		variables: defineChampionVariables<'AurelionSol', typeof IAurelionSol, 'passive'>()({
			known: {
				'{c9372c6b}': [],
				f1: [],
				'f2.1': [],
				'f3.1': [],
				'f4.1': [],
				QDamage: [],
			},
			calculate(self, target) {
				const { passiveStacks } = self.internalData.value;
				let QDamage = Number.NaN;
				let WDistanceIncrease = Number.NaN;
				// TODO figure areas out
				let EAreaIncrease = Number.NaN;
				// const RAreaIncrease = Number.NaN;

				const percent = championAbilityVariableValue('QPassiveScaling', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					dynamicVariables: { values: { '{c9372c6b}': { value: passiveStacks } } },
				});
				if (typeof percent.value === 'number') {
					QDamage = percent.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS aurelion sol] failed to calculate pasive q dmg percent', percent);
				}

				const wDistancePerStack = championAbilityVariableValue('DistancePerMass', {
					abilityKey: 'w',
					abilityVariant: self.champion.value!.abilities.w.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				});
				if (typeof wDistancePerStack.value === 'number') {
					// TODO take from castRange or
					// 			"castRangeValues": {
					// 	"values": [1500, 1500, 1500, 1500, 1500, 1500, 1500],
					// 	"{0a3e0478}": 1500,
					// 	"__type": "{0a0eddc9}"
					// },
					WDistanceIncrease = (wDistancePerStack.value * passiveStacks) / 15;
				} else {
					console.warn('[CHAMPION_SPECIFICS aurelion sol] failed to calculate w distance per stack', wDistancePerStack);
				}

				const outerRadiusAreaPerStack = championAbilityVariableValue('OuterRadiusAreaPerStack', {
					abilityKey: 'e',
					abilityVariant: self.champion.value!.abilities.e.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				});

				const startingRadius = championAbilityVariableValue('StartingRadius', {
					abilityKey: 'e',
					abilityVariant: self.champion.value!.abilities.e.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
				});

				if (typeof outerRadiusAreaPerStack.value === 'number' && typeof startingRadius.value === 'number') {
					const baseRadius = startingRadius.value;
					const areaPerStack = outerRadiusAreaPerStack.value;

					const newRadius = Math.sqrt(baseRadius ** 2 + (areaPerStack * passiveStacks) / Math.PI);
					EAreaIncrease = ((newRadius - baseRadius) / baseRadius) * 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS aurelion sol] failed to calculate e area increase', outerRadiusAreaPerStack, startingRadius);
				}

				return {
					'{c9372c6b}': {
						value: passiveStacks,
					},
					QDamage: {
						value: QDamage,
					},
					f1: {
						value: passiveStacks,
					},
					'f2.1': {
						value: WDistanceIncrease,
					},
					'f3.1': {
						value: EAreaIncrease,
					},
					'f4.1': {
						value: EAreaIncrease,
					},
				};
			},
			meta: {
				QDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				f1: {
					displayedName: 'Stardust',
				},
				'f2.1': {
					displayedName: 'WDistanceIncrease',
					roundReplaced: 1,
				},
				'f3.1': {
					displayedName: 'EAreaIncrease',
					roundReplaced: 1,
					additionalInfo: "This value is wrong. While it is the one the game data and the wiki, as of patch 26.19, point to, the game shows a different one. Can't figure it out at the moment.",
				},
				'f4.1': {
					displayedName: 'RAreaIncrease',
					roundReplaced: 1,
					additionalInfo: "This value is wrong. While it is the one the game data and the wiki, as of patch 26.19, point to, the game shows a different one. Can't figure it out at the moment.",
				},
			},
			uninteresting: [],
		}),
	},
	r: {
		variables: defineChampionVariables<'AurelionSol', typeof IAurelionSol, 'r'>()({
			known: {
				f1: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
				};
			},
		}),
	},
} satisfies IChampionSpecific<'AurelionSol'>;
