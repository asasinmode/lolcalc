import { CONSTS } from '@lolcalc/data';

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

/**
 * combine 2 multipliers that compound of off each other, for example Briar's passive interacts this way with Spirit Visage's and Immortal Path's passives on hp regen
 * so 20% from spirit visage + 12% from immortal path ends up being `34%` instead of `32%`
 */
export function combineCompounding(current: number, value: number) {
	return (1 + current) * (1 + value) - 1;
}

/**
 * combine 2 multipliers that recursively interact with each other, for example spirit visage and immortal path's passive recursively multiply life steal
 * so 20% from spirit visage + 12% from immortal path ends up being `37.72%`
 */
export function combineRecursive(current: number, value: number) {
	return current / (1 - value) + value / (1 - current);
}

/** soft cap according to wiki https://wiki.leagueoflegends.com/en-us/Movement_speed#Movement_speed_caps */
export function calculateMSCapPenalty(moveSpeed: number, applyBottomCaps = true) {
	let finalMS = moveSpeed;

	if (moveSpeed > CONSTS.moveSpeed.secondTopSoftCapThreshold) {
		finalMS = moveSpeed * 0.5 + 230;
	} else if (moveSpeed > CONSTS.moveSpeed.firstTopSoftCapThreshold) {
		finalMS = moveSpeed * 0.8 + 83;
	} else if (applyBottomCaps) {
		if (moveSpeed < 0) {
			finalMS = 110 + moveSpeed * 0.01;
		} else if (moveSpeed < CONSTS.moveSpeed.firstBottomSoftCapThreshold) {
			finalMS = 110 + moveSpeed * 0.5;
		}
	}

	return moveSpeed - finalMS;
}
