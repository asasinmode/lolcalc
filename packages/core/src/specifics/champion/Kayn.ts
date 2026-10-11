import type IKayn from '@lolcalc/data/files/champion/Kayn.json';
import { formatImagePath } from '@lolcalc/data/meta.ts';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionAbilitySpecific, IChampionSpecific } from '../champion.ts';
import type { IAbilityImgIndexGetter } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const passiveFormOptions = {
	base: 0,
	assassin: 1,
	rhaast: 2,
};

const modifyVariantImages: IChampionAbilitySpecific['modifyVariantData'] = (abillityVariant, _binData, variantData) => {
	if (variantData.mSpell?.mImgIconName) {
		abillityVariant.image = variantData.mSpell.mImgIconName.map(formatImagePath);
	}
};

const abilityImgVariantIndex: IAbilityImgIndexGetter<number, 'Kayn'> = [(self) => self.internalData.value.form, (form) => form];

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
		modifyVariantData: modifyVariantImages,
		formOptions: passiveFormOptions,
		abilityImgVariantIndex,
		variables: defineChampionVariables<'Kayn', typeof IKayn, 'passive'>()({
			uninteresting: ['PassiveSecondFormDelayTooltip', 'PAmpDurationAss', 'PAmpCooldownAss'],
		}),
	},
	q: {
		modifyVariantData: modifyVariantImages,
		abilityImgVariantIndex,
	},
	w: {
		/* the assassin variant image path is in a separate ability */
		modifyVariantData(abilityVariant, binData, variantData) {
			const assassinWVariantData = Object.values(binData).find((data: any) => data.ObjectName === 'KaynAssW') as any;
			const assassinImages = assassinWVariantData?.mSpell?.mImgIconName;
			const baseImages = variantData?.mSpell?.mImgIconName;
			if (assassinImages?.length && baseImages.length) {
				abilityVariant.image = [baseImages[0], assassinImages[1], baseImages[1]].map(formatImagePath);
			} else {
				console.warn('[CHAMPION_SPECIFICS kayn] failed find W assassin variant');
			}
		},
		abilityImgVariantIndex,
	},
	e: {
		modifyVariantData: modifyVariantImages,
		abilityImgVariantIndex,
	},
	r: {
		/* variants aren't in the same order form/other abilities are, reorder */
		modifyVariantData(abilityVariant, binData, variantData) {
			modifyVariantImages(abilityVariant, binData, variantData);
			abilityVariant.image = [abilityVariant.image[1]!, abilityVariant.image[0]!, abilityVariant.image[2]!];
		},
		abilityImgVariantIndex,
	},
} satisfies IChampionSpecific<'Kayn'>;
