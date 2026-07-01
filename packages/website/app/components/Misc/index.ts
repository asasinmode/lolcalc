import type { IMiscSpecificKey } from '@lolcalc/shared/index';
import type { ISpecificComponents } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { AbilityType } from '@lolcalc/shared/index';

export const MISC_COMPONENTS: Partial<Record<IMiscSpecificKey, ISpecificComponents>> = {
	CloudStack: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.misc, 'CloudStack'), 'isOOC', 'Is out of combat'),
	},
};
