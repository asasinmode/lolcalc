import type { IDamageVars } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource';
import type { IHypotheticalDragonSpecifics } from '../specifics/dragon.ts';
import { DRAGON_SPECIFICS } from '../specifics/dragon.ts';

export function calculateDamageVars(self: DamageSource): IDamageVars {
	const rv: IDamageVars = {};

	if (self.dragonSoul.value) {
		(DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[self.dragonSoul.value]?.soul?.damageVars?.(self, rv);
	}

	return rv;
}
