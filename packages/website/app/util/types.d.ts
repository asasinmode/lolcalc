type IDisplayedStatName = 'hp' | 'hpRegen' | 'mana' | 'manaRegen' | 'healShieldPower' | 'lethality' | 'percentArmorPen' | 'flatMagicPen' | 'percentMagicPen' | 'lifeSteal' | 'omnivamp' | 'attackRange' | 'tenacity' | 'attackDamage' | 'abilityPower' | 'armor' | 'magicResists' | 'attackSpeed' | 'attackSpeedRatio' | 'abilityHaste' | 'critChance' | 'critDamageMultiplier' | 'moveSpeed' | 'bonusAttackSpeedPercent';

export type IDisplayedStats = Record<IDisplayedStatName, number>;

export type IAdaptiveForceStat = 'attackDamage' | 'abilityPower';

export interface ITargetDummy {
	stats: Pick<IDisplayedStats, 'hp' | 'armor' | 'magicResists'>;
}
