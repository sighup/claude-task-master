import { useState, useEffect } from 'react';

/**
 * React hook for keyboard navigation through a list of items
 * @param {Array|Object} itemsOrLength - Array of items or object with length property
 * @param {Object} [options={}] - Navigation options
 * @param {number} [options.initialIndex=0] - Starting index
 * @param {boolean} [options.loop=true] - Enable looping at boundaries
 * @param {Function} [options.onSelect] - Callback when item is selected
 * @param {Function} [options.onExit] - Callback when exiting navigation
 * @returns {Object} Navigation state and methods
 * @returns {number} returns.selectedIndex - Currently selected index
 * @returns {*} returns.selectedItem - Currently selected item
 * @returns {Function} returns.selectItem - Programmatically select an item by index
 * @returns {Function} returns.navigateUp - Move selection up
 * @returns {Function} returns.navigateDown - Move selection down
 * @returns {Function} returns.pageUp - Move selection up by 10 items
 * @returns {Function} returns.pageDown - Move selection down by 10 items
 * @returns {Function} returns.selectCurrent - Trigger selection of current item
 * @returns {Function} returns.setActive - Set navigation active state
 * @returns {boolean} returns.isActive - Whether navigation is active
 */
export function useNavigation(itemsOrLength, options = {}) {
	const {
		initialIndex = 0,
		loop = true,
		onSelect = () => {},
		onExit = () => {}
	} = options;

	// Handle both array of items and object with length property
	const items = Array.isArray(itemsOrLength) ? itemsOrLength : [];
	const itemsLength = Array.isArray(itemsOrLength)
		? itemsOrLength.length
		: itemsOrLength?.length || 0;

	const [selectedIndex, setSelectedIndex] = useState(initialIndex);
	const [isActive, setIsActive] = useState(true);

	useEffect(() => {
		if (selectedIndex >= itemsLength && itemsLength > 0) {
			setSelectedIndex(itemsLength - 1);
		} else if (selectedIndex < 0) {
			setSelectedIndex(0);
		}
	}, [itemsLength, selectedIndex]);

	// Navigation methods exposed for external input handling
	const navigateUp = () => {
		if (itemsLength === 0) return;
		setSelectedIndex((prev) => {
			if (prev <= 0) {
				return loop ? itemsLength - 1 : 0;
			}
			return prev - 1;
		});
	};

	const navigateDown = () => {
		if (itemsLength === 0) return;
		setSelectedIndex((prev) => {
			if (prev >= itemsLength - 1) {
				return loop ? 0 : itemsLength - 1;
			}
			return prev + 1;
		});
	};

	const pageUp = () => {
		if (itemsLength === 0) return;
		setSelectedIndex((prev) => {
			const newIndex = Math.max(0, prev - 10);
			return newIndex;
		});
	};

	const pageDown = () => {
		if (itemsLength === 0) return;
		setSelectedIndex((prev) => {
			const newIndex = Math.min(itemsLength - 1, prev + 10);
			return newIndex;
		});
	};

	const selectCurrent = () => {
		if (items[selectedIndex]) {
			onSelect(items[selectedIndex], selectedIndex);
		}
	};

	const selectItem = (index) => {
		if (index >= 0 && index < itemsLength) {
			setSelectedIndex(index);
		}
	};

	const getSelectedItem = () => {
		return items[selectedIndex] || null;
	};

	return {
		selectedIndex,
		selectedItem: getSelectedItem(),
		selectItem,
		navigateUp,
		navigateDown,
		pageUp,
		pageDown,
		selectCurrent,
		setActive: setIsActive,
		isActive
	};
}
