export function useInfoTooltip() {
	let popoverEl: HTMLElement | undefined;

	const { show, hide } = useHoverTooltip({
		el: () => popoverEl,
	});

	function showTooltip(event: Event | FocusEvent, isActivator: boolean) {
		const currentTarget = event.currentTarget as HTMLElement;
		const secondElement = (isActivator ? currentTarget.nextElementSibling : currentTarget.previousElementSibling) as HTMLElement;
		popoverEl = isActivator ? secondElement : currentTarget;

		/* when popover is focused and esc is pressed, defalut browser behavior focuses back the trigger. Don't show the tooltip in that case */
		if (!('relatedTarget' in event) || !event.relatedTarget || !popoverEl.contains(event.relatedTarget as HTMLElement)) {
			show(event);
		}
	}

	function hideTooltip(event: Event | FocusEvent, isActivator: boolean) {
		const currentTarget = event.currentTarget as HTMLElement;
		const secondElement = (isActivator ? currentTarget.nextElementSibling : currentTarget.previousElementSibling) as HTMLElement;

		if (!('relatedTarget' in event) || !event.relatedTarget || !(currentTarget.contains(event.relatedTarget as HTMLElement) || secondElement.contains(event.relatedTarget as HTMLElement))) {
			popoverEl = isActivator ? secondElement : currentTarget;
			hide();
		}
	}

	return {
		showTooltip,
		hideTooltip,
	};
}
