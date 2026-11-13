import type { IChampionId } from '@lolcalc/data/types.ts';
import { shallowRef } from 'vue';

/** map of step id to step kind, where `0` means guided, `1` means general */
export const tutorialStepKinds = {
	greeting: 1,
	beforeYouStart: 1,
	openChampSelect: 0,
	changeChampionLevel: 0,
	openItemShop: 0,
	itemShopFunctionality: 1,
	viewExtraComponent: 1,
} as const satisfies Record<string, number>;

export type ITutorialStepId = keyof typeof tutorialStepKinds;

export const TUTORIAL_STEP_IDS = Object.keys(tutorialStepKinds) as ITutorialStepId[];

/** map of event to its data */
export interface TutorialEvents {
	itemShopOpened: void;
	itemShopClosed: void;
	champSelectOpened: void;
	damageSourceExpanded: IChampionId | undefined;
	champSelectClosed: IChampionId | undefined;
	sourceLevelSelectFocused: void;
	// TODO add eventing in scoreboard item
	extraComponentInteracted: void;
}

export type TutorialEventArgs<K extends keyof TutorialEvents> = TutorialEvents[K] extends void ? [] : [data: TutorialEvents[K]];

const STORAGE_KEY = 'lolcalc-tutorial';
const TUTORIAL_STATE_VERSION = '1';
const state: ITutorialState = { v: TUTORIAL_STATE_VERSION, guided: false, steps: {} };

export interface ITutorialState {
	v: string;
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
		const rawState = localStorage.getItem(STORAGE_KEY);
		let guided = false;
		const steps: ITutorialState['steps'] = {};
		if (rawState) {
			for (const entry of rawState.split(';')) {
				const [name, value] = entry.split('=');
				if (name === 'v') {
					if (value !== TUTORIAL_STATE_VERSION) {
						return state;
					}
				} else if (name === 'guided') {
					guided = value === 'true';
				} else if (name === 'steps') {
					for (let i = 0; i < TUTORIAL_STEP_IDS.length; i++) {
						steps[TUTORIAL_STEP_IDS[i]!] = value?.[i] === '1' ? 1 : 0;
					}
				}
			}
		}
		state.guided = guided;
		state.steps = steps;
	} catch {}
	return state;
}

export function useTutorialState(): ITutorialState {
	return state!;
}

export function saveTutorialState() {
	if (import.meta.client) {
		try {
			localStorage.setItem(STORAGE_KEY, `v=${state.v};guided=${state.guided};steps=${TUTORIAL_STEP_IDS.map((id) => state.steps[id] ?? 0).join('')}`);
		} catch {}
	}
}

/** executed on index page's mounted */
export function shouldLoadTutorial(): boolean {
	return TUTORIAL_STEP_IDS.some((id) => !state.steps[id] && (tutorialStepKinds[id] || state.guided));
}

export function isTutorialStepId(value: unknown): value is ITutorialStepId {
	return typeof value === 'string' && value in tutorialStepKinds;
}

export interface ITutorialSink {
	onEvent(name: keyof TutorialEvents, eventSourceIds: ITutorialEventSourceIds, payload: unknown): void;
	forceShow(id: ITutorialStepId): void;
	/** reload after state changed, as if freshly mounted */
	reload(): void;
}

/** used to decide if TheTutorial should be mounted */
export const tutorialRequest = shallowRef<false | { force?: ITutorialStepId }>(false);

let sink: ITutorialSink | undefined;
const buffer = new Map<keyof TutorialEvents, [ITutorialEventSourceIds, unknown][]>();

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
	for (const [name, storedCallArgs] of buffer) {
		for (const args of storedCallArgs) {
			newSink.onEvent(name, args[0], args[1]);
		}
	}
	buffer.clear();
	return () => {
		if (sink === newSink) sink = undefined;
	};
}

/** the interacted with element that caused the event, used for positioning the tutorial popup next to it */
export interface ITutorialEventSourceIds {
	damageSource?: string;
	resultColumn?: string;
	resultSection?: string;
}

export function tutorialEvent<K extends keyof TutorialEvents>(name: K, sourceIds: ITutorialEventSourceIds, ...args: TutorialEventArgs<K>): void {
	if (sink) {
		sink.onEvent(name, sourceIds, args[0]);
	} else {
		const bufferedArgs = buffer.getOrInsert(name, []);
		bufferedArgs.push([sourceIds, args[0]]);
	}
}

export function resetTutorialStep(id: ITutorialStepId | 'all') {
	if (id === 'all') {
		state.steps = {};
		state.guided = false;
	} else {
		state.steps[id] = undefined;
	}
	saveTutorialState();
	sink ? sink.reload() : requestTutorial();
}
