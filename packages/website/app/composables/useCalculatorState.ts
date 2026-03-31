import type { CalculatorResultsTable } from '#components';
import type { ShallowRef } from 'vue';

const STATE_SESSION_STORAGE_KEY = 'lolcalc-calculator-state';
const STATE_VERSION = '1';

export function useCalculatorState(
	damageSources: ShallowRef<DamageSource[]>,
	damageTargets: ShallowRef<DamageSource[]>,
	resultsTable: ShallowRef<InstanceType<typeof CalculatorResultsTable> | undefined>,
) {
	const isStateTooLargeForQuery = ref(false);
	let saveStateDebounceTimeout: ReturnType<typeof setTimeout> | undefined;

	function saveState() {
		if (saveStateDebounceTimeout) {
			clearTimeout(saveStateDebounceTimeout);
			saveStateDebounceTimeout = undefined;
		}
		const data = calculatorStateString();
		sessionStorage.setItem(STATE_SESSION_STORAGE_KEY, data[0]);
		window?.history.replaceState(null, '', `${location.pathname}${data[1] ? `?${data[1]}` : ''}`);
		isStateTooLargeForQuery.value = data[1].length !== data[0].length;
	}

	function debouncedSaveState() {
		if (saveStateDebounceTimeout) {
			clearTimeout(saveStateDebounceTimeout);
			saveStateDebounceTimeout = undefined;
		}
		saveStateDebounceTimeout = setTimeout(saveState, 500);
	}

	const damageSourcesState = computed<[state: string, sourceIndex: number][]>(() => {
		const rv: [string, number][] = [];
		for (let i = 0; i < damageSources.value.length; i++) {
			const damageSource = damageSources.value[i]!;
			if (damageSource.anythingFilled.value) {
				const params = new URLSearchParams();
				params.append('src', (damageSource.stringifiedData as unknown as Ref<string>).value);
				rv.push([params.toString(), i]);
			}
		}
		return rv;
	});

	const damageTargetsState = computed<[state: string, sourceIndex: number][]>(() => {
		const rv: [string, number][] = [];
		for (let i = 0; i < damageTargets.value.length; i++) {
			const damageSource = damageTargets.value[i]!;
			if (damageSource.anythingFilled.value) {
				const params = new URLSearchParams();
				params.append('tgt', (damageSource.stringifiedData as unknown as Ref<string>).value);
				rv.push([params.toString(), i]);
			}
		}
		return rv;
	});

	/* assuming browsers take up to ~2000 */
	const MAX_QUERY_STATE_STRING_LENGTH = 1920;
	function calculatorStateString(): [wholeState: string, queryState: string] {
		let wholeState = `v=${STATE_VERSION}`;
		let queryState = wholeState;

		let querySavedHighestSourceIndex = -1;
		for (const [str, i] of damageSourcesState.value) {
			wholeState += `&${str}`;
			if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
				break;
			}
			queryState += `&${str}`;
			querySavedHighestSourceIndex = i;
		}

		let querySavedHighestTargetIndex = -1;
		for (const [str, i] of damageTargetsState.value) {
			wholeState += `&${str}`;
			if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
				break;
			}
			queryState += `&${str}`;
			querySavedHighestTargetIndex = i;
		}

		const tableResultsStr = resultsTable.value?.flipResults ? `&flpTbl=` : '';
		wholeState += tableResultsStr;
		if (queryState.length + tableResultsStr.length <= MAX_QUERY_STATE_STRING_LENGTH) {
			queryState += tableResultsStr;
		}

		const querySavedChampionIds = new Set<string>();
		const querySavedItemIds = new Set<string>();
		for (const column of resultsTable.value?.resultColumns || []) {
			const columnSourceIndex = column.source ? damageSources.value.indexOf(column.source) : -1;
			const columnTargetIndex = column.target ? damageTargets.value.indexOf(column.target) : -1;
			if ((~columnSourceIndex && columnSourceIndex <= querySavedHighestSourceIndex)
				|| (~columnTargetIndex && columnTargetIndex <= querySavedHighestTargetIndex)) {
				const params = new URLSearchParams();
				params.append('tblCol', `${
					columnSourceIndex === -1 || columnSourceIndex > querySavedHighestSourceIndex ? '' : columnSourceIndex
				}-${
					columnTargetIndex === -1 || columnTargetIndex > querySavedHighestTargetIndex ? '' : columnTargetIndex
				}`);
				const str = params.toString();
				wholeState += `&${str}`;
				if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
					break;
				}
				queryState += `&${str}`;

				column.source?.champion.value?.id && querySavedChampionIds.add(column.source.champion.value!.id);
				column.target?.champion.value?.id && querySavedChampionIds.add(column.target.champion.value!.id);

				if (column.source) {
					for (const item of (column.source as unknown as DamageSource).items.value) {
						item && querySavedItemIds.add(item.id);
					}
				}
				if (column.target) {
					for (const item of (column.target as unknown as DamageSource).items.value) {
						item && querySavedItemIds.add(item.id);
					}
				}
			}
		}

		for (const section of resultsTable.value?.resultSections || []) {
			if (section.isPermanent) {
				continue;
			}
			const [championOrItemId] = section.id.split('-');
			if (section.type === 'all' || !(section.type === 'item' ? querySavedItemIds.has(championOrItemId!) : querySavedChampionIds.has(championOrItemId!))) {
				continue;
			}

			const params = new URLSearchParams();
			params.append('tblSct', `${section.type}_${section.id}`);
			const str = params.toString();
			wholeState += `&${str}`;
			if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
				break;
			}
			queryState += `&${str}`;
		}

		return [wholeState, queryState];
	}

	function restoreState() {
		if (!import.meta.client) {
			return;
		}

		const stateString: string | undefined = sessionStorage.getItem(STATE_SESSION_STORAGE_KEY) || window?.location.search;
		const params = new URLSearchParams(stateString);

		const version = params.get('v');
		if (version !== STATE_VERSION) {
			return;
		}

		console.log('restoring state');

		const savedSources = params.getAll('src');
		if (savedSources.length) {
			for (const data of savedSources) {
				damageSources.value.push(markRaw(DamageSource.fromStringifiedData(data)));
			}
		} else {
			damageSources.value.push(markRaw(new DamageSource()));
		}

		const savedTargets = params.getAll('tgt');
		if (savedTargets.length) {
			for (const data of savedTargets) {
				damageTargets.value.push(markRaw(DamageSource.fromStringifiedData(data)));
			}
		} else {
			damageTargets.value.push(markRaw(new DamageSource()));
		}

		if (!resultsTable.value) {
			return;
		}

		const flipResults = params.has('flpTbl');
		if (flipResults) {
			resultsTable.value.flipResults = true;
		}

		const savedColumns = params.getAll('tblCol');
		for (let i = 0; i < savedColumns.length; i++) {
			const [rawSourceIndex, rawTargetIndex] = savedColumns[i]!.split('-');

			if (!rawSourceIndex && !rawTargetIndex) {
				continue;
			}

			let sourceIndex = rawSourceIndex ? Number.parseInt(rawSourceIndex) : undefined;
			let targetIndex = rawTargetIndex ? Number.parseInt(rawTargetIndex) : undefined;

			if (Number.isNaN(sourceIndex)) {
				sourceIndex = undefined;
			}
			if (Number.isNaN(targetIndex)) {
				targetIndex = undefined;
			}

			const source = sourceIndex !== undefined ? damageSources.value[sourceIndex] : undefined;
			const target = targetIndex !== undefined ? damageTargets.value[targetIndex] : undefined;

			if (source || target) {
				i && resultsTable.value.addResultsColumn();
				resultsTable.value.resultColumns.at(-1)!.target = target;
				resultsTable.value.resultColumns.at(-1)!.source = source;
			}
		}
	}

	return { saveState, debouncedSaveState, restoreState, isStateTooLargeForQuery };
}
