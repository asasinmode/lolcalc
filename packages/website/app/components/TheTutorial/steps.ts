import type { ITutorialStepId, TutorialEvents } from '~/utils/tutorial';

export interface ITutorialContext {
	state: ReturnType<typeof useCalculatorState>;
}

// TODO simplify, maybe an array or just string/function checking if event is the wanted one would be more efficient
type ITutorialStepTriggers = {
	[K in keyof TutorialEvents]?: true | ((data: TutorialEvents[K]) => boolean);
};

export interface ITutorialStepDef {
	title: string;
	/** will be v-htmled into a `div.game-description` of TheTutorial */
	text?: string;
	/** element the tutorial should call `showPopover({ source })` with. If `undefined`, step is skipped with warning */
	anchor?: <T extends keyof TutorialEvents>(event: T, data: TutorialEvents[T], ctx: ITutorialContext) => Element | undefined | null;
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
		title: 'first time?',
	},
	openChampSelect: {
		title: 'select a champion',
		text: 'To start with, open champ select and choose a champion',
		// TODO should also handle small screen switching between sources/targets & mirror layout
		anchor: () => document.querySelector('.select-champion'),
		completeOn: {
			champSelectClosed: true,
		},
	},
	changeChampionLevel: {
		title: 'champion level',
		text: "Champion's level can be changed here",
		// TODO should do it in last interacted with damage source
		anchor: () => document.querySelector('.select-champion-level'),
		completeOn: {
			sourceLevelSelectFocused: true,
		},
	},
	openItemShop: {
		title: 'items',
		text: 'To buy items, open the item shop',
		// TODO should do it in last interacted with damage source
		anchor: () => document.querySelector('.select-items'),
		completeOn: {
			itemShopOpened: true,
		},
	},
	itemShopFunctionality: {
		title: 'item shop',
		text: "The item shop functions the same way the game's does. Right or double click/tap to buy items, right click in the to sell. ",
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
		text: 'Some champions, items or effects are configurable through elements that will be shown here when applicable',
		// TODO should do it in last interacted with damage source
		anchor: () => document.querySelector('.extras'),
		showOn: {
			champSelectClosed(championId) {
				console.log('TODO check if has extra', championId);
				return false;
			},
		},
		completeOn: {
			extraComponentInteracted: true,
		},
	},
};
