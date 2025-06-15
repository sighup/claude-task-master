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
		jest.runOnlyPendingTimers();
		jest.clearAllTimers();
		jest.useRealTimers();
		jest.restoreAllMocks();
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
			// StatusBar format includes spaces and padding
			expect(output).toMatch(/Done:\s+3/); // completed
			expect(output).toMatch(/In Progress:\s+2/); // in progress
			expect(output).toMatch(/Pending:\s+5/); // pending
			expect(output).toMatch(/Total:\s+10/);
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
			expect(output).toMatch(/Done:\s+0/);
			expect(output).toMatch(/In Progress:\s+0/);
			expect(output).toMatch(/Pending:\s+0/);
			expect(output).toMatch(/Total:\s+0/);
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
			expect(output).toMatch(/Done:\s+750/);
			expect(output).toMatch(/In Progress:\s+100/);
			expect(output).toMatch(/Pending:\s+150/);
			expect(output).toMatch(/Total:\s+1000/);
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

			const output = lastFrame();
			expect(output).toContain('Error: Failed to load tasks');
			// Task counts are still shown on left
			expect(output).toMatch(/Done:/);
			// Right side shows error instead of Total
			expect(output).not.toMatch(/Total:/);
		});

		test('should show task counts when no error', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
					error={null}
				/>
			);

			const output = lastFrame();
			expect(output).not.toContain('Error:');
			expect(output).toMatch(/Done:/);
			expect(output).toMatch(/Total:/);
		});

		test('should handle empty error string', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
					error=""
				/>
			);

			// Empty error should be treated as no error
			const output = lastFrame();
			expect(output).not.toContain('Error:');
			expect(output).toMatch(/Total:/);
		});
	});

	describe('progress calculation', () => {
		test('should calculate progress percentage correctly', () => {
			const metadata = createMockMetadata({
				totalTasks: 10,
				completedTasks: 3
			});

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={metadata} />
			);

			// 3/10 = 30%
			expect(lastFrame()).toContain('Tasks Progress:');
			expect(lastFrame()).toMatch(/30%/);
		});

		test('should show 0% when no tasks completed', () => {
			const metadata = createMockMetadata({
				totalTasks: 10,
				completedTasks: 0
			});

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={metadata} />
			);

			expect(lastFrame()).toMatch(/0%/);
		});

		test('should show 100% when all tasks completed', () => {
			const metadata = createMockMetadata({
				totalTasks: 10,
				completedTasks: 10
			});

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={metadata} />
			);

			expect(lastFrame()).toMatch(/100%/);
		});

		test('should handle zero total tasks', () => {
			const metadata = createMockMetadata({
				totalTasks: 0,
				completedTasks: 0
			});

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={metadata} />
			);

			// Should show 0% when no tasks
			expect(lastFrame()).toMatch(/0%/);
		});
	});

	describe('current time display', () => {
		test('should display current time', () => {
			const mockDate = new Date(2023, 0, 1, 14, 30, 45);
			jest.setSystemTime(mockDate);

			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={createMockMetadata()} />
			);

			// Should show time in HH:MM:SS format
			expect(lastFrame()).toContain('14:30:45');
		});

		test.skip('should update time every second', () => {
			const mockDate = new Date(2023, 0, 1, 14, 30, 45);
			jest.setSystemTime(mockDate);

			const { lastFrame, rerender } = render(
				<StatusBar projectRoot="/test/project" metadata={createMockMetadata()} />
			);

			// Initial time
			expect(lastFrame()).toContain('14:30:45');

			// Advance time and system time
			jest.advanceTimersByTime(1000);
			jest.setSystemTime(new Date(2023, 0, 1, 14, 30, 46));

			// Force re-render to see time update
			rerender(<StatusBar projectRoot="/test/project" metadata={createMockMetadata()} />);

			// Time should have updated
			expect(lastFrame()).toContain('14:30:46');
		});
	});

	describe('task navigation display', () => {
		test('should display current task position', () => {
			const metadata = createMockMetadata({ totalTasks: 10 });

			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={metadata}
					selectedIndex={2}
				/>
			);

			// selectedIndex 2 = task 3
			expect(lastFrame()).toMatch(/Task\s+3\/\s*10/);
		});

		test('should handle no selection', () => {
			const metadata = createMockMetadata({ totalTasks: 10 });

			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={metadata}
					selectedIndex={-1}
				/>
			);

			// -1 + 1 = 0
			expect(lastFrame()).toMatch(/Task\s+0\/\s*10/);
		});

		test('should pad task numbers', () => {
			const metadata = createMockMetadata({ totalTasks: 100 });

			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={metadata}
					selectedIndex={8}
				/>
			);

			// Should pad single digit with space
			expect(lastFrame()).toMatch(/Task\s+9\/100/);
		});
	});

	describe('API key warning', () => {
		test('should show warning when API keys missing', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
					projectStatus={{
						missingApiKeys: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY']
					}}
				/>
			);

			expect(lastFrame()).toContain('⚠️  Missing API keys:');
			expect(lastFrame()).toContain('OPENAI_API_KEY');
			expect(lastFrame()).toContain('ANTHROPIC_API_KEY');
		});

		test('should not show warning when no keys missing', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
					projectStatus={{
						missingApiKeys: []
					}}
				/>
			);

			expect(lastFrame()).not.toContain('⚠️  Missing API keys:');
		});

		test('should handle null project status', () => {
			const { lastFrame } = render(
				<StatusBar
					projectRoot="/test/project"
					metadata={createMockMetadata()}
					projectStatus={null}
				/>
			);

			expect(lastFrame()).not.toContain('⚠️  Missing API keys:');
		});
	});

	describe('metadata defaults', () => {
		test('should handle missing metadata gracefully', () => {
			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={null} />
			);

			const output = lastFrame();
			// Should show default values
			expect(output).toMatch(/Done:\s+0/);
			expect(output).toMatch(/In Progress:\s+0/);
			expect(output).toMatch(/Pending:\s+0/);
			expect(output).toMatch(/Total:\s+0/);
		});

		test('should handle undefined metadata', () => {
			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={undefined} />
			);

			const output = lastFrame();
			expect(output).toMatch(/Done:\s+0/);
			expect(output).toMatch(/Total:\s+0/);
		});

		test('should handle empty metadata object', () => {
			const { lastFrame } = render(
				<StatusBar projectRoot="/test/project" metadata={{}} />
			);

			const output = lastFrame();
			expect(output).toMatch(/Done:\s+0/);
			expect(output).toMatch(/Total:\s+0/);
		});
	});
});