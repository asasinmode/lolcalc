import type { ShallowRef } from 'vue';
import type { IDamageResultTableColumn, IDamageResultTableSection } from '~/utils/types';

export function useCalculatorState(
	damageSources: ShallowRef<DamageSource[]>,
	damageTargets: ShallowRef<DamageSource[]>,
	resultTableColumns: Ref<IDamageResultTableColumn[]>,
	resultTableSections: Ref<IDamageResultTableSection[]>,
) {
	const damageSourcesState = computed<[state: string, sourceIndex: number][]>(() => {
		console.log('computing sources state');
		const rv: [string, number][] = [];
		for (let i = 0; i < damageSources.value.length; i++) {
			const damageSource = damageSources.value[i]!;
			if (damageSource.anythingFilled.value) {
				const params = new URLSearchParams();
				params.append('damageSource', (damageSource.stringifiedData as unknown as Ref<string>).value);
				rv.push([params.toString(), i]);
			}
		}
		return rv;
	});

	const damageTargetsState = computed<[state: string, sourceIndex: number][]>(() => {
		console.log('computing targets state');
		const rv: [string, number][] = [];
		for (let i = 0; i < damageTargets.value.length; i++) {
			const damageSource = damageTargets.value[i]!;
			if (damageSource.anythingFilled.value) {
				const params = new URLSearchParams();
				params.append('damageSource', (damageSource.stringifiedData as unknown as Ref<string>).value);
				rv.push([params.toString(), i]);
			}
		}
		return rv;
	});

	/* assuming browsers take up to ~2000 */
	// const STATE_STRING_LENGTH_LIMIT = 1920;
	// TODO save results
	// TODO clip properly
	// TODO alert data is clipped
	// update with debounce on data change
	const STATE_STRING_LENGTH_LIMIT = 200;
	function calculatorStateString(): [wholeState: string, queryState: string] {
		let wholeState = '';
		let queryState = '';

		let querySavedHighestSourceIndex = -1;
		for (const [str, i] of damageSourcesState.value) {
			wholeState += `&${str}`;
			if (queryState.length + str.length > STATE_STRING_LENGTH_LIMIT) {
				console.log('breaking source', i);
				break;
			}
			queryState += `&${str}`;
			querySavedHighestSourceIndex = i;
		}

		let querySavedHighestTargetIndex = -1;
		for (const [str, i] of damageTargetsState.value) {
			wholeState += `&${str}`;
			if (queryState.length + str.length > STATE_STRING_LENGTH_LIMIT) {
				console.log('breaking target', i);
				break;
			}
			queryState += `&${str}`;
			querySavedHighestTargetIndex = i;
		}

		const querySavedChampionIds = new Set<string>();
		const querySavedItemIds = new Set<string>();
		for (const column of resultTableColumns.value) {
			const columnSourceIndex = column.source ? damageSources.value.indexOf(column.source) : -1;
			const columnTargetIndex = column.target ? damageTargets.value.indexOf(column.target) : -1;
			if ((~columnSourceIndex && columnSourceIndex <= querySavedHighestSourceIndex)
				|| (~columnTargetIndex && columnTargetIndex <= querySavedHighestTargetIndex)) {
				const params = new URLSearchParams();
				params.append('tableResultColumn', `${
					columnSourceIndex === -1 || columnSourceIndex > querySavedHighestSourceIndex ? '' : columnSourceIndex
				}-${
					columnTargetIndex === -1 || columnTargetIndex > querySavedHighestTargetIndex ? '' : columnTargetIndex
				}`);
				const str = params.toString();
				wholeState += `&${str}`;
				if (queryState.length + str.length > STATE_STRING_LENGTH_LIMIT) {
					console.log('breaking col', column.source?.champion.value?.name, column.target?.champion.value?.name, str);
					break;
				}
				console.log('saving col', column.source?.champion.value?.name, columnSourceIndex, column.target?.champion.value?.name, columnTargetIndex, str);
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

		console.log('saved', { querySavedHighestSourceIndex, querySavedHighestTargetIndex }, querySavedChampionIds, querySavedItemIds);

		console.log('state', queryState.length);
		return [wholeState, queryState];
	}

	return { calculatorStateString };
}
