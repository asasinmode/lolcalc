/**
	* multiplicative scaling according to [wiki](https://wiki.leagueoflegends.com/en-us/Stacking#Stacks_multiplicatively)
	* note that the `currentValue` should start at `1` then after all multiplicative things are added, the final value should be `1 - [summed multiplicative things]`
	* @example
	* ```ts
	* // start with
	* itemBaseStats.tenacity = 1
	*	// summing
	*	itemBaseStats.tenacity = addMultiplicative(itemBaseStats.tenacity, statValue)
	* // after everything's summed up
	* itemBaseStats.tenacity = 1 - itemBaseStats.tenacity
	* // or in one go
	* bonusStats.tenacity = 1 - addMultiplicative(1, runeShardStats.tenacity, itemTotalStats.tenacity, championPassiveStats.tenacity ?? 0)
	* ```
	*/
export function addMultiplicative(currentValue: number, ...values: number[]) {
	for (const value of values) {
		currentValue *= 1 - value;
	}
	return currentValue;
}

/** soft cap according to wiki https://wiki.leagueoflegends.com/en-us/Movement_speed#Movement_speed_caps */
export function calculateMSCapPenalty(moveSpeed: number) {
	let penalty = 0;
	if (moveSpeed > 415) {
		if (moveSpeed > 490) {
			penalty = moveSpeed * 0.5 - 230;
		} else {
			penalty = moveSpeed * 0.2 - 83;
		}
	}
	return penalty;
}
