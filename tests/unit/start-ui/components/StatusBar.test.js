/**
 * StatusBar component tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import { StatusBar } from '../../../../scripts/modules/start-ui/components/StatusBar.jsx';
import { setupMocks, createMockMetadata } from '../setup.js';

describe('StatusBar', () => {
	beforeEach(() => {
		setupMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	describe('project information display', () => {
		test('should display project name from path', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/path/to/my-project"
					metadata={createMockMetadata()}
				/>
			);

			expect(lastFrame()).toContain('Task Master AI');
			expect(lastFrame()).toContain('my-project');
		});

		test('should handle unknown project when no root provided', () => {
			const { lastFrame } = render(
				<StatusBar projectRoot={null} metadata={createMockMetadata()} />
			);

			expect(lastFrame()).toContain('Unknown Project');
		});

		test('should extract project name from complex path', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/very/long/path/to/my-awesome-project"
					metadata={createMockMetadata()}
				/>
			);

			expect(lastFrame()).toContain('my-awesome-project');
		});
	});

	describe('task statistics display', () => {
		test('should display task counts correctly', () => {
			const metadata = createMockMetadata({
				totalTasks: 10,
				completedTasks: 3,
				inProgressTasks: 2,
				pendingTasks: 5
			});

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={metadata} />
			);

			const output = lastFrame();
			expect(output).toContain('Done: 3'); // completed
			expect(output).toContain('In Progress: 2'); // in progress
			expect(output).toContain('Pending: 5'); // pending
			expect(output).toContain('Total: 10');
		});

		test('should handle zero task counts', () => {
			const metadata = createMockMetadata({
				totalTasks: 0,
				completedTasks: 0,
				inProgressTasks: 0,
				pendingTasks: 0
			});

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={metadata} />
			);

			const output = lastFrame();
			expect(output).toContain('Done: 0');
			expect(output).toContain('In Progress: 0');
			expect(output).toContain('Pending: 0');
			expect(output).toContain('Total: 0');
		});

		test('should handle large task counts', () => {
			const metadata = createMockMetadata({
				totalTasks: 1000,
				completedTasks: 750,
				inProgressTasks: 100,
				pendingTasks: 150
			});

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={metadata} />
			);

			const output = lastFrame();
			expect(output).toContain('Done: 750');
			expect(output).toContain('In Progress: 100');
			expect(output).toContain('Pending: 150');
			expect(output).toContain('Total: 1000');
		});
	});

	describe('error handling', () => {
		test('should display error message when error provided', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
					error="Failed to load tasks"
				/>
			);

			expect(lastFrame()).toContain('Error: Failed to load tasks');
			// Task counts are still shown on left, but Total is replaced by error on right
			expect(lastFrame()).toContain('Done:'); // Left side still shows
			expect(lastFrame()).not.toContain('Total:'); // Right side shows error instead
		});

		test('should show task counts when no error', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
					error={null}
				/>
			);

			expect(lastFrame()).not.toContain('Error:');
			expect(lastFrame()).toContain('Done:');
			expect(lastFrame()).toContain('Total:');
		});

		test('should handle empty error string', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
					error=""
				/>
			);

			// Empty string should not trigger error display
			expect(lastFrame()).not.toContain('Error:');
			expect(lastFrame()).toContain('Total:');
		});
	});

	describe('layout and styling', () => {
		test('should render with border styling', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
				/>
			);

			// Should contain border characters
			const output = lastFrame();
			expect(output).toMatch(/[┌┐└┘│─]/); // Should contain border characters
		});

		test('should maintain consistent layout structure', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
				/>
			);

			const lines = lastFrame().split('\n');

			// Should have multiple lines due to box border
			expect(lines.length).toBeGreaterThan(1);

			// Should have consistent structure
			expect(lines[0]).toMatch(/┌.*┐/); // Top border
			expect(lines[lines.length - 1]).toMatch(/└.*┘/); // Bottom border
		});
	});

	describe('responsive behavior', () => {
		test('should handle undefined metadata gracefully', () => {
			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={undefined} />
			);

			// Should not crash and should show project name
			expect(lastFrame()).toContain('Task Master AI');
			expect(lastFrame()).toContain('project');
		});

		test('should handle partial metadata', () => {
			const partialMetadata = {
				totalTasks: 5,
				completedTasks: 2
				// Missing inProgressTasks and pendingTasks
			};

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={partialMetadata} />
			);

			const output = lastFrame();
			expect(output).toContain('Total: 5');
			expect(output).toContain('Done: 2');
			// Should handle undefined values gracefully
		});
	});
});
