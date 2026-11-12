import { CHAMPION_COMPONENTS } from '~/components/Champion/index.ts';
import type { ITutorialStepId, TutorialEvents } from '~/utils/tutorial';

// TODO simplify, maybe an array or just string/function checking if event is the wanted one would be more efficient
type ITutorialStepTriggers = {
	[K in keyof TutorialEvents]?: true | ((data: TutorialEvents[K]) => boolean);
};

export interface ITutorialStepDef {
	title: string;
	/** will be v-htmled into a `div.game-description` of TheTutorial */
	text?: string;
	/** element the tutorial should call `showPopover({ source })` with. If `undefined`, step is skipped with warning */
	anchor?: <T extends keyof TutorialEvents>(sourceIds?: ITutorialEventSourceIds, event?: T, data?: TutorialEvents[T]) => Element | undefined | null;
	/** element that receives `rotating-glow`, defaults to the anchor */
	glow?: (anchor: Element) => Element;
	/** id of an element the tutorial should move to be a child of (like when the step is inside a dialog) */
	within?: string;
	/** general steps: any of these will try to show the step when it returns `true` */
	showOn?: ITutorialStepTriggers;
	/** these mark the step `done` when any of these returns `true` */
	completeOn?: ITutorialStepTriggers;
}

export const tutorialSteps: Record<ITutorialStepId, ITutorialStepDef> = {
	greeting: {
		title: 'welcome',
	},
	openChampSelect: {
		title: 'select a champion',
		text: 'open champ select by clicking on the portrait',
		// TODO should also handle small screen switching between sources/targets & mirror layout
		anchor: () => document.querySelector('.select-champion'),
		completeOn: {
			champSelectOpened: true,
			champSelectClosed: true,
		},
	},
	changeChampionLevel: {
		title: 'champion level',
		text: 'can be changed by clicking the number next to their portrait',
		// TODO should do it in last interacted with damage source
		anchor: () => document.querySelector('.select-champion-level'),
		completeOn: {
			sourceLevelSelectFocused: true,
		},
	},
	openItemShop: {
		title: 'items',
		text: 'to buy items, open the item shop with the "items" button or by clicking on the inventory next to it',
		// TODO should do it in last interacted with damage source
		anchor: () => document.querySelector('.select-items'),
		completeOn: {
			itemShopOpened: true,
		},
	},
	itemShopFunctionality: {
		title: 'item shop',
		text: "functions the same way the game's does. Right or double click/tap to buy items, right click in the inventory panel to sell",
		within: 'dialog-item-shop',
		showOn: {
			itemShopOpened: true,
		},
		completeOn: {
			itemShopClosed: true,
		},
	},
	viewExtraComponent: {
		title: 'configuring passives',
		text: 'some champions, items or effects are configurable through elements that will be shown below the general configuration',
		// TODO should do it in last interacted with damage source
		anchor: () => document.querySelector('.extras')?.firstElementChild,
		showOn: {
			damageSourceExpanded(championId) {
				return championId ? championId in CHAMPION_COMPONENTS : false;
			},
			champSelectClosed(championId) {
				return championId ? championId in CHAMPION_COMPONENTS : false;
			},
		},
		completeOn: {
			extraComponentInteracted: true,
		},
	},
};
