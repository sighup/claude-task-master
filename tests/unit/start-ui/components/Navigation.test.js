/**
 * Navigation component tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import { Navigation } from '../../../../scripts/modules/start-ui/components/Navigation.jsx';
import { setupMocks } from '../setup.js';

describe('Navigation', () => {
	let mockOnViewChange;

	beforeEach(() => {
		setupMocks();
		mockOnViewChange = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('view display', () => {
		test('should display current view with task counts', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={10}
					doneTasks={3}
					inProgressTasks={2}
					pendingTasks={5}
					totalNavigableItems={10}
					selectedIndex={0}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('All Tasks (10)');
		});

		test('should display correct label for each view', () => {
			const views = [
				{ key: 'all', expected: 'All Tasks (10)' },
				{ key: 'pending', expected: 'Pending (5)' },
				{ key: 'in-progress', expected: 'In Progress (2)' },
				{ key: 'completed', expected: 'Completed (3)' }
			];

			views.forEach(({ key, expected }) => {
				const { lastFrame } = render(
					<Navigation
						currentView={key}
						onViewChange={mockOnViewChange}
						totalTasks={10}
						doneTasks={3}
						inProgressTasks={2}
						pendingTasks={5}
						totalNavigableItems={key === 'all' ? 10 : 
							key === 'pending' ? 5 :
							key === 'in-progress' ? 2 : 3}
						selectedIndex={0}
					/>
				);

				const output = lastFrame();
				expect(output).toContain(expected);
			});
		});
	});

	describe('showing information', () => {
		test('should display item range and percentage', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={10}
					doneTasks={3}
					totalNavigableItems={10}
					selectedIndex={2}
				/>
			);

			const output = lastFrame();
			// Selected index 2 means showing item 3
			expect(output).toContain('Showing   3-  3 of  10');
			// 3 done out of 10 total = 30%
			expect(output).toContain('( 30%)');
		});

		test('should calculate percentage correctly for filtered views', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="pending" 
					onViewChange={mockOnViewChange}
					totalTasks={10}
					pendingTasks={5}
					totalNavigableItems={5}
					selectedIndex={0}
				/>
			);

			const output = lastFrame();
			// 5 navigable items out of 10 total = 50%
			expect(output).toContain('( 50%)');
		});

		test('should handle zero tasks gracefully', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={0}
					doneTasks={0}
					totalNavigableItems={0}
					selectedIndex={0}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('All Tasks (0)');
			expect(output).toContain('(  0%)');
		});
	});

	describe('view change callback', () => {
		test('should not call onViewChange during render', () => {
			render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={10}
					doneTasks={3}
				/>
			);

			// onViewChange should not be called just by rendering
			expect(mockOnViewChange).not.toHaveBeenCalled();
		});

		test('should handle undefined onViewChange gracefully', () => {
			// Should not crash when onViewChange is not provided
			expect(() => {
				render(
					<Navigation 
						currentView="all" 
						onViewChange={undefined}
						totalTasks={10}
					/>
				);
			}).not.toThrow();
		});

		test('should handle null onViewChange gracefully', () => {
			// Should not crash when onViewChange is null
			expect(() => {
				render(
					<Navigation 
						currentView="all" 
						onViewChange={null}
						totalTasks={10}
					/>
				);
			}).not.toThrow();
		});
	});

	describe('different view states', () => {
		test('should render correctly with all view active', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={20}
					doneTasks={5}
					inProgressTasks={3}
					pendingTasks={12}
					totalNavigableItems={20}
					selectedIndex={0}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('All Tasks (20)');
			// 5 done out of 20 = 25%
			expect(output).toContain('( 25%)');
		});

		test('should render correctly with pending view active', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="pending" 
					onViewChange={mockOnViewChange}
					totalTasks={20}
					pendingTasks={12}
					totalNavigableItems={12}
					selectedIndex={0}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Pending (12)');
			// 12 navigable out of 20 total = 60%
			expect(output).toContain('( 60%)');
		});

		test('should render correctly with in-progress view active', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="in-progress" 
					onViewChange={mockOnViewChange}
					totalTasks={20}
					inProgressTasks={3}
					totalNavigableItems={3}
					selectedIndex={1}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('In Progress (3)');
			// Selected index 1 means showing item 2
			expect(output).toContain('Showing   2-  2 of   3');
		});

		test('should render correctly with completed view active', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="completed" 
					onViewChange={mockOnViewChange}
					totalTasks={20}
					doneTasks={5}
					totalNavigableItems={5}
					selectedIndex={4}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Completed (5)');
			// Selected index 4 means showing item 5
			expect(output).toContain('Showing   5-  5 of   5');
		});
	});

	describe('edge cases', () => {
		test('should handle unknown current view', () => {
			const { lastFrame } = render(
				<Navigation
					currentView="unknown-view"
					onViewChange={mockOnViewChange}
					totalTasks={10}
					totalNavigableItems={10}
				/>
			);

			const output = lastFrame();
			// Should handle gracefully - component might show undefined or default
			expect(output).toBeDefined();
		});

		test('should handle missing props', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			// Should show default values
			expect(output).toContain('All Tasks (0)');
			expect(output).toContain('(  0%)');
		});

		test('should handle negative selectedIndex', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={10}
					totalNavigableItems={10}
					selectedIndex={-1}
				/>
			);

			const output = lastFrame();
			// -1 + 1 = 0, should show as item 0
			expect(output).toContain('Showing   0-  0');
		});

		test('should handle selectedIndex beyond total items', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={10}
					totalNavigableItems={10}
					selectedIndex={15}
				/>
			);

			const output = lastFrame();
			// Should show 16 but cap at 10
			expect(output).toContain('Showing  16- 10 of  10');
		});
	});

	describe('formatting and layout', () => {
		test('should pad numbers correctly', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={100}
					doneTasks={99}
					totalNavigableItems={100}
					selectedIndex={98}
				/>
			);

			const output = lastFrame();
			// Numbers should be padded to 3 digits
			expect(output).toContain('Showing  99- 99 of 100');
			expect(output).toContain('( 99%)');
		});

		test('should include separator between label and showing info', () => {
			const { lastFrame } = render(
				<Navigation 
					currentView="all" 
					onViewChange={mockOnViewChange}
					totalTasks={10}
					totalNavigableItems={10}
				/>
			);

			const output = lastFrame();
			// Should have a separator
			expect(output).toContain(' - ');
		});
	});
});