import type { IChampionId } from '@lolcalc/data/types.ts';
import { shallowRef } from 'vue';

/** map of step id to step kind, where `0` means guided, `1` means general */
export const tutorialStepKinds = {
	greeting: 0,
	openChampSelect: 1,
	changeChampionLevel: 1,
	openItemShop: 1,
	itemShopFunctionality: 0,
	viewExtraComponent: 1,
} as const satisfies Record<string, number>;

export type ITutorialStepId = keyof typeof tutorialStepKinds;

export const TUTORIAL_STEP_IDS = Object.keys(tutorialStepKinds) as ITutorialStepId[];

export interface TutorialEvents {
	itemShopOpened: void;
	itemShopClosed: void;
	champSelectOpened: void;
	champSelectClosed: IChampionId | undefined;
	sourceLevelSelectFocused: FocusEvent;
	extraComponentInteracted: void;
}

export type TutorialEventArgs<K extends keyof TutorialEvents> = TutorialEvents[K] extends void ? [] : [payload: TutorialEvents[K]];

const STORAGE_KEY = 'lolcalc-tutorial';
const TUTORIAL_STATE_VERSION = 1;
const state: ITutorialState = { v: TUTORIAL_STATE_VERSION, guided: false, steps: {} };

export interface ITutorialState {
	v: 1;
	guided: boolean;
	/** map of step completion, `1` means it's been done/ok-ed */
	steps: Partial<Record<ITutorialStepId, 1 | 0>>;
}

export function initTutorialState(): ITutorialState {
	state.v = TUTORIAL_STATE_VERSION;
	state.guided = false;
	state.steps = {};
	if (!import.meta.client) return state;
	try {
		const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
		if (parsed?.v !== TUTORIAL_STATE_VERSION) {
			return state;
		}
		state.guided = parsed.guided === true;
		for (const id of TUTORIAL_STEP_IDS) {
			const value = parsed.steps?.[id];
			if (value === 0 || value === 1) state.steps[id] = value;
		}
	} catch {}
	return state;
}

export function useTutorialState(): ITutorialState {
	return state!;
}

export function saveTutorialState() {
	if (import.meta.client) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {}
	}
}

/** executed on index page's mounted */
export function shouldLoadTutorial(): boolean {
	return TUTORIAL_STEP_IDS.some((id) => !state.steps[id]);
}

export function isTutorialStepId(value: unknown): value is ITutorialStepId {
	return typeof value === 'string' && value in tutorialStepKinds;
}

export interface ITutorialSink {
	onEvent(name: keyof TutorialEvents, payload: unknown): void;
	forceShow(id: ITutorialStepId): void;
	/** reload after state changed, as if freshly mounted */
	reload(): void;
}

/** used to decide if TheTutorial should be mounted */
export const tutorialRequest = shallowRef<false | { force?: ITutorialStepId }>(false);

let sink: ITutorialSink | undefined;
const buffer = new Map<keyof TutorialEvents, unknown>();

export function requestTutorial(options: { force?: ITutorialStepId } = {}) {
	if (options.force) {
		state.steps[options.force] = undefined;
		saveTutorialState();
	}
	tutorialRequest.value = options;
}

/** TheTutorial attaches and detaches itself on mounted/unmounted */
export function attachTutorialSink(newSink: ITutorialSink): () => void {
	sink = newSink;
	for (const [name, payload] of buffer) newSink.onEvent(name, payload);
	buffer.clear();
	return () => {
		if (sink === newSink) sink = undefined;
	};
}

export function tutorialEvent<K extends keyof TutorialEvents>(name: K, ...args: TutorialEventArgs<K>): void {
	if (sink) {
		sink.onEvent(name, args[0]);
	} else if (tutorialRequest.value) {
		buffer.set(name, args[0]);
	}
}

export function resetTutorialStep(id: ITutorialStepId | 'all') {
	if (id === 'all') {
		state.steps = {};
		state.guided = false;
	} else {
		state.steps[id] = undefined;
	}
	sink ? sink.reload() : requestTutorial();
}
