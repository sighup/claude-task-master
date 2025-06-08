/**
 * @jest-environment jsdom
 */

/**
 * useNavigation hook tests
 */

import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useNavigation } from '../../../../scripts/modules/start-ui/hooks/useNavigation.js';
import { setupMocks, createMockTask } from '../setup.js';

describe('useNavigation', () => {
	let mockItems;
	let mockOnSelect;
	let mockOnExit;

	beforeEach(() => {
		setupMocks();

		mockItems = [
			createMockTask({ id: 1, title: 'Task 1' }),
			createMockTask({ id: 2, title: 'Task 2' }),
			createMockTask({ id: 3, title: 'Task 3' })
		];

		mockOnSelect = jest.fn();
		mockOnExit = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('initialization', () => {
		test('should initialize with default values', () => {
			const { result } = renderHook(() => useNavigation(mockItems));

			expect(result.current.selectedIndex).toBe(0);
			expect(result.current.selectedItem).toEqual(mockItems[0]);
			expect(result.current.isActive).toBe(true);
		});

		test('should initialize with custom initial index', () => {
			const { result } = renderHook(() =>
				useNavigation(mockItems, { initialIndex: 2 })
			);

			expect(result.current.selectedIndex).toBe(2);
			expect(result.current.selectedItem).toEqual(mockItems[2]);
		});

		test('should handle empty items array', () => {
			const { result } = renderHook(() => useNavigation([]));

			expect(result.current.selectedIndex).toBe(0);
			expect(result.current.selectedItem).toBeNull();
		});

		test('should handle object with length property', () => {
			const itemsWithLength = { length: 5 };
			const { result } = renderHook(() => useNavigation(itemsWithLength));

			expect(result.current.selectedIndex).toBe(0);
			expect(result.current.selectedItem).toBeNull();
		});
	});

	describe('navigation controls', () => {
		test('should move down on navigateDown', () => {
			const { result } = renderHook(() => useNavigation(mockItems));

			act(() => {
				result.current.navigateDown();
			});

			expect(result.current.selectedIndex).toBe(1);
			expect(result.current.selectedItem).toEqual(mockItems[1]);
		});

		test('should move up on navigateUp', () => {
			const { result } = renderHook(() =>
				useNavigation(mockItems, { initialIndex: 1 })
			);

			act(() => {
				result.current.navigateUp();
			});

			expect(result.current.selectedIndex).toBe(0);
			expect(result.current.selectedItem).toEqual(mockItems[0]);
		});

		test('should handle pageDown', () => {
			const { result } = renderHook(() => useNavigation(mockItems));

			act(() => {
				result.current.pageDown();
			});

			// With only 3 items, pageDown should go to the last item
			expect(result.current.selectedIndex).toBe(2);
		});

		test('should handle pageUp', () => {
			const { result } = renderHook(() =>
				useNavigation(mockItems, { initialIndex: 2 })
			);

			act(() => {
				result.current.pageUp();
			});

			expect(result.current.selectedIndex).toBe(0);
		});
	});

	describe('boundary conditions', () => {
		test('should loop to end when going up from beginning with loop enabled', () => {
			const { result } = renderHook(() =>
				useNavigation(mockItems, { loop: true })
			);

			act(() => {
				result.current.navigateUp();
			});

			expect(result.current.selectedIndex).toBe(2);
			expect(result.current.selectedItem).toEqual(mockItems[2]);
		});

		test('should stay at beginning when going up with loop disabled', () => {
			const { result } = renderHook(() =>
				useNavigation(mockItems, { loop: false })
			);

			act(() => {
				result.current.navigateUp();
			});

			expect(result.current.selectedIndex).toBe(0);
			expect(result.current.selectedItem).toEqual(mockItems[0]);
		});

		test('should loop to beginning when going down from end with loop enabled', () => {
			const { result } = renderHook(() =>
				useNavigation(mockItems, { initialIndex: 2, loop: true })
			);

			act(() => {
				result.current.navigateDown();
			});

			expect(result.current.selectedIndex).toBe(0);
			expect(result.current.selectedItem).toEqual(mockItems[0]);
		});

		test('should stay at end when going down with loop disabled', () => {
			const { result } = renderHook(() =>
				useNavigation(mockItems, { initialIndex: 2, loop: false })
			);

			act(() => {
				result.current.navigateDown();
			});

			expect(result.current.selectedIndex).toBe(2);
			expect(result.current.selectedItem).toEqual(mockItems[2]);
		});
	});

	describe('selection handling', () => {
		test('should call onSelect when selectCurrent is called', () => {
			const { result } = renderHook(() =>
				useNavigation(mockItems, { onSelect: mockOnSelect })
			);

			act(() => {
				result.current.selectCurrent();
			});

			expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0], 0);
		});

		test('should not call onSelect when no item selected', () => {
			const { result } = renderHook(() =>
				useNavigation([], { onSelect: mockOnSelect })
			);

			act(() => {
				result.current.selectCurrent();
			});

			expect(mockOnSelect).not.toHaveBeenCalled();
		});
	});

	describe('programmatic selection', () => {
		test('should allow programmatic item selection', () => {
			const { result } = renderHook(() => useNavigation(mockItems));

			act(() => {
				result.current.selectItem(2);
			});

			expect(result.current.selectedIndex).toBe(2);
			expect(result.current.selectedItem).toEqual(mockItems[2]);
		});

		test('should ignore invalid selection indices', () => {
			const { result } = renderHook(() => useNavigation(mockItems));

			act(() => {
				result.current.selectItem(-1);
			});
			expect(result.current.selectedIndex).toBe(0);

			act(() => {
				result.current.selectItem(10);
			});
			expect(result.current.selectedIndex).toBe(0);
		});
	});

	describe('items array changes', () => {
		test('should adjust index when items array shrinks', () => {
			const { result, rerender } = renderHook(
				({ items }) => useNavigation(items, { initialIndex: 2 }),
				{
					initialProps: { items: mockItems }
				}
			);

			expect(result.current.selectedIndex).toBe(2);

			// Shrink array to 2 items
			rerender({ items: mockItems.slice(0, 2) });

			// Should adjust to last valid index
			expect(result.current.selectedIndex).toBe(1);
		});

		test('should handle changing to empty array', () => {
			const { result, rerender } = renderHook(
				({ items }) => useNavigation(items),
				{
					initialProps: { items: mockItems }
				}
			);

			expect(result.current.selectedItem).toEqual(mockItems[0]);

			rerender({ items: [] });

			expect(result.current.selectedIndex).toBe(0);
			expect(result.current.selectedItem).toBeNull();
		});
	});

	describe('active state', () => {
		test('should allow toggling active state', () => {
			const { result } = renderHook(() => useNavigation(mockItems));

			expect(result.current.isActive).toBe(true);

			act(() => {
				result.current.setActive(false);
			});

			expect(result.current.isActive).toBe(false);
		});
	});
});
