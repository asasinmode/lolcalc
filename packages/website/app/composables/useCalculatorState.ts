import type { IGameImageData } from '@lolcalc/core/misc';
import type { IDragonName } from '@lolcalc/data/types';
import type { IChampionStatName, IEffectObjectName } from '@lolcalc/shared';
import type { ShallowRef } from 'vue';
import type { CalculatorResultsTable } from '#components';
import type { ICustomTotalSectionRow, IDamageResultTableColumn, IDamageResultTableSection } from '~/utils/types';
import { DamageSource } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { CHAMPION_KEY_TO_ID, ICON_GOLD, imgUrl, PATCH_VERSION, STAT_ICON } from '@lolcalc/data';
import { AbilityType, ALL_CHAMPION_STATS_ENTRIES, CHAMPION_STAT_META } from '@lolcalc/shared';

const { vMinor } = PATCH_VERSION;

export const ResultSectionId = {
	Stats: 'a-stats',
	BasicAttack: 'a-ba',
	CustomTotal: 'a-cTtl',
} as const;
export const STATE_SESSION_STORAGE_KEY = 'lolcalc-calculator-state';
const STATE_VERSION = '1';

export interface ICalculatorState {
	damageSources: ShallowRef<DamageSource[]>;
	damageTargets: ShallowRef<DamageSource[]>;
	/** map of **filled** sources/targets ids for restoring/saving DamageSource.appliedEffects state */
	sourcesTargetsRef: [sources: ComputedRef<string[]>, targets: ComputedRef<string[]>];
	resultColumns: ShallowRef<IDamageResultTableColumn[]>;
	resultSections: ShallowRef<IDamageResultTableSection[]>;
	resultsTableFlip: Ref<boolean>;
	expandedSections: Ref<string[]>;
	/** custom total row ids formatted like `${sectionId}_${rowId}` */
	customTotalRowIds: Ref<string[]>;
	computedCustomTotalRows: ComputedRef<ICustomTotalSectionRow[]>;
}

export function initCalculatorState(): ICalculatorState {
	/* expected to have DamageSources added in `restoreState`, shallowRefs because otherwise ref properties inside of classes get messed up */
	const damageSources = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;
	const damageTargets = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;
	const resultColumns = ref<IDamageResultTableColumn[]>([{ id: useId() }]) as unknown as ShallowRef<IDamageResultTableColumn[]>;
	const resultSections = ref<IDamageResultTableSection[]>([
		{
			id: ResultSectionId.Stats,
			abilityId: { type: 'all', id: 'stats' },
			name: 'stats',
			isPermanent: true,
			image: [`https://raw.communitydragon.org/${vMinor}/game/assets/ux/deathrecap/itemdamage.png`, 32],
			rows: markRaw(ALL_CHAMPION_STATS_ENTRIES.map(([statName, statMeta]) => {
				const icon = STAT_ICON[statName as IChampionStatName];
				const image: IGameImageData = typeof icon === 'string'
					? [
							`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${icon}.png`,
							20,
						]
					:	icon;

				return {
					id: statName as string,
					name: statMeta.name,
					image,
				};
			}).concat([
				{
					id: 'eqValue',
					name: 'Inventory Value',
					image: [ICON_GOLD.src, ICON_GOLD.width, ICON_GOLD.height] as Extract<IGameImageData, any[]>,
				},
			])),
			getCellValue(_section, rowId, source, _target) {
				if (!source) {
					return;
				}

				if (rowId === 'eqValue') {
					const numberValue = source.items.value.reduce((acc, item) => acc + (item?.gold.total ?? 0), 0);
					return { numberValue, value: numberValue };
				}

				return {
					numberValue: source.stats.value.total[rowId as IChampionStatName],
					value: `${source.computed.formattedStatTotals.value[rowId as IChampionStatName]}${CHAMPION_STAT_META[rowId as IChampionStatName].isPercentage ? '%' : ''}`,
				};
			},
		},
		{
			id: ResultSectionId.BasicAttack,
			abilityId: { type: 'all', id: 'basicAttack' },
			name: 'basic attack',
			isPermanent: true,
			image: [imgUrl('game/assets/ux/deathrecap/autoattack.png'), 32],
			rows: markRaw([
				{
					name: 'total',
					id: 'total',
				},
				{
					name: 'physical damage',
					id: 'physicalDamage',
				},
				{
					name: 'magic damage',
					id: 'magicDamage',
				},
				{
					name: 'true damage',
					id: 'trueDamage',
				},
				{
					name: 'DPS',
					id: 'dps',
				},
			]),
			getCellValue() {
				return { value: 'TODO' };
			},
			selectValue: 'normal',
			selectOptions: markRaw([['normal', 'normal'], ['critical', 'critical'], ['average', 'average']]),
			selectLabel: 'attack type',
		},
		{
			id: ResultSectionId.CustomTotal,
			abilityId: { type: 'all', id: 'customTotal' },
			name: 'custom total',
			isPermanent: true,
			isCustomTotal: true,
			image: [imgUrl('game/assets/ux/deathrecap/unknowndamage.png'), 32],
			rows: markRaw([
				{
					id: 'cTtl-total',
					name: 'total',
				},
			]),
			getCellValue() {
				console.warn('results section custom total \'getCellValue\' called, should be handled manually');
				return { value: 0, numberValue: 0 };
			},
		},
	]) as unknown as ShallowRef<IDamageResultTableSection[]>;

	const customTotalSection = resultSections.value.find(section => section.isCustomTotal)!;
	const customTotalRowIds = ref<string[]>([]);

	const computedCustomTotalRows = computed<ICustomTotalSectionRow[]>(() => {
	/** `customTotalSection` is expected contain only the `total` row which technically doesn't have `sectionId` but it's not expected to be used */
		const rows: ICustomTotalSectionRow[] = (customTotalSection.rows as ICustomTotalSectionRow[]).concat(customTotalRowIds.value.map((combinedId) => {
			const [sectionId, rowId] = combinedId.split('_');

			const section = resultSections.value.find(section => section.id === sectionId)!;
			const rowIndex = section.rows.findIndex(row => row.id === rowId)!;
			const row = section.rows[rowIndex]!;

			return {
				...row,
				sectionId: section.id,
				rowIndex,
				image: section.image,
			};
		}));

		return rows;
	});

	const state: ICalculatorState = {
		damageSources,
		damageTargets,
		sourcesTargetsRef: [
			computed(() => damageSources.value.filter(source => source.anythingFilled.value).map(source => source.id)),
			computed(() => damageTargets.value.filter(target => target.anythingFilled.value).map(target => target.id)),
		],
		resultColumns,
		resultSections,
		resultsTableFlip: ref(false),
		expandedSections: ref<string[]>(resultSections.value.filter(section => section.id !== ResultSectionId.Stats).map(section => section.id)),
		customTotalRowIds,
		computedCustomTotalRows,
	};

	provide('calculatorState', state);

	return state;
}

export function useCalculatorState(): ICalculatorState {
	return inject<ICalculatorState>('calculatorState')!;
}

export function useManageCalculatorState(state = useCalculatorState()) {
	const { damageSources, damageTargets, sourcesTargetsRef, resultColumns, resultSections, resultsTableFlip, expandedSections, customTotalRowIds, computedCustomTotalRows } = state;
	const isStateTooLargeForQuery = ref(false);
	const debounceTimeout = useState<ReturnType<typeof setTimeout> | undefined>('saveStateDebounce');

	function saveState() {
		if (debounceTimeout.value) {
			clearTimeout(debounceTimeout.value);
			debounceTimeout.value = undefined;
		}
		const data = calculatorStateString();
		window?.sessionStorage.setItem(STATE_SESSION_STORAGE_KEY, data[0]);
		window?.history.replaceState(window?.history.state, '', `${location.pathname}${data[1] ? `?${data[1]}` : ''}`);
		isStateTooLargeForQuery.value = data[1].length !== data[0].length;
	}

	function debouncedSaveState() {
		if (debounceTimeout.value) {
			clearTimeout(debounceTimeout.value);
			debounceTimeout.value = undefined;
		}
		if (import.meta.client) {
			debounceTimeout.value = setTimeout(saveState, 500);
		}
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

		const tableResultsStr = resultsTableFlip.value ? `&flpTbl=` : '';
		wholeState += tableResultsStr;
		if (queryState.length + tableResultsStr.length <= MAX_QUERY_STATE_STRING_LENGTH) {
			queryState += tableResultsStr;
		}

		const savedChampionIds = new Set<string>();
		const savedItemIds = new Set<string>();
		const savedEffectObjectNames = new Set<IEffectObjectName>();
		const savedDragonsSoulAbilities = new Set<IDragonName>();

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
					column.source.dragonSoul.value && savedDragonsSoulAbilities.add(column.source.dragonSoul.value);
				}
				if (column.target) {
					for (const item of column.target.items.value) {
						item && savedItemIds.add(item.id);
					}
					for (const effect of column.target.appliedEffects.value) {
						savedEffectObjectNames.add(effect.abilityId.id);
					}
					column.target.dragonSoul.value && savedDragonsSoulAbilities.add(column.target.dragonSoul.value);
				}
			}
			return [columnSourceIndex, columnTargetIndex];
		}

		const saveColumnsToQuery = resultColumns.value.slice(1).some(col => col.source || col.target)
			|| damageSources.value.length > 1 || damageTargets.value.length > 1
			|| resultColumns.value[0]!.source !== damageSources.value[0]
			|| resultColumns.value[0]!.target !== damageTargets.value[0];
		for (const column of resultColumns.value) {
			const [columnSourceIndex, columnTargetIndex] = savedUsedResultColumnIds(column);

			if (saveColumnsToQuery) {
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

		const keptSections = resultSections.value.filter(section => section.abilityId.type === 'all'
			|| (section.abilityId.type === AbilityType.item
				? savedItemIds.has(section.abilityId.id)
				: section.abilityId.type === AbilityType.champion
					?	savedChampionIds.has(section.abilityId.id)
					: section.abilityId.type === AbilityType.effect
						? savedEffectObjectNames.has(section.abilityId.id)
						: savedDragonsSoulAbilities.has(section.abilityId.id))) ?? [];
		const savedSectionIds: string[] = [];
		const isSectionsChanged = keptSections?.[0] && (keptSections.length > 3
			/* check if default order was changed */
			|| (keptSections[0]!.id !== ResultSectionId.Stats
				|| keptSections[1]!.id !== ResultSectionId.BasicAttack
				|| keptSections.at(-1)!.id !== ResultSectionId.CustomTotal));

		if (computedCustomTotalRows.value?.length || isSectionsChanged) {
			for (const section of keptSections) {
				savedSectionIds.push(section.id);

				if (isSectionsChanged) {
					const params = new URLSearchParams();
					params.append('tblSct', `${section.id}_${expandedSections.value.includes(section.id) ? 1 : ''}`);
					const str = params.toString();
					wholeState += `&${str}`;
					if (queryState.length + str.length > MAX_QUERY_STATE_STRING_LENGTH) {
						break;
					}
					queryState += `&${str}`;
				}
			}

			if (computedCustomTotalRows.value?.length) {
				const params = new URLSearchParams();

				const value: string[] = [];
				for (const row of computedCustomTotalRows.value) {
					const { sectionId, rowIndex } = row;
					const savedSectionIndex = savedSectionIds.indexOf(sectionId!);
					if (~savedSectionIndex) {
						value.push(`${savedSectionIndex}-${rowIndex}`);
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

	function restoreState(resultsTable: Ref<InstanceType<typeof CalculatorResultsTable>>) {
		if (!import.meta.client) {
			return;
		}

		const stateString: string | undefined = window?.sessionStorage.getItem(STATE_SESSION_STORAGE_KEY) || window?.location.search;
		const params = new URLSearchParams(stateString);

		const version = params.get('v');
		if (version !== STATE_VERSION) {
			damageSources.value.push(new DamageSource(undefined, undefined, undefined, sourcesTargetsRef));
			damageTargets.value.push(new DamageSource(undefined, undefined, undefined, sourcesTargetsRef));
			resultColumns.value[0]!.source = damageSources.value[0];
			resultColumns.value[0]!.target = damageTargets.value[0];
			return;
		}

		const savedSources = params.getAll('src');
		if (savedSources.length) {
			for (const data of savedSources) {
				damageSources.value.push(DamageSource.fromStringifiedData(data, sourcesTargetsRef));
			}
		} else {
			damageSources.value.push(new DamageSource(undefined, undefined, undefined, sourcesTargetsRef));
		}

		const savedTargets = params.getAll('tgt');
		if (savedTargets.length) {
			for (const data of savedTargets) {
				damageTargets.value.push(DamageSource.fromStringifiedData(data, sourcesTargetsRef));
			}
		} else {
			damageTargets.value.push(new DamageSource(undefined, undefined, undefined, sourcesTargetsRef));
		}

		for (const source of damageSources.value) {
			if (source.fromStringifiedEffectSources?.length) {
				for (let i = 0; i < source.appliedEffects.value.length; i++) {
					const stringifiedEffectSource = source.fromStringifiedEffectSources[i];
					if (stringifiedEffectSource) {
						const group = stringifiedEffectSource[0] === 's' ? damageSources : damageTargets;
						const index = Number.parseInt(stringifiedEffectSource.slice(1));
						if (!Number.isNaN(index)) {
							source.appliedEffects.value[i]!.source.value = group.value[index];
						}
					}
				}
				source.fromStringifiedEffectSources = undefined;
			}
		}
		for (const target of damageTargets.value) {
			if (target.fromStringifiedEffectSources?.length) {
				for (let i = 0; i < target.appliedEffects.value.length; i++) {
					const stringifiedEffectSource = target.fromStringifiedEffectSources[i];
					if (stringifiedEffectSource) {
						const group = stringifiedEffectSource[0] === 's' ? damageSources : damageTargets;
						const index = Number.parseInt(stringifiedEffectSource.slice(1));
						if (!Number.isNaN(index)) {
							target.appliedEffects.value[i]!.source.value = group.value[index];
						}
					}
				}
				target.fromStringifiedEffectSources = undefined;
			}
		}

		const flipResults = params.has('flpTbl');
		if (flipResults) {
			resultsTableFlip.value = true;
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
				const column = resultColumns.value.at(-1)!;
				column.source = source;
				column.target = target;
				resultsTable.value.addComputedColumnSources(column);
			}
		}

		if (noColumnsRestored && damageSources.value.length === 1 && damageTargets.value.length === 1) {
			resultColumns.value[0]!.source = damageSources.value[0];
			resultColumns.value[0]!.target = damageTargets.value[0];
			resultsTable.value.addComputedColumnSources(resultColumns.value[0]!);
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
				const sectionIndex = resultSections.value.findIndex(section => section.id === id);
				if (~sectionIndex) {
					if (sectionIndex !== currentSectionIndex) {
						resultSections.value.splice(currentSectionIndex, 0, resultSections.value.splice(sectionIndex, 1)[0]!);
					}
					const expandedIndex = expandedSections.value.indexOf(id);
					if (isExpanded) {
						expandedIndex === -1 && expandedSections.value.push(id);
					} else {
						~expandedIndex && expandedSections.value.splice(expandedIndex, 1);
					}
				}
				currentSectionIndex += 1;
				continue;
			}

			const abilityId = GameAbilityId.parse(id, CHAMPION_KEY_TO_ID, EFFECT_SPECIFICS_OBJECT_ENTRIES);
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
					const section = resultSections.value[sectionIndex];
					const row = section?.rows[rowIndex];
					if (section && row && section.id !== 'a-cTtl') {
						customTotalRowIds.value.push(`${section.id}_${row.id}`);
					}
				}
			}
		}
	}

	return { saveState, debouncedSaveState, restoreState, isStateTooLargeForQuery };
}
