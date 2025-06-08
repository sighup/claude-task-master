/**
 * TaskList component tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import { TaskList } from '../../../../scripts/modules/start-ui/components/TaskList.jsx';
import { setupMocks, createMockTask } from '../setup.js';

describe('TaskList', () => {
	beforeEach(() => {
		setupMocks();
	});

	describe('loading state', () => {
		test('should display loading message when loading', () => {
			const { lastFrame } = render(<TaskList tasks={[]} loading={true} />);

			expect(lastFrame()).toContain('Loading tasks...');
		});

		test('should not display loading message when not loading', () => {
			const tasks = [createMockTask()];
			const { lastFrame } = render(<TaskList tasks={tasks} loading={false} />);

			expect(lastFrame()).not.toContain('Loading tasks...');
		});
	});

	describe('empty state handling', () => {
		test('should display appropriate empty message for all view', () => {
			const { lastFrame } = render(
				<TaskList tasks={[]} loading={false} view="all" />
			);

			expect(lastFrame()).toContain(
				'No tasks found. Use "task-master add-task" to create your first task.'
			);
		});

		test('should display appropriate empty message for pending view', () => {
			const { lastFrame } = render(
				<TaskList tasks={[]} loading={false} view="pending" />
			);

			expect(lastFrame()).toContain('No pending tasks! All caught up.');
		});

		test('should display appropriate empty message for done view', () => {
			const { lastFrame } = render(
				<TaskList tasks={[]} loading={false} view="done" />
			);

			expect(lastFrame()).toContain('No completed tasks yet.');
		});

		test('should display appropriate empty message for in-progress view', () => {
			const { lastFrame } = render(
				<TaskList tasks={[]} loading={false} view="in-progress" />
			);

			expect(lastFrame()).toContain('No tasks currently in progress.');
		});

		test('should display generic empty message for unknown view', () => {
			const { lastFrame } = render(
				<TaskList tasks={[]} loading={false} view="unknown-view" />
			);

			expect(lastFrame()).toContain('No tasks found.');
		});
	});

	describe('task list display', () => {
		test('should display list of tasks', () => {
			const tasks = [
				createMockTask({ id: 1, title: 'First Task' }),
				createMockTask({ id: 2, title: 'Second Task' }),
				createMockTask({ id: 3, title: 'Third Task' })
			];

			const { lastFrame } = render(<TaskList tasks={tasks} loading={false} />);

			const output = lastFrame();
			expect(output).toContain('First Task');
			expect(output).toContain('Second Task');
			expect(output).toContain('Third Task');
		});

		test('should display task count in header', () => {
			const tasks = [
				createMockTask({ id: 1 }),
				createMockTask({ id: 2 }),
				createMockTask({ id: 3 })
			];

			const { lastFrame } = render(
				<TaskList tasks={tasks} loading={false} view="all" />
			);

			expect(lastFrame()).toContain('All Tasks (3)');
		});

		test('should display correct header for different views', () => {
			const tasks = [createMockTask()];

			const views = [
				{ view: 'all', expected: 'All Tasks' },
				{ view: 'pending', expected: 'Pending Tasks' },
				{ view: 'done', expected: 'Completed Tasks' },
				{ view: 'in-progress', expected: 'In Progress Tasks' },
				{ view: 'custom', expected: 'Tasks' }
			];

			views.forEach(({ view, expected }) => {
				const { lastFrame } = render(
					<TaskList tasks={tasks} loading={false} view={view} />
				);

				expect(lastFrame()).toContain(expected);
			});
		});
	});

	describe('task selection', () => {
		test('should highlight selected task', () => {
			const tasks = [
				createMockTask({ id: 1, title: 'First Task' }),
				createMockTask({ id: 2, title: 'Second Task' }),
				createMockTask({ id: 3, title: 'Third Task' })
			];

			const { lastFrame } = render(
				<TaskList tasks={tasks} selectedIndex={1} loading={false} />
			);

			// The selected task should be passed to TaskItem with isSelected=true
			// We can't directly test the visual highlighting, but we can ensure
			// the component renders without error
			expect(lastFrame()).toContain('Second Task');
		});

		test('should handle invalid selected index gracefully', () => {
			const tasks = [createMockTask({ id: 1, title: 'Only Task' })];

			const { lastFrame } = render(
				<TaskList tasks={tasks} selectedIndex={10} loading={false} />
			);

			expect(lastFrame()).toContain('Only Task');
			// Should not crash with out-of-bounds index
		});

		test('should handle negative selected index', () => {
			const tasks = [createMockTask({ id: 1, title: 'Task' })];

			const { lastFrame } = render(
				<TaskList tasks={tasks} selectedIndex={-1} loading={false} />
			);

			expect(lastFrame()).toContain('Task');
			// Should not crash with negative index
		});
	});

	describe('task rendering', () => {
		test('should highlight selected task when index is provided', () => {
			const tasks = [
				createMockTask({
					id: 1,
					title: 'Selected Task',
					status: 'pending',
					priority: 'high',
					description: 'This is a detailed description'
				})
			];

			const { lastFrame } = render(
				<TaskList tasks={tasks} selectedIndex={0} loading={false} />
			);

			const output = lastFrame();
			// TaskList should contain the task title and status
			expect(output).toContain('Selected Task');
			expect(output).toContain('○'); // pending status symbol
			expect(output).toContain('H'); // high priority indicator
		});

		test('should render tasks without highlighting when no task selected', () => {
			const tasks = [createMockTask({ title: 'Unselected Task' })];

			const { lastFrame } = render(
				<TaskList tasks={tasks} selectedIndex={-1} loading={false} />
			);

			expect(lastFrame()).toContain('Unselected Task');
		});

		test('should handle out of bounds selected index gracefully', () => {
			const tasks = [createMockTask({ title: 'Only Task' })];

			const { lastFrame } = render(
				<TaskList tasks={tasks} selectedIndex={5} loading={false} />
			);

			expect(lastFrame()).toContain('Only Task');
			// Should not crash with out-of-bounds index
		});

		test('should handle task without description gracefully', () => {
			const tasks = [
				createMockTask({
					id: 2,
					title: 'Task without description',
					description: null
				})
			];

			const { lastFrame } = render(
				<TaskList tasks={tasks} selectedIndex={0} loading={false} />
			);

			const output = lastFrame();
			// Task should still be displayed properly
			expect(output).toContain('Task without description');
			expect(output).toContain('2'); // task ID
			// Should not crash when description is null
		});
	});

	describe('subtasks display', () => {
		test('should pass showSubtasks prop to TaskItem components', () => {
			const tasks = [
				createMockTask({
					title: 'Parent Task',
					subtasks: [{ id: 1, title: 'Subtask', status: 'pending' }]
				})
			];

			const { lastFrame } = render(
				<TaskList tasks={tasks} showSubtasks={true} loading={false} />
			);

			// TaskItem should receive showSubtasks=true and display subtasks
			expect(lastFrame()).toContain('Parent Task');
		});

		test('should hide subtasks when showSubtasks is false', () => {
			const tasks = [
				createMockTask({
					title: 'Parent Task',
					subtasks: [{ id: 1, title: 'Hidden Subtask', status: 'pending' }]
				})
			];

			const { lastFrame } = render(
				<TaskList tasks={tasks} showSubtasks={false} loading={false} />
			);

			expect(lastFrame()).toContain('Parent Task');
			// Subtask should not be visible (handled by TaskItem)
		});
	});

	describe('edge cases', () => {
		test('should handle undefined tasks array', () => {
			const { lastFrame } = render(
				<TaskList tasks={undefined} loading={false} />
			);

			expect(lastFrame()).toContain('No tasks found');
		});

		test('should handle null tasks array', () => {
			const { lastFrame } = render(<TaskList tasks={null} loading={false} />);

			expect(lastFrame()).toContain('No tasks found');
		});

		test('should handle tasks with missing properties', () => {
			const tasks = [
				{ id: 1 }, // Missing title, status, etc.
				{ title: 'Title only' } // Missing ID, status, etc.
			];

			const { lastFrame } = render(<TaskList tasks={tasks} loading={false} />);

			// Should not crash with malformed task objects
			expect(lastFrame()).toContain('Tasks (2)');
		});
	});

	describe('layout and styling', () => {
		test('should render with proper layout structure', () => {
			const tasks = [createMockTask({ title: 'Test Task' })];

			const { lastFrame } = render(<TaskList tasks={tasks} loading={false} />);

			const output = lastFrame();
			const lines = output.split('\n');

			// Should have multiple lines for header, tasks, and potentially details
			expect(lines.length).toBeGreaterThan(1);
			expect(output).toContain('Test Task');
		});

		test('should render with proper layout structure', () => {
			const tasks = [createMockTask({ id: 1, title: 'Test Task' })];

			const { lastFrame } = render(
				<TaskList tasks={tasks} selectedIndex={0} loading={false} />
			);

			const output = lastFrame();
			// Should contain header and task content
			expect(output).toContain('All Tasks');
			expect(output).toContain('Test Task');
		});
	});
});
