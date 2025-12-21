const NUMBER_TO_RUNE_SHARD = {
	offensive: ['adaptiveForce', 'percentAttackSpeed', 'abilityHaste'] satisfies IRuneShards['offensive'][],
	flex: ['adaptiveForce', 'percentMoveSpeed', 'scalingHealth'] satisfies IRuneShards['flex'][],
	defensive: ['flatHealth', 'percentTenacityMod', 'scalingHealth'] satisfies IRuneShards['defensive'][],
} as const;

export function numberRuneShards(offensive: number, flex: number, defensive: number): IRuneShards {
	return {
		offensive: NUMBER_TO_RUNE_SHARD.offensive[offensive - 1]!,
		flex: NUMBER_TO_RUNE_SHARD.flex[flex - 1]!,
		defensive: NUMBER_TO_RUNE_SHARD.defensive[defensive - 1]!,
	};
}
