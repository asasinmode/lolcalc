import { CHAMPION_COMPONENTS } from '~/components/Champion/index.ts';
import type { ITutorialStepId, TutorialEvents } from '~/utils/tutorial';

type ITutorialStepTriggers = {
	[K in ITutorialEvent]?: true | ((data: TutorialEvents[K]) => boolean);
};

export interface ITutorialStepDef {
	title: string;
	/** used for selecting el.querySelector targets, as well as updating the popup's position when a destructive event happens to something the type is associated with (like damage source moved = need to reposition tutorial) */
	type: 'global' | 'damageSource' | 'resultColumn' | 'resultSection';
	/** will be v-htmled into a `div.game-description` of TheTutorial */
	text?: string;
	/**
	 * element the tutorial should call `showPopover({ source })` with. If tuple, will run the selector then refine function on each of its results, until it finds one that's `checkVisibility()`
	 * !IMPORTANT elements shouldn't have style attribute, it's used for anchor management
	 */
	anchor?: string | [query: string, refine: (element: HTMLElement) => HTMLElement | undefined | null];
	/** id of an element the tutorial should move to be a child of (like when the step is inside a dialog) */
	within?: string;
	/** general steps: any of these will try to show the step when it returns `true` */
	showOn?: ITutorialStepTriggers;
	/** these mark the step `done` when any of these returns `true` */
	completeOn?: ITutorialEvent[];
}

export const tutorialSteps: Record<ITutorialStepId, ITutorialStepDef> = {
	greeting: {
		title: 'welcome',
		type: 'global',
	},
	beforeYouStart: {
		title: 'before you start',
		type: 'global',
		text: "<li>if you're using a phone, long press something to show its tooltip (if it has one)</li> <li>press <kbd>[K]</kbd> to pin a tooltip that's currently visible (not needed on phones)</li><li>change page's zoom using <kbd>ctrl +/-</kbd> to find the scale you like best</li>",
	},
	openChampSelect: {
		title: 'select a champion',
		type: 'damageSource',
		text: 'open champ select by clicking on the portrait',
		anchor: '.select-champion',
		completeOn: ['champSelectClosed', 'champSelectOpened'],
	},
	viewExtraComponent: {
		title: 'configuring passives',
		type: 'damageSource',
		text: 'some abilities, items or effects are configurable through elements that will be shown below the general configuration',
		anchor: '.extras > :first-child',
		showOn: {
			damageSourceExpanded(championId) {
				return championId ? championId in CHAMPION_COMPONENTS : false;
			},
			damageSourceChampionLoaded(championId) {
				return championId in CHAMPION_COMPONENTS;
			},
		},
		completeOn: ['extraComponentFocused'],
	},
	changeChampionLevel: {
		title: 'champion level',
		type: 'damageSource',
		text: 'can be changed by clicking the number next to their portrait',
		anchor: '.select-champion-level',
		completeOn: ['sourceLevelSelectFocused'],
	},
	openRunesDialog: {
		title: 'runes',
		type: 'damageSource',
		text: 'open rune select by clicking on the runes icon<br> <rules>note that at the moment only rune shards are implemented</rules>',
		anchor: '.select-runes',
		completeOn: ['runeSelectOpened'],
	},
	openItemShop: {
		title: 'items',
		type: 'damageSource',
		text: 'to buy items, open the item shop with the "items" button or by clicking on the inventory next to it',
		anchor: '.select-items',
		completeOn: ['itemShopOpened'],
	},
	itemShopFunctionality: {
		title: 'item shop',
		type: 'global',
		text: 'functions the same way the game\'s does. <span class="mouse-only">Right or double click items to buy them, right click in the inventory panel to sell</span><span class="touch-only">Double tap to buy items, select one in inventory then press "sell" button to sell</span>',
		within: 'dialog-item-shop',
		showOn: {
			itemShopOpened: true,
		},
		completeOn: ['itemShopClosed'],
	},
	changeAbilityLevel: {
		title: 'ability levels',
		type: 'damageSource',
		text: 'can be changed with the dots below their icons',
		anchor: '[data-ability] .v-button-radiogroup',
		showOn: {
			damageSourceChampionLoaded(currentChampionId) {
				return !!currentChampionId;
			},
			damageSourceExpanded(championId) {
				return !!championId;
			},
		},
		completeOn: ['abilityLevelFocused'],
	},
	changeHPAbilityResource: {
		title: 'current health and mana',
		type: 'damageSource',
		text: 'can be changed either directly in the inputs or by clicking on the bar itself',
		anchor: '.health-ability-resource',
		showOn: {
			itemShopClosed(damageSource) {
				return !!(damageSource.stats.value.total.hp || damageSource.stats.value.total.mana);
			},
			damageSourceChampionLoaded(currentChampionId) {
				return !!currentChampionId;
			},
			damageSourceExpanded(championId) {
				return !!championId;
			},
		},
		completeOn: ['hpAbilityResourceBarsInteracted'],
	},
	viewRoleQuests: {
		title: 'role quest',
		type: 'damageSource',
		text: 'can be set below HP and mana bars',
		anchor: '.role-quest > .v-select',
		completeOn: ['roleQuestFocused'],
	},
	viewDragons: {
		title: 'dragons',
		type: 'damageSource',
		text: 'stacks and soul can be changed next to role quest',
		anchor: '.dragons',
		completeOn: ['dragonsFocused'],
	},
};

export const TUTORIAL_EVENT_TO_STEP_IDS = {
	completeOn: Object.entries(tutorialSteps).reduce(
		(acc, [currId, currDef]) => {
			if (currDef.completeOn) {
				for (const eventName of currDef.completeOn) {
					acc[eventName] ??= [];
					acc[eventName]!.push(currId as ITutorialStepId);
				}
			}
			return acc;
		},
		{} as Partial<Record<ITutorialEvent, ITutorialStepId[]>>,
	),
	showOn: Object.entries(tutorialSteps).reduce(
		(acc, [currId, currDef]) => {
			if (currDef.showOn) {
				for (const eventName in currDef.showOn) {
					acc[eventName as ITutorialEvent] ??= [];
					acc[eventName as ITutorialEvent]!.push(currId as ITutorialStepId);
				}
			}
			return acc;
		},
		{} as Partial<Record<ITutorialEvent, ITutorialStepId[]>>,
	),
};

/** used to decide which step should be shown when popover is available. The lower the number, the higher the priority */
export const TUTORIAL_STEP_PRIORITIES = Object.fromEntries(
	TUTORIAL_STEP_IDS.map((id) => {
		if (id === 'greeting' || id === 'beforeYouStart') {
			return [id, 0];
		}
		const def = tutorialSteps[id];
		return [id, def.within ? 1 : !tutorialStepKinds[id] ? 2 : 3];
	}),
) as Record<ITutorialStepId, number>;
