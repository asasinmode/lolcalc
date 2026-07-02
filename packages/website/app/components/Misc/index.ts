import type { IMiscSpecificKey } from '@lolcalc/shared/index';
import type { ISpecificComponents } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { AbilityType } from '@lolcalc/shared/index';

export const MISC_COMPONENTS: Partial<Record<IMiscSpecificKey, ISpecificComponents>> = {
	CloudStack: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.misc, 'CloudStack'), 'isOOC', 'Is out of combat'),
	},
	CloudSoul: {
		extras: [
			await booleanExtra(GameAbilityId.build(AbilityType.misc, 'CloudSoul'), 'isOOC', 'Is out of combat'),
			await booleanExtra(GameAbilityId.build(AbilityType.misc, 'CloudSoul'), 'hasUlted', 'Has ulted'),
		],
	},
};

for (const key in MISC_COMPONENTS) {
	const { extras, effects } = MISC_COMPONENTS[key as keyof typeof MISC_COMPONENTS]!;
	extras && (Array.isArray(extras) ? extras.forEach(component => markRaw(component)) : markRaw(extras));
	effects && (Array.isArray(effects) ? effects.forEach(component => markRaw(component)) : markRaw(effects));
}
