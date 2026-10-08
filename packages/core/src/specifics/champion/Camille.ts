import type ICamille from '@lolcalc/data/files/champion/Camille.json';
import type { IChampionSpecific } from '../champion.ts';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId.ts';
import { simpleFormattingGameAbilityImage } from '@lolcalc/core/misc.ts';
import { AbilityType, ITEM_NAME_TO_ID } from '@lolcalc/shared';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Camille', typeof ICamille, 'passive'>()({
			meta: {
				ShieldAmount: {
					additionalInfo: `value not affected by ${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.serpentsFang))} [Serpent's Fang's](https://wiki.leagueoflegends.com/en-us/Serpent%27s_Fang) Shield Reave`,
				},
			},
			uninteresting: ['ShieldDuration'],
		}),
	},
} satisfies IChampionSpecific<'Camille'>;
