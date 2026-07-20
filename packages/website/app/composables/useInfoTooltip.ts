function showTooltip(event: Event, isActivator: boolean) {
	const currentTarget = event.currentTarget as HTMLElement;
	const secondElement = (isActivator ? currentTarget.nextElementSibling : currentTarget.previousElementSibling) as HTMLElement;
	(isActivator ? secondElement : currentTarget).showPopover();
}

function hideTooltip(event: Event | FocusEvent, isActivator: boolean) {
	const currentTarget = event.currentTarget as HTMLElement;
	const secondElement = (isActivator ? currentTarget.nextElementSibling : currentTarget.previousElementSibling) as HTMLElement;

	if ('relatedTarget' in event && event.relatedTarget) {
		if (currentTarget.contains(event.relatedTarget as HTMLElement) || secondElement.contains(event.relatedTarget as HTMLElement)) {
			return;
		}
	}
	(isActivator ? secondElement : currentTarget).hidePopover();
}

export function useInfoTooltip() {
	return {
		showTooltip,
		hideTooltip,
	};
}
