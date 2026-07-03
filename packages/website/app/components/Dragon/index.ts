import type { IDragonName } from '@lolcalc/data/types';
import type { ISpecificComponents } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { AbilityType } from '@lolcalc/shared/index';

export const DRAGON_COMPONENTS: Partial<Record<IDragonName, { stack?: ISpecificComponents; soul?: ISpecificComponents }>> = {
	Cloud: {
		stack: {
			extras: await booleanExtra(GameAbilityId.build(AbilityType.dragon, 'Cloud', 'stack'), 'isOOC', 'is out of combat', false),
		},
		soul: {
			extras: [
				await booleanExtra(GameAbilityId.build(AbilityType.dragon, 'Cloud', 'soul'), 'isOOC', 'is out of combat', false),
				await booleanExtra(GameAbilityId.build(AbilityType.dragon, 'Cloud', 'soul'), 'hasUlted', 'has ulted', false),
			],
		},
	},
};

for (const key in DRAGON_COMPONENTS) {
	const { stack, soul } = DRAGON_COMPONENTS[key as keyof typeof DRAGON_COMPONENTS]!;
	if (stack) {
		stack.extras && (Array.isArray(stack.extras) ? stack.extras.forEach(component => markRaw(component)) : markRaw(stack.extras));
		stack.effects && (Array.isArray(stack.effects) ? stack.effects.forEach(component => markRaw(component)) : markRaw(stack.effects));
	}
	if (soul) {
		soul.extras && (Array.isArray(soul.extras) ? soul.extras.forEach(component => markRaw(component)) : markRaw(soul.extras));
		soul.effects && (Array.isArray(soul.effects) ? soul.effects.forEach(component => markRaw(component)) : markRaw(soul.effects));
	}
}
