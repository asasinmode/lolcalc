export const ITEM_CALCULATIONS: Record<string, Record<string, (target?: IItemVariableCalculationTarget) => number>> = {
	3004: {	// manamune
		// TODO
		// BonusADFromMana(_source) {
		// 	const { mFormulaParts } = useItems()['3004']!.itemCalculations!.BonusADFromMana!;
		// 	return mFormulaParts![0].mCoefficient;
		// },
	},
};

export const ITEM_STAT_ICON_NAMES: Record<IItemStat | 'adaptiveForce' | 'OnHit' | 'level' | 'range', string> = {
	OnHit: 'onhit',
	FlatPhysicalDamageMod: 'scalead',
	adaptiveForce: 'adaptiveforce',
	AbilityHasteMod: 'scaleah',
	FlatMagicDamageMod: 'scaleap',
	PhysicalLethality: 'scaleapen',
	PercentArmorPenetrationMod: 'scaleapen',
	FlatArmorMod: 'scalearmor',
	PercentAttackSpeedMod: 'scaleas',
	FlatCritChanceMod: 'scalecrit',
	FlatCritDamageMod: 'scalecritmult',
	PercentHealingAmountMod: 'scalehealshield',
	FlatHPPoolMod: 'scalehealth',
	FlatHPRegenMod: 'scalehpregen',
	PercentBaseHPRegenMod: 'scalehpregen',
	level: 'scalelevel',
	PercentLifeStealMod: 'scalels',
	FlatMPPoolMod: 'scalemana',
	PercentBaseMPRegenMod: 'scalemanaregen',
	FlatMagicPenetrationMod: 'scalempen',
	PercentMagicPenetrationMod: 'scalempen',
	FlatSpellBlockMod: 'scalemr',
	FlatMovementSpeedMod: 'scalems',
	PercentMovementSpeedMod: 'scalems',
	range: 'scalerange',
	PercentOmnivampMod: 'scalesv',
	PercentTenacityMod: 'scaletenacity',
};
