import type { ITargetDummy } from '~/util/types';

export function useDamage(damage: number, type: IDamageType, target: ITargetDummy) {
	return damage;
}

type IDamageType = 'physical' | 'magical' | 'true';
