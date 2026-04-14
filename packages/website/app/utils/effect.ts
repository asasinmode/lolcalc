import { GameAbilityId } from './GameAbilityId.ts';
import { ABILITY_TYPE, EFFECT_NAME_TO_OBJECTNAME, ITEM_NAME_TO_ID } from './meta.ts';

export const EFFECT_SPECIFICS = {
	[EFFECT_NAME_TO_OBJECTNAME.amumuPCursedTouch]: {
		gameAbilityId: GameAbilityId.build(ABILITY_TYPE.champion, 'effects', 'Amumu', 'passive', 0),
	},
	[EFFECT_NAME_TO_OBJECTNAME.blackCleaverCarve]: {
		gameAbilityId: GameAbilityId.build(ABILITY_TYPE.item, 'effects', ITEM_NAME_TO_ID.blackCleaver),
	},
} satisfies Record<string, IEffectSpecific>;

export const TEffectSpecifics = typeof EFFECT_SPECIFICS;

export interface IEffectSpecific {
	gameAbilityId: GameAbilityId;
}
