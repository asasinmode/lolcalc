import type { DamageSource } from '../DamageSource';
import { ITEMS_BY_NAME } from '@lolcalc/data';
import { itemVariableValue } from '../variables/game.ts';

export function bloodmailRetributionBonusAD(damageSource: DamageSource, maxHpOverride?: number) {
	const maxValueAt = itemVariableValue('RemainingHealthThreshold', { item: ITEMS_BY_NAME.overlordsBloodmail, damageSource });
	if (typeof maxValueAt?.value !== 'number') {
		console.error('[bloodmailRetributionBonusAD] failed to resolve RemainingHealthThreshold variable value');
		return Number.NaN;
	}

	const currentHealthP = Math.min(1, damageSource.currentHealth.value / (maxHpOverride ?? Math.max(damageSource.stats.value.total.hp, 1)));
	const missingHealthP = 1 - currentHealthP;
	const maxMissingHealthP = 1 - maxValueAt.value;
	return ITEMS_BY_NAME.overlordsBloodmail?.dataValues.MissingHealthAD * Math.min(1, missingHealthP / maxMissingHealthP);
};
