import type { CalculatorResultsTable } from '#components';
import type { ShallowRef } from 'vue';

export function useCalculatorState(
	damageSources: ShallowRef<DamageSource[]>,
	damageTargets: ShallowRef<DamageSource[]>,
	resultsTable: ShallowRef<InstanceType<typeof CalculatorResultsTable>>,
) {
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
		let wholeState = '';
		let queryState = '';

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

		const tableResultsStr = `&flpTbl=${resultsTable.value.flipResults}`;
		wholeState += tableResultsStr;
		if (queryState.length + tableResultsStr.length <= MAX_QUERY_STATE_STRING_LENGTH) {
			queryState += tableResultsStr;
		}

		const querySavedChampionIds = new Set<string>();
		const querySavedItemIds = new Set<string>();
		for (const column of resultsTable.value.resultColumns) {
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

		for (const section of resultsTable.value.resultSections) {
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

	return { calculatorStateString };
}
