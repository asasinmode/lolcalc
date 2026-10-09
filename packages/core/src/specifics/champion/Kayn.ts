import type IKayn from '@lolcalc/data/files/champion/Kayn.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

const passiveFormOptions = {
	base: 0,
	assassin: 1,
	rhaast: 2,
};

export default {
	setupData(self) {
		return {
			form: clamp(0, Math.round(self.internalData.value.form ?? 0), passiveFormOptions.rhaast),
		};
	},
	variables: defineChampionVariables<'Kayn', typeof IKayn>()({
		known: {
			f1: [0, 1, 2],
		},
		calculate(self) {
			return {
				f1: {
					value: self.internalData.value.form,
				},
			};
		},
	}),
	passive: {
		formOptions: passiveFormOptions,
		variables: defineChampionVariables<'Kayn', typeof IKayn, 'passive'>()({
			uninteresting: ['PassiveSecondFormDelayTooltip', 'PAmpDurationAss', 'PAmpCooldownAss'],
		}),
	},
} satisfies IChampionSpecific<'Kayn'>;
