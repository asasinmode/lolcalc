import type { IEffectObjectName, IMiscSpecificKey } from '@lolcalc/shared';
import type { ShallowRef } from 'vue';
import type { CalculatorResultsTable } from '#components';
import type { IDamageResultTableColumn } from '~/utils/types';
import { DamageSource } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { MISC_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/misc';
import { CHAMPION_KEY_TO_ID } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';

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
		window?.sessionStorage.setItem(STATE_SESSION_STORAGE_KEY, data[0]);
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
		const savedEffectObjectNames = new Set<IEffectObjectName>();
		const savedMiscIds = new Set<IMiscSpecificKey>();

		function savedUsedResultColumnIds(column: IDamageResultTableColumn): [sourceIndex: number, targetIndex: number] {
			const columnSourceIndex = column.source ? damageSources.value.indexOf(column.source) : -1;
			const columnTargetIndex = column.target ? damageTargets.value.indexOf(column.target) : -1;
			if (~columnSourceIndex || ~columnTargetIndex) {
				column.source?.champion.value?.id && savedChampionIds.add(column.source.champion.value!.id);
				column.target?.champion.value?.id && savedChampionIds.add(column.target.champion.value!.id);
				if (column.source) {
					for (const item of column.source.items.value) {
						item && savedItemIds.add(item.id);
					}
					for (const effect of column.source.appliedEffects.value) {
						savedEffectObjectNames.add(effect.abilityId.id);
					}
					for (const effectEntry of column.source.effectsAppliedToTarget.value) {
						savedEffectObjectNames.add(effectEntry[0].id);
					}
					for (const dragon of column.source.dragonStacks.value) {
						dragon && savedMiscIds.add(`${dragon}Stack`);
					}
					column.source.dragonSoul.value && savedMiscIds.add(`${column.source.dragonSoul.value}Soul`);
				}
				if (column.target) {
					for (const item of column.target.items.value) {
						item && savedItemIds.add(item.id);
					}
					for (const effect of column.target.appliedEffects.value) {
						savedEffectObjectNames.add(effect.abilityId.id);
					}
					for (const dragon of column.target.dragonStacks.value) {
						dragon && savedMiscIds.add(`${dragon}Stack`);
					}
					column.target.dragonSoul.value && savedMiscIds.add(`${column.target.dragonSoul.value}Soul`);
				}
			}
			return [columnSourceIndex, columnTargetIndex];
		}

		if (resultsTable.value && (
			resultsTable.value.resultColumns.slice(1).some(col => col.source || col.target)
			|| damageSources.value.length > 1 || damageTargets.value.length > 1
			|| resultsTable.value.resultColumns[0]!.source !== damageSources.value[0]
			|| resultsTable.value.resultColumns[0]!.target !== damageTargets.value[0])) {
			for (const column of resultsTable.value?.resultColumns || []) {
				const [columnSourceIndex, columnTargetIndex] = savedUsedResultColumnIds(column);

				const params = new URLSearchParams();
				params.append('tblCol', `${~columnSourceIndex ? columnSourceIndex : ''}-${~columnTargetIndex ? columnTargetIndex : ''}`);
				const str = params.toString();
				wholeState += `&${str}`;
				if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
					break;
				}
				queryState += `&${str}`;
			}
		} else if (resultsTable.value) {
			savedUsedResultColumnIds(resultsTable.value.resultColumns[0]!);
		}

		const keptSections = resultsTable.value?.resultSections.filter(section => section.abilityId.type === 'all'
			|| (section.abilityId.type === AbilityType.item
				? savedItemIds.has(section.abilityId.id)
				: section.abilityId.type === AbilityType.champion
					?	savedChampionIds.has(section.abilityId.id)
					: section.abilityId.type === AbilityType.effect
						? savedEffectObjectNames.has(section.abilityId.id)
						: savedMiscIds.has(section.abilityId.id))) ?? [];
		const computedCustomTotalRows = resultsTable.value?.computedCustomTotalRows.slice(1);
		const savedSectionIds: string[] = [];
		const isSectionsChanged = keptSections?.[0] && (keptSections.length > 3
			/* check if default order was changed */
			|| (keptSections[0]!.id !== 'a-stats'
				|| keptSections[1]!.id !== 'a-aa'
				|| keptSections.at(-1)!.id !== 'a-cTtl'));

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
						value.push(`${savedSectionIndex}-${row.rowIndex}`);
					}
				}

				if (value.length) {
					params.append('tblCTtl', value.join('_'));
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

		const stateString: string | undefined = window?.sessionStorage.getItem(STATE_SESSION_STORAGE_KEY) || window?.location.search;
		const params = new URLSearchParams(stateString);

		const version = params.get('v');
		if (version !== STATE_VERSION) {
			damageSources.value.push(new DamageSource());
			damageTargets.value.push(new DamageSource());
			if (resultsTable.value) {
				resultsTable.value.resultColumns[0]!.source = damageSources.value[0];
				resultsTable.value.resultColumns[0]!.target = damageTargets.value[0];
			}
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

		let noColumnsRestored = true;
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
				noColumnsRestored = false;
				i && resultsTable.value.addResultsColumn();
				const column = resultsTable.value.resultColumns.at(-1)!;
				column.source = source;
				column.target = target;
				resultsTable.value.addComputedColumnSources(column);
			}
		}

		if (noColumnsRestored && damageSources.value.length === 1 && damageTargets.value.length === 1) {
			resultsTable.value.resultColumns[0]!.source = damageSources.value[0];
			resultsTable.value.resultColumns[0]!.target = damageTargets.value[0];
			resultsTable.value.addComputedColumnSources(resultsTable.value.resultColumns[0]!);
		}

		const savedSections = params.getAll('tblSct');
		let currentSectionIndex = 0;
		for (const section of savedSections) {
			const [id, isExpanded] = section.split('_');
			if (!id) {
				continue;
			}

			/* `all` (permanent) sections start with 'a-' */
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

			const abilityId = GameAbilityId.parse(id, CHAMPION_KEY_TO_ID, EFFECT_SPECIFICS_OBJECT_ENTRIES, MISC_SPECIFICS_OBJECT_ENTRIES);
			if (abilityId) {
				resultsTable.value.addResultsSection(abilityId, undefined, !!isExpanded, currentSectionIndex);
				currentSectionIndex += 1;
			}
		}

		const savedCustomTotalRows = params.get('tblCTtl');
		if (savedCustomTotalRows?.length) {
			for (const totalRow of savedCustomTotalRows.split('_')) {
				const [rawSectionIndex, rawRowIndex] = totalRow.split('-');
				const sectionIndex = rawSectionIndex ? Number.parseInt(rawSectionIndex) : undefined;
				const rowIndex = rawRowIndex ? Number.parseInt(rawRowIndex) : undefined;
				if (sectionIndex !== undefined && !Number.isNaN(sectionIndex) && rowIndex !== undefined && !Number.isNaN(rawRowIndex)) {
					const section = resultsTable.value.resultSections[sectionIndex];
					const row = section?.rows[rowIndex];
					if (section && row && section.id !== 'a-cTtl') {
						resultsTable.value.customTotalRows.push(`${section.id}_${row.id}`);
					}
				}
			}
		}
	}

	return { saveState, debouncedSaveState, restoreState, isStateTooLargeForQuery };
}
