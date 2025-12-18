export interface IRuneShards {
	slot1: 'adaptive' | 'attackSpeed' | 'abilityHaste';
	slot2: 'adaptive' | 'moveSpeed' | 'scalingHealth';
	slot3: 'instantHealth' | 'tenacity' | 'scalingHealth';
}

export interface IRunes {
	shards: IRuneShards;
}
