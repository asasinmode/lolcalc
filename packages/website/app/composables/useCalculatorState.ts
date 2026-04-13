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

		for (const [str] of damageSourcesState.value) {
			wholeState += `&${str}`;
			if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
				break;
			}
			queryState += `&${str}`;
		}

		for (const [str] of damageTargetsState.value) {
			wholeState += `&${str}`;
			if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
				break;
			}
			queryState += `&${str}`;
		}

		const tableResultsStr = resultsTable.value?.flipResults ? `&flpTbl=` : '';
		wholeState += tableResultsStr;
		if (queryState.length + tableResultsStr.length <= MAX_QUERY_STATE_STRING_LENGTH) {
			queryState += tableResultsStr;
		}

		const savedChampionIds = new Set<string>();
		const savedItemIds = new Set<string>();
		for (const column of resultsTable.value?.resultColumns || []) {
			const columnSourceIndex = column.source ? damageSources.value.indexOf(column.source) : -1;
			const columnTargetIndex = column.target ? damageTargets.value.indexOf(column.target) : -1;
			if (~columnSourceIndex || ~columnTargetIndex) {
				column.source?.champion.value?.id && savedChampionIds.add(column.source.champion.value!.id);
				column.target?.champion.value?.id && savedChampionIds.add(column.target.champion.value!.id);
				if (column.source) {
					for (const item of (column.source as unknown as DamageSource).items.value) {
						item && savedItemIds.add(item.id);
					}
				}
				if (column.target) {
					for (const item of (column.target as unknown as DamageSource).items.value) {
						item && savedItemIds.add(item.id);
					}
				}

				const params = new URLSearchParams();
				params.append('tblCol', `${~columnSourceIndex ? columnSourceIndex : ''}-${~columnTargetIndex ? columnTargetIndex : ''}`);
				const str = params.toString();
				wholeState += `&${str}`;
				if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
					break;
				}
				queryState += `&${str}`;
			}
		}

		const keptSections = resultsTable.value?.resultSections.filter(section => section.abilityId.type === 'all'
			|| (section.abilityId.type === ABILITY_TYPE.item ? savedItemIds.has(section.abilityId.id) : savedChampionIds.has(section.abilityId.id))) ?? [];
		const computedCustomTotalRows = resultsTable.value?.computedCustomTotalRows.slice(1);
		const savedSectionIds: string[] = [];
		const isSectionsChanged = keptSections.length > 3
			/* check if default order was changed */
			|| (keptSections[0]!.id !== 'a-stats'
				|| keptSections[1]!.id !== 'a-aa'
				|| keptSections.at(-1)!.id !== 'a-cTtl');

		if (computedCustomTotalRows?.length || isSectionsChanged) {
			for (const section of keptSections) {
				savedSectionIds.push(section.id);

				if (isSectionsChanged) {
					const params = new URLSearchParams();
					params.append('tblSct', `${section.id}_${resultsTable.value!.expandedSections.includes(section.id) ? 1 : ''}`);
					const str = params.toString();
					wholeState += `&${str}`;
					if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
						break;
					}
					queryState += `&${str}`;
				}
			}

			if (computedCustomTotalRows?.length) {
				const params = new URLSearchParams();

				const value: string[] = [];
				for (const row of computedCustomTotalRows) {
					const savedSectionIndex = savedSectionIds.indexOf(row.sectionId);
					if (~savedSectionIndex) {
						value.push(`${savedSectionIndex}|${row.rowIndex}`);
					}
				}

				if (value.length) {
					params.append('tblCTtl', value.join('~'));
					const str = params.toString();
					wholeState += `&${str}`;
					if (queryState.length + str.length < MAX_QUERY_STATE_STRING_LENGTH) {
						queryState += `&${str}`;
					}
				}
			}
		}

		return wholeState.length === 3 ? ['', ''] : [wholeState, queryState];
	}

	function restoreState() {
		if (!import.meta.client) {
			return;
		}

		const stateString: string | undefined = sessionStorage.getItem(STATE_SESSION_STORAGE_KEY) || window?.location.search;
		const params = new URLSearchParams(stateString);

		const version = params.get('v');
		if (version !== STATE_VERSION) {
			damageSources.value.push(new DamageSource());
			damageTargets.value.push(new DamageSource());
			return;
		}

		const savedSources = params.getAll('src');
		if (savedSources.length) {
			for (const data of savedSources) {
				damageSources.value.push(DamageSource.fromStringifiedData(data));
			}
		} else {
			damageSources.value.push(new DamageSource());
		}

		const savedTargets = params.getAll('tgt');
		if (savedTargets.length) {
			for (const data of savedTargets) {
				damageTargets.value.push(DamageSource.fromStringifiedData(data));
			}
		} else {
			damageTargets.value.push(new DamageSource());
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

		const savedSections = params.getAll('tblSct');
		let currentSectionIndex = 0;
		for (const section of savedSections) {
			const [id, isExpanded] = section.split('_');
			if (!id) {
				continue;
			}

			/* `all` sections start with 'a-' */
			if (id.startsWith('a-')) {
				const sectionIndex = resultsTable.value.resultSections.findIndex(section => section.id === id);
				if (~sectionIndex) {
					if (sectionIndex !== currentSectionIndex) {
						resultsTable.value.resultSections.splice(currentSectionIndex, 0, resultsTable.value.resultSections.splice(sectionIndex, 1)[0]!);
					}
					const expandedIndex = resultsTable.value.expandedSections.indexOf(id);
					if (isExpanded) {
						expandedIndex === -1 && resultsTable.value.expandedSections.push(id);
					} else {
						~expandedIndex && resultsTable.value.expandedSections.splice(expandedIndex, 1);
					}
				}
				currentSectionIndex += 1;
				continue;
			}

			const abilityId = GameAbilityId.parse(id, 'internal');
			if (abilityId) {
				resultsTable.value.addResultsSection(abilityId, undefined, !!isExpanded);
				currentSectionIndex += 1;
			}
		}
	}

	return { saveState, debouncedSaveState, restoreState, isStateTooLargeForQuery };
}
